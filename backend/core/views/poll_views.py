"""
Polls Views – /api/polls/
Smart polls with AI-powered consensus summary via Gemini.
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from core.models import Poll, PollOption, Vote, Group, ActivityLog
from core.utils.gemini_utils import summarize_poll_reasons
from core.views.auth_views import _get_user_from_token, _get_client_ip


@csrf_exempt
@require_http_methods(["GET"])
def list_polls(request, group_id):
    """List all polls in a group."""
    try:
        group = Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return JsonResponse({"error": "Group not found"}, status=404)

    polls = Poll.objects.filter(group=group).order_by("-created_at")
    return JsonResponse({"polls": [p.to_dict() for p in polls]})


@csrf_exempt
@require_http_methods(["POST"])
def create_poll(request):
    """Create a poll with options."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Request body must be JSON"}, status=400)

    required = ["group_id", "question", "options"]
    for f in required:
        if f not in data:
            return JsonResponse({"error": f"'{f}' is required"}, status=422)

    options_data = data["options"]
    if not isinstance(options_data, list) or len(options_data) < 2:
        return JsonResponse({"error": "At least 2 options required"}, status=422)

    try:
        group = Group.objects.get(id=data["group_id"])
    except Group.DoesNotExist:
        return JsonResponse({"error": "Group not found"}, status=404)

    poll = Poll.objects.create(
        group=group,
        question=data["question"].strip(),
        created_by=user,
        ends_at=data.get("ends_at"),
    )

    for opt in options_data:
        text = opt.get("text") if isinstance(opt, dict) else str(opt)
        if text:
            PollOption.objects.create(poll=poll, text=str(text).strip())

    ActivityLog.objects.create(
        user=user, action="create_poll",
        details=f"Created poll: {poll.question[:60]}",
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({"message": "Poll created", "poll": poll.to_dict()}, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def vote_on_poll(request, poll_id):
    """Cast a vote with a reason. Triggers Gemini AI insight after 3+ votes."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        data = {}

    option_id = data.get("option_id")
    reason = data.get("reason", "").strip()

    if not option_id or not reason:
        return JsonResponse({"error": "'option_id' and 'reason' are required"}, status=422)

    try:
        poll = Poll.objects.get(id=poll_id)
    except Poll.DoesNotExist:
        return JsonResponse({"error": "Poll not found"}, status=404)

    if Vote.objects.filter(poll=poll, user=user).exists():
        return JsonResponse({"error": "You have already voted on this poll"}, status=409)

    try:
        option = PollOption.objects.get(id=option_id, poll=poll)
    except PollOption.DoesNotExist:
        return JsonResponse({"error": "Invalid option for this poll"}, status=422)

    Vote.objects.create(poll=poll, option=option, user=user, reason=reason)
    option.votes += 1
    option.save()
    poll.total_votes += 1
    poll.save()

    # Generate AI insight if 3+ votes
    if poll.total_votes >= 3 and not poll.ai_insight:
        all_reasons = list(Vote.objects.filter(poll=poll).values_list("reason", flat=True))
        insight = summarize_poll_reasons(all_reasons)
        if insight:
            poll.ai_insight = insight
            poll.save()

    ActivityLog.objects.create(
        user=user, action="vote",
        details=f"Voted on poll #{poll.id}: {option.text}",
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({
        "message": "Vote recorded",
        "poll": poll.to_dict(),
        "ai_insight_generated": bool(poll.ai_insight),
    })


@csrf_exempt
@require_http_methods(["GET"])
def get_poll(request, poll_id):
    """Get a single poll by ID."""
    try:
        poll = Poll.objects.get(id=poll_id)
    except Poll.DoesNotExist:
        return JsonResponse({"error": "Poll not found"}, status=404)
    return JsonResponse({"poll": poll.to_dict()})

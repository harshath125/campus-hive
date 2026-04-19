"""
Vibe Matcher Views – /api/vibe/
Enhanced ML-based student matching using TF-IDF + cosine similarity + weighted scoring.
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import models as db_models

from core.models import User, ActivityLog
from core.utils.vibe_algorithm import find_vibe_matches, get_common_tags
from core.utils.ai_utils import generate_vibe_insight
from core.views.auth_views import _get_user_from_token, _get_client_ip


@csrf_exempt
@require_http_methods(["GET"])
def get_vibe_matches(request):
    """
    Find top vibe matches for the current user using enhanced ML algorithm.
    TF-IDF + Cosine Similarity + Weighted Multi-Factor Scoring.
    Returns top 10 matches sorted by score (descending).
    """
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    if not user.tags:
        return JsonResponse({
            "matches": [],
            "tip": "Add tags to your profile to find vibe matches!"
        })

    # Get all other active users with tags
    all_users = User.objects.filter(
        is_active=True
    ).exclude(id=user.id)

    # Run the enhanced matching algorithm
    matches = find_vibe_matches(user, all_users, top_n=10)

    # Use instant fallback insights (AI calls removed for speed — each took 2-4s)
    for match in matches:
        common = match["common_tags"]
        from core.utils.ai_utils import _fallback_insight
        match["insight"] = _fallback_insight(common)

    # Log activity
    ActivityLog.objects.create(
        user=user, action="vibe_match",
        details=f"Found {len(matches)} matches (top score: {matches[0]['score'] if matches else 0}%)",
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({
        "your_tags": user.tags,
        "matches": matches,
        "total_considered": all_users.count(),
        "algorithm": "TF-IDF + Cosine Similarity + Weighted Multi-Factor",
    })


@csrf_exempt
@require_http_methods(["GET"])
def get_vibe_score(request):
    """Return the current user's vibe score."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)
    return JsonResponse({"vibe_score": user.vibe_score, "tags": user.tags or []})


@csrf_exempt
@require_http_methods(["POST"])
def update_tags(request):
    """Update the current user's interest tags."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        data = {}

    tags = data.get("tags", [])
    if not isinstance(tags, list):
        return JsonResponse({"error": "'tags' must be a list of strings"}, status=422)

    # Deduplicate and lowercase
    user.tags = list(set(t.strip().lower() for t in tags if t.strip()))
    user.save()

    ActivityLog.objects.create(
        user=user, action="update_profile",
        details=f"Updated tags: {', '.join(user.tags)}",
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({
        "message": "Tags updated successfully",
        "tags": user.tags,
    })


# ── Vibe Request Endpoints ─────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def send_vibe_request(request):
    """Send a vibe connection request to another user."""
    from core.models import VibeRequest
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization required"}, status=401)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    target_id = data.get("target_user_id")
    if not target_id:
        return JsonResponse({"error": "target_user_id required"}, status=400)

    try:
        target = User.objects.get(id=target_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    if target.id == user.id:
        return JsonResponse({"error": "Cannot send request to yourself"}, status=400)

    # Check if already exists in either direction
    existing = VibeRequest.objects.filter(from_user=user, to_user=target).first()
    if existing:
        return JsonResponse({"error": "Request already sent", "request": existing.to_dict()}, status=409)

    reverse = VibeRequest.objects.filter(from_user=target, to_user=user, status="pending").first()
    if reverse:
        # Auto-accept if they already sent us one
        from django.utils import timezone
        reverse.status = "accepted"
        reverse.responded_at = timezone.now()
        reverse.save()
        ActivityLog.objects.create(user=user, action="vibe_match", details=f"Auto-accepted vibe request from {target.name}", ip_address=_get_client_ip(request))
        return JsonResponse({"message": "Auto-accepted! You both matched.", "request": reverse.to_dict()})

    vr = VibeRequest.objects.create(
        from_user=user,
        to_user=target,
        score=data.get("score", 0),
        message=data.get("message", ""),
    )
    ActivityLog.objects.create(user=user, action="vibe_match", details=f"Sent vibe request to {target.name} (score: {vr.score}%)", ip_address=_get_client_ip(request))
    return JsonResponse({"message": "Vibe request sent!", "request": vr.to_dict()}, status=201)


@csrf_exempt
@require_http_methods(["GET"])
def get_vibe_requests(request):
    """Get incoming and outgoing vibe requests for the current user."""
    from core.models import VibeRequest
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization required"}, status=401)

    incoming = VibeRequest.objects.filter(to_user=user).select_related("from_user", "to_user")
    outgoing = VibeRequest.objects.filter(from_user=user).select_related("from_user", "to_user")
    connections = VibeRequest.objects.filter(
        status="accepted"
    ).filter(
        db_models.Q(from_user=user) | db_models.Q(to_user=user)
    ).select_related("from_user", "to_user")

    return JsonResponse({
        "incoming": [r.to_dict() for r in incoming],
        "outgoing": [r.to_dict() for r in outgoing],
        "connections": [r.to_dict() for r in connections],
        "pending_count": incoming.filter(status="pending").count(),
    })


@csrf_exempt
@require_http_methods(["POST"])
def respond_vibe_request(request, request_id):
    """Accept or decline a vibe request."""
    from core.models import VibeRequest
    from django.utils import timezone
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization required"}, status=401)

    try:
        vr = VibeRequest.objects.get(id=request_id, to_user=user)
    except VibeRequest.DoesNotExist:
        return JsonResponse({"error": "Request not found"}, status=404)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        data = {}

    action = data.get("action", "accept")
    if action == "accept":
        vr.status = "accepted"
    else:
        vr.status = "declined"
    vr.responded_at = timezone.now()
    vr.save()

    ActivityLog.objects.create(user=user, action="vibe_match", details=f"{action.title()}ed vibe request from {vr.from_user.name}", ip_address=_get_client_ip(request))
    return JsonResponse({"message": f"Request {vr.status}", "request": vr.to_dict()})


# ── AI Endpoints ───────────────────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def ai_generate_tasks(request):
    """Generate AI-powered Kanban tasks for an event based on user input."""
    from core.utils.ai_utils import generate_event_tasks
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization required"}, status=401)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    event_details = data.get("event_details", "")
    member_count = data.get("member_count", 5)

    if not event_details.strip():
        return JsonResponse({"error": "event_details is required"}, status=422)

    tasks = generate_event_tasks(event_details, member_count)
    return JsonResponse({"tasks": tasks, "ai_powered": True})


@csrf_exempt
@require_http_methods(["POST"])
def ai_poll_insight(request):
    """Generate AI insight for a poll question and options."""
    from core.utils.ai_utils import summarize_poll_reasons
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization required"}, status=401)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    reasons = data.get("reasons", [])
    question = data.get("question", "")

    if not reasons:
        # Generate a predictive insight for new polls with no votes yet
        try:
            from core.utils.ai_utils import _get_model
            model = _get_model()
            if model:
                prompt = f"""A campus poll asks: "{question}"
Generate 3 bullet-point insights predicting key considerations for this question.
Format:
• [Key consideration 1]
• [Key consideration 2]  
• [Key consideration 3]"""
                response = model.generate_content(prompt)
                return JsonResponse({"insight": response.text.strip(), "ai_powered": True})
        except Exception:
            pass
        return JsonResponse({"insight": None, "ai_powered": False})

    insight = summarize_poll_reasons(reasons)
    return JsonResponse({"insight": insight, "ai_powered": bool(insight)})

"""
Vibe Matcher Views – /api/vibe/
Enhanced ML-based student matching using TF-IDF + cosine similarity + weighted scoring.
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from core.models import User, ActivityLog
from core.utils.vibe_algorithm import find_vibe_matches, get_common_tags
from core.utils.gemini_utils import generate_vibe_insight
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

    # Add AI-powered insights for top matches
    for match in matches[:5]:
        common = match["common_tags"]
        score = match["score"]
        other_name = match["user"]["name"]
        insight = generate_vibe_insight(user.name, other_name, common, score)
        match["insight"] = insight

    # For remaining matches, use fallback insights
    for match in matches[5:]:
        common = match["common_tags"]
        from core.utils.gemini_utils import _fallback_insight
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

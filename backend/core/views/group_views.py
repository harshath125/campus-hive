"""
Groups Views – /api/groups/
Handles: CRUD operations for groups (spaces/hives).
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from core.models import Group, GroupType, Privacy, ActivityLog
from core.views.auth_views import _get_user_from_token, _get_client_ip


@csrf_exempt
@require_http_methods(["GET"])
def list_groups(request):
    """List all groups. Filter by type with ?type=club."""
    group_type = request.GET.get("type")
    queryset = Group.objects.all()
    if group_type:
        if group_type in dict(GroupType.choices):
            queryset = queryset.filter(type=group_type)
        else:
            return JsonResponse({"error": f"Invalid group type: {group_type}"}, status=422)
    return JsonResponse({"groups": [g.to_dict() for g in queryset]})


@csrf_exempt
@require_http_methods(["POST"])
def create_group(request):
    """Create a new group. Requires authentication."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Request body must be JSON"}, status=400)

    if "name" not in data:
        return JsonResponse({"error": "'name' is required"}, status=422)

    type_str = data.get("type", "club").lower()
    privacy_str = data.get("privacy", "public").lower()

    if type_str not in dict(GroupType.choices):
        type_str = "club"
    if privacy_str not in dict(Privacy.choices):
        privacy_str = "public"

    group = Group.objects.create(
        name=data["name"].strip(),
        type=type_str,
        privacy=privacy_str,
        description=data.get("description", ""),
        icon=data.get("icon", "📚"),
        color=data.get("color", "violet"),
        admin=user,
        member_count=1,
    )

    ActivityLog.objects.create(
        user=user, action="create_group",
        details=f"Created group: {group.name}",
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({"message": "Group created", "group": group.to_dict()}, status=201)


@csrf_exempt
@require_http_methods(["GET"])
def get_group(request, group_id):
    """Get a single group by ID."""
    try:
        group = Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return JsonResponse({"error": "Group not found"}, status=404)
    return JsonResponse({"group": group.to_dict()})


@csrf_exempt
@require_http_methods(["PUT"])
def update_group(request, group_id):
    """Update group – only the admin can do this."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    try:
        group = Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return JsonResponse({"error": "Group not found"}, status=404)

    if group.admin_id != user.id:
        return JsonResponse({"error": "Only the group admin can edit this group"}, status=403)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        data = {}

    for field in ["name", "description", "icon", "color"]:
        if field in data:
            setattr(group, field, data[field])

    group.save()
    return JsonResponse({"message": "Group updated", "group": group.to_dict()})


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_group(request, group_id):
    """Delete group – admin only."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    try:
        group = Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return JsonResponse({"error": "Group not found"}, status=404)

    if group.admin_id != user.id:
        return JsonResponse({"error": "Only the group admin can delete this group"}, status=403)

    group.delete()
    return JsonResponse({"message": "Group deleted"})

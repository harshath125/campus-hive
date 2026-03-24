"""
Events Views – /api/events/
AI-powered event planner with Kanban task board.
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from core.models import Event, EventTask, Group, TaskStatusChoice, PriorityChoice, ActivityLog
from core.utils.gemini_utils import generate_event_tasks
from core.views.auth_views import _get_user_from_token, _get_client_ip


@csrf_exempt
@require_http_methods(["GET"])
def list_events(request, group_id):
    """List all events in a group."""
    try:
        group = Group.objects.get(id=group_id)
    except Group.DoesNotExist:
        return JsonResponse({"error": "Group not found"}, status=404)

    events = Event.objects.filter(group=group).order_by("-created_at")
    return JsonResponse({"events": [e.to_dict() for e in events]})


@csrf_exempt
@require_http_methods(["POST"])
def create_event(request):
    """Create a new event. Pass generate_tasks=true for AI Kanban tasks."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Request body must be JSON"}, status=400)

    if "group_id" not in data or "title" not in data:
        return JsonResponse({"error": "'group_id' and 'title' are required"}, status=422)

    try:
        group = Group.objects.get(id=data["group_id"])
    except Group.DoesNotExist:
        return JsonResponse({"error": "Group not found"}, status=404)

    event = Event.objects.create(
        group=group,
        title=data["title"].strip(),
        description=data.get("description", ""),
        date=data.get("date"),
        budget=data.get("budget"),
        attendee_count=data.get("attendee_count", 0),
        created_by=user,
    )

    # Auto-generate tasks from Gemini
    tasks_created = []
    if data.get("generate_tasks", False):
        event_details = f"Event: {event.title}\nDescription: {event.description or 'N/A'}\nBudget: {event.budget or 'N/A'}"
        ai_tasks = generate_event_tasks(event_details, group.member_count)
        for task_data in ai_tasks:
            priority = task_data.get("priority", "medium").lower()
            if priority not in dict(PriorityChoice.choices):
                priority = "medium"
            EventTask.objects.create(
                event=event,
                title=task_data.get("title", "Task"),
                description=task_data.get("description", ""),
                priority=priority,
            )
            tasks_created.append(task_data.get("title"))

    ActivityLog.objects.create(
        user=user, action="create_event",
        details=f"Created event: {event.title} (AI tasks: {len(tasks_created)})",
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({
        "message": "Event created",
        "event": event.to_dict(),
        "ai_tasks_generated": len(tasks_created),
        "tasks": tasks_created,
    }, status=201)


@csrf_exempt
@require_http_methods(["GET"])
def get_event(request, event_id):
    """Get a single event by ID."""
    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return JsonResponse({"error": "Event not found"}, status=404)
    return JsonResponse({"event": event.to_dict()})


@csrf_exempt
@require_http_methods(["POST"])
def add_task(request, event_id):
    """Manually add a task to an event."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    try:
        event = Event.objects.get(id=event_id)
    except Event.DoesNotExist:
        return JsonResponse({"error": "Event not found"}, status=404)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        data = {}

    if not data.get("title"):
        return JsonResponse({"error": "'title' is required"}, status=422)

    priority = data.get("priority", "medium").lower()
    if priority not in dict(PriorityChoice.choices):
        priority = "medium"

    assigned_to = None
    if data.get("assigned_to"):
        from core.models import User
        try:
            assigned_to = User.objects.get(id=data["assigned_to"])
        except User.DoesNotExist:
            pass

    task = EventTask.objects.create(
        event=event,
        title=data["title"].strip(),
        description=data.get("description", ""),
        priority=priority,
        assigned_to=assigned_to,
    )

    return JsonResponse({"message": "Task added", "task": task.to_dict()}, status=201)


@csrf_exempt
@require_http_methods(["PATCH"])
def update_task_status(request, task_id):
    """Update kanban task status: todo → inprogress → done."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    try:
        task = EventTask.objects.get(id=task_id)
    except EventTask.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        data = {}

    new_status = data.get("status", "").lower()
    if new_status not in dict(TaskStatusChoice.choices):
        return JsonResponse({"error": "Invalid status. Choose: todo, inprogress, done"}, status=422)

    task.status = new_status
    if "assigned_to" in data:
        if data["assigned_to"]:
            from core.models import User
            try:
                task.assigned_to = User.objects.get(id=data["assigned_to"])
            except User.DoesNotExist:
                pass
        else:
            task.assigned_to = None

    task.save()

    ActivityLog.objects.create(
        user=user, action="update_task",
        details=f"Task '{task.title}' → {new_status}",
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({"message": "Task updated", "task": task.to_dict()})

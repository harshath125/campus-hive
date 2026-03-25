"""
Admin Dashboard API – /api/admin/
Provides real-time dashboard stats, CRUD operations, and monitoring data.
Mirrors Django admin panel functionality for the frontend.
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from core.models import (
    User, Group, Poll, PollOption, Vote, Event, EventTask,
    Incident, ActivityLog, Announcement, Resource,
    BranchChoice, SECTION_CHOICES, YEAR_CHOICES,
)
from core.views.auth_views import _get_user_from_token, _get_client_ip


def _require_admin(request):
    """Check if request user is admin."""
    user = _get_user_from_token(request)
    if not user:
        return None, JsonResponse({"error": "Authorization required"}, status=401)
    if user.role != "admin" and not user.is_staff:
        return None, JsonResponse({"error": "Admin access required"}, status=403)
    return user, None


@csrf_exempt
@require_http_methods(["GET"])
def dashboard_stats(request):
    """Return live dashboard statistics for admin panel."""
    user, err = _require_admin(request)
    if err:
        return err

    now = timezone.now()
    today = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_ago = now - timedelta(days=7)

    stats = {
        "users": {
            "total": User.objects.count(),
            "active": User.objects.filter(is_active=True).count(),
            "new_today": User.objects.filter(date_joined__gte=today).count(),
            "new_this_week": User.objects.filter(date_joined__gte=week_ago).count(),
            "by_role": list(User.objects.values("role").annotate(count=Count("id"))),
            "by_branch": list(User.objects.exclude(branch="").values("branch").annotate(count=Count("id")).order_by("-count")),
            "by_year": list(User.objects.exclude(year__isnull=True).values("year").annotate(count=Count("id")).order_by("year")),
        },
        "groups": {
            "total": Group.objects.count(),
            "by_type": list(Group.objects.values("type").annotate(count=Count("id"))),
        },
        "polls": {
            "total": Poll.objects.count(),
            "active": Poll.objects.filter(ends_at__isnull=True).count(),
            "total_votes": Vote.objects.count(),
        },
        "events": {
            "total": Event.objects.count(),
            "tasks_total": EventTask.objects.count(),
            "tasks_done": EventTask.objects.filter(status="done").count(),
            "tasks_progress": EventTask.objects.filter(status="inprogress").count(),
        },
        "incidents": {
            "total": Incident.objects.count(),
            "pending": Incident.objects.filter(status="pending").count(),
            "investigating": Incident.objects.filter(status="investigating").count(),
            "resolved": Incident.objects.filter(status="resolved").count(),
            "by_severity": list(Incident.objects.values("severity").annotate(count=Count("id"))),
        },
        "activity": {
            "total": ActivityLog.objects.count(),
            "today": ActivityLog.objects.filter(timestamp__gte=today).count(),
            "recent": list(
                ActivityLog.objects.select_related("user")
                .order_by("-timestamp")[:20]
                .values("id", "action", "details", "ip_address", "timestamp", "user__email", "user__name")
            ),
        },
        "choices": {
            "branches": [{"value": c.value, "label": c.label} for c in BranchChoice],
            "sections": [{"value": v, "label": l} for v, l in SECTION_CHOICES],
            "years": [{"value": v, "label": l} for v, l in YEAR_CHOICES],
        },
    }

    return JsonResponse(stats)


@csrf_exempt
@require_http_methods(["GET"])
def list_users(request):
    """List all users with optional filtering."""
    user, err = _require_admin(request)
    if err:
        return err

    qs = User.objects.all().order_by("-date_joined")

    # Filters
    role = request.GET.get("role")
    branch = request.GET.get("branch")
    year = request.GET.get("year")
    section = request.GET.get("section")
    search = request.GET.get("search")
    active = request.GET.get("active")

    if role:
        qs = qs.filter(role=role)
    if branch:
        qs = qs.filter(branch=branch)
    if year:
        qs = qs.filter(year=int(year))
    if section:
        qs = qs.filter(section__icontains=section)
    if active is not None:
        qs = qs.filter(is_active=(active.lower() == "true"))
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(email__icontains=search))

    users = [u.to_dict() for u in qs[:100]]
    return JsonResponse({"users": users, "total": qs.count()})


@csrf_exempt
@require_http_methods(["PATCH"])
def update_user(request, user_id):
    """Update a user (admin only)."""
    admin, err = _require_admin(request)
    if err:
        return err

    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        data = {}

    for field in ["name", "role", "branch", "section", "year", "tags", "is_active"]:
        if field in data:
            setattr(target, field, data[field])
    target.save()

    ActivityLog.objects.create(
        user=admin, action="update_profile",
        details="Admin updated user %s: %s" % (target.email, ", ".join(data.keys())),
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({"message": "User updated", "user": target.to_dict()})


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_user(request, user_id):
    """Deactivate a user (soft delete)."""
    admin, err = _require_admin(request)
    if err:
        return err

    try:
        target = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return JsonResponse({"error": "User not found"}, status=404)

    target.is_active = False
    target.save()

    ActivityLog.objects.create(
        user=admin, action="update_profile",
        details="Admin deactivated user %s" % target.email,
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({"message": "User deactivated"})


@csrf_exempt
@require_http_methods(["GET"])
def list_activity_logs(request):
    """List activity logs with optional filters."""
    user, err = _require_admin(request)
    if err:
        return err

    qs = ActivityLog.objects.select_related("user").order_by("-timestamp")

    action = request.GET.get("action")
    if action:
        qs = qs.filter(action=action)

    limit = min(int(request.GET.get("limit", 50)), 200)
    logs = []
    for log in qs[:limit]:
        logs.append({
            "id": log.id,
            "user_email": log.user.email if log.user else "anonymous",
            "user_name": log.user.name if log.user else "Anonymous",
            "action": log.action,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat(),
        })

    return JsonResponse({"logs": logs, "total": qs.count()})


@csrf_exempt
@require_http_methods(["GET"])
def list_incidents_admin(request):
    """List all incidents for admin management."""
    user, err = _require_admin(request)
    if err:
        return err

    qs = Incident.objects.order_by("-created_at")

    status = request.GET.get("status")
    severity = request.GET.get("severity")
    if status:
        qs = qs.filter(status=status)
    if severity:
        qs = qs.filter(severity=severity)

    incidents = [i.to_dict() for i in qs[:100]]
    return JsonResponse({"incidents": incidents, "total": qs.count()})


@csrf_exempt
@require_http_methods(["PATCH"])
def update_incident(request, incident_id):
    """Update incident status."""
    admin, err = _require_admin(request)
    if err:
        return err

    try:
        incident = Incident.objects.get(id=incident_id)
    except Incident.DoesNotExist:
        return JsonResponse({"error": "Incident not found"}, status=404)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        data = {}

    if "status" in data:
        incident.status = data["status"]
        incident.save()

    return JsonResponse({"message": "Incident updated", "incident": incident.to_dict()})


@csrf_exempt
@require_http_methods(["GET"])
def db_health(request):
    """Check database connectivity and return basic stats."""
    user, err = _require_admin(request)
    if err:
        return err

    from django.db import connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            db_ok = True
            engine = connection.vendor
    except Exception as e:
        db_ok = False
        engine = str(e)

    tables = {
        "ch_users": User.objects.count(),
        "ch_groups": Group.objects.count(),
        "ch_polls": Poll.objects.count(),
        "ch_poll_options": PollOption.objects.count(),
        "ch_votes": Vote.objects.count(),
        "ch_events": Event.objects.count(),
        "ch_event_tasks": EventTask.objects.count(),
        "ch_incidents": Incident.objects.count(),
        "ch_activity_logs": ActivityLog.objects.count(),
    }

    return JsonResponse({
        "status": "connected" if db_ok else "error",
        "engine": engine,
        "tables": tables,
        "total_records": sum(tables.values()),
    })


# ── Bulk CSV Upload ─────────────────────────────────────────────────────────

import csv
import io
from django.contrib.auth.hashers import make_password

@csrf_exempt
@require_http_methods(["POST"])
def upload_users_csv(request):
    """Bulk create users from uploaded CSV file."""
    admin, err = _require_admin(request)
    if err:
        return err

    if "file" not in request.FILES:
        return JsonResponse({"error": "No CSV file provided"}, status=400)

    csv_file = request.FILES["file"]
    if not csv_file.name.endswith(".csv"):
        return JsonResponse({"error": "File must be a CSV"}, status=400)

    try:
        decoded_file = csv_file.read().decode("utf-8")
        io_string = io.StringIO(decoded_file)
        reader = csv.DictReader(io_string)

        users_to_create = []
        errors = []
        for i, row in enumerate(reader, start=2):
            email = row.get("email", "").strip().lower()
            name = row.get("name", "").strip()
            password = row.get("password", "").strip() or "campus123"
            role = row.get("role", "student").strip().lower()

            if not email or not name:
                errors.append(f"Row {i}: Missing email or name")
                continue
            if User.objects.filter(email=email).exists():
                errors.append(f"Row {i}: Email {email} already exists")
                continue

            # Parse tags carefully (e.g. from '[Python, Django]' or 'Python, Django')
            tags_raw = row.get("tags", "").strip()
            tags_list = []
            if tags_raw:
                # If wrapped in brackets, remove them
                if tags_raw.startswith("[") and tags_raw.endswith("]"):
                    tags_raw = tags_raw[1:-1]
                # Split by comma and strip quotes/spaces
                tags_list = [t.strip().strip("'").strip('"') for t in tags_raw.split(",") if t.strip()]

            users_to_create.append(User(
                email=email,
                name=name,
                password=make_password(password),
                role=role if role in ["student", "admin", "faculty"] else "student",
                branch=row.get("branch", "").strip(),
                section=row.get("section", "").strip(),
                year=int(row.get("year")) if row.get("year", "").isdigit() else None,
                tags=tags_list,
            ))

        if users_to_create:
            User.objects.bulk_create(users_to_create)
            ActivityLog.objects.create(
                user=admin, action="update_profile",
                details=f"Admin bulk uploaded {len(users_to_create)} users",
                ip_address=_get_client_ip(request),
            )

        return JsonResponse({
            "message": f"Successfully imported {len(users_to_create)} users",
            "errors": errors
        })

    except Exception as e:
        return JsonResponse({"error": f"Error parsing CSV: {str(e)}"}, status=400)


# ── Announcements API ───────────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["GET", "POST"])
def admin_announcements(request):
    """List or create system-wide announcements."""
    if request.method == "GET":
        qs = Announcement.objects.filter(is_active=True).order_by("-created_at")
        return JsonResponse({"announcements": [a.to_dict() for a in qs[:50]]})

    admin, err = _require_admin(request)
    if err:
        return err

    try:
        data = json.loads(request.body)
        announcement = Announcement.objects.create(
            title=data["title"],
            content=data["content"],
            created_by=admin
        )
        ActivityLog.objects.create(
            user=admin, action="update_profile",
            details=f"Admin created announcement: {announcement.title}",
            ip_address=_get_client_ip(request)
        )
        return JsonResponse({"message": "Announcement created", "announcement": announcement.to_dict()}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_announcement(request, pk):
    admin, err = _require_admin(request)
    if err: return err
    try:
        announcement = Announcement.objects.get(id=pk)
        announcement.is_active = False
        announcement.save()
        return JsonResponse({"message": "Announcement removed"})
    except Announcement.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)


# ── Resources API ───────────────────────────────────────────────────────────

@csrf_exempt
@require_http_methods(["GET", "POST"])
def admin_resources(request):
    """List or create resources."""
    if request.method == "GET":
        qs = Resource.objects.order_by("-created_at")
        return JsonResponse({"resources": [r.to_dict() for r in qs[:50]]})

    admin, err = _require_admin(request)
    if err:
        return err

    try:
        data = json.loads(request.body)
        res = Resource.objects.create(
            title=data["title"],
            description=data.get("description", ""),
            url=data["url"],
            created_by=admin
        )
        ActivityLog.objects.create(user=admin, action="update_profile", details=f"Admin added resource: {res.title}", ip_address=_get_client_ip(request))
        return JsonResponse({"message": "Resource added", "resource": res.to_dict()}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_resource(request, pk):
    admin, err = _require_admin(request)
    if err: return err
    try:
        res = Resource.objects.get(id=pk)
        res.delete()
        return JsonResponse({"message": "Resource deleted"})
    except Resource.DoesNotExist:
        return JsonResponse({"error": "Not found"}, status=404)


# ── Direct Creation APIs (Events, Groups, Polls) ────────────────────────────

@csrf_exempt
@require_http_methods(["POST"])
def admin_create_event(request):
    admin, err = _require_admin(request)
    if err: return err
    try:
        data = json.loads(request.body)
        evt = Event.objects.create(
            title=data["title"],
            description=data.get("description", ""),
            date=data["date"],
            budget=data.get("budget", 0)
        )
        return JsonResponse({"message": "Event created", "event": evt.to_dict()}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def admin_create_group(request):
    admin, err = _require_admin(request)
    if err: return err
    try:
        data = json.loads(request.body)
        grp = Group.objects.create(
            name=data["name"],
            description=data.get("description", ""),
            type=data.get("type", "club"),
            privacy=data.get("privacy", "public"),
            admin=admin
        )
        return JsonResponse({"message": "Group created", "group": grp.to_dict()}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def admin_create_poll(request):
    admin, err = _require_admin(request)
    if err: return err
    try:
        data = json.loads(request.body)
        poll = Poll.objects.create(question=data["question"], group_id=data.get("group_id"))
        for opt in data.get("options", []):
            PollOption.objects.create(poll=poll, text=opt["text"])
        return JsonResponse({"message": "Poll created"}, status=201)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=400)

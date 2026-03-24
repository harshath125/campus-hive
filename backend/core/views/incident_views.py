"""
Incidents Views – /api/incidents/
Anonymous incident reporting – intentionally bypasses authentication.
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from core.models import Incident, SeverityChoice, IncidentStatusChoice, ActivityLog
from core.views.auth_views import _get_user_from_token, _get_client_ip


@csrf_exempt
@require_http_methods(["POST"])
def report_incident(request):
    """Anonymous incident report – NO auth required."""
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Request body must be JSON"}, status=400)

    severity_str = data.get("severity", "").lower()
    description = data.get("description", "").strip()

    if not severity_str or not description:
        return JsonResponse({"error": "'severity' and 'description' are required"}, status=422)

    if severity_str not in dict(SeverityChoice.choices):
        return JsonResponse({"error": "Invalid severity. Choose from: yellow, orange, red"}, status=422)

    incident = Incident.objects.create(
        severity=severity_str,
        description=description,
        location=data.get("location", ""),
    )

    # Simulate emergency alert for RED severity
    alert_triggered = severity_str == "red"

    # Log anonymously
    ActivityLog.objects.create(
        user=None, action="report_incident",
        details=f"Anonymous [{severity_str.upper()}] incident reported",
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({
        "message": "Incident reported anonymously",
        "incident": incident.to_dict(),
        "emergency_alert": alert_triggered,
    }, status=201)


@csrf_exempt
@require_http_methods(["GET"])
def list_incidents(request):
    """List incidents filtered by status. JWT required (admin use)."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    status_filter = request.GET.get("status")
    queryset = Incident.objects.all()
    if status_filter and status_filter in dict(IncidentStatusChoice.choices):
        queryset = queryset.filter(status=status_filter)

    return JsonResponse({"incidents": [i.to_dict() for i in queryset]})


@csrf_exempt
@require_http_methods(["PATCH"])
def update_incident_status(request, incident_id):
    """Update incident status (admin action)."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    try:
        incident = Incident.objects.get(id=incident_id)
    except Incident.DoesNotExist:
        return JsonResponse({"error": "Incident not found"}, status=404)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        data = {}

    new_status = data.get("status", "").lower()
    if new_status not in dict(IncidentStatusChoice.choices):
        return JsonResponse({"error": "Invalid status. Choose: pending, investigating, resolved"}, status=422)

    incident.status = new_status
    incident.save()
    return JsonResponse({"message": "Status updated", "incident": incident.to_dict()})

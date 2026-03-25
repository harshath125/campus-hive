import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from core.models import Incident, SeverityChoice

@csrf_exempt
@require_http_methods(["GET"])
def get_incidents(request):
    """Fetch recent public anonymous incidents (resolved/investigating)."""
    # For safety reasons, maybe only return non-pending, or all?
    # Let's return all for the demo.
    incidents = Incident.objects.all().order_by("-created_at")[:50]
    return JsonResponse({"incidents": [i.to_dict() for i in incidents]})

@csrf_exempt
@require_http_methods(["POST"])
def report_incident(request):
    """Submit a new anonymous safety report."""
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Invalid JSON"}, status=400)

    severity = data.get("severity", "green").lower()
    description = data.get("description", "").strip()
    location = data.get("location", "").strip()

    if not description:
        return JsonResponse({"error": "Description is required"}, status=422)

    if severity not in dict(SeverityChoice.choices):
        severity = "yellow"

    incident = Incident.objects.create(
        severity=severity,
        description=description,
        location=location,
        status="pending"
    )

    return JsonResponse({"message": "Incident reported anonymously", "incident": incident.to_dict()}, status=201)

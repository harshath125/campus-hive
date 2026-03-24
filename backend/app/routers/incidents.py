"""
Incidents Blueprint – /api/incidents
INTENTIONALLY bypasses authentication – true anonymous reporting.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required

from app.extensions import db
from app.models import Incident, Severity, IncidentStatus
from app.security import admin_required

incidents_bp = Blueprint("incidents", __name__)


# ─── POST /api/incidents/report ───────────────────────────────────────────

@incidents_bp.route("/report", methods=["POST"])
def report_incident():
    """
    Anonymous incident report – NO auth required.
    If severity is RED, should trigger emergency alert (TODO: SMS/email).
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    severity_str = data.get("severity", "").lower()
    description = data.get("description", "").strip()

    if not severity_str or not description:
        return jsonify({"error": "'severity' and 'description' are required"}), 422

    try:
        severity = Severity(severity_str)
    except ValueError:
        return jsonify({"error": f"Invalid severity. Choose from: yellow, orange, red"}), 422

    incident = Incident(
        severity=severity,
        description=description,
        location=data.get("location"),
    )
    db.session.add(incident)
    db.session.commit()
    db.session.refresh(incident)

    # Simulate emergency alert for RED severity
    alert_triggered = False
    if severity == Severity.RED:
        alert_triggered = True
        # TODO: send SMS/email to admin (Twilio / SendGrid integration)

    return jsonify({
        "message": "Incident reported anonymously",
        "incident": incident.to_dict(),
        "emergency_alert": alert_triggered,
    }), 201


# ─── GET /api/incidents ───────────────────────────────────────────────────

@incidents_bp.route("/", methods=["GET"])
@jwt_required()
def list_incidents():
    """List incidents filtered by status. JWT required (admin use)."""
    status_filter = request.args.get("status")
    query = Incident.query
    if status_filter:
        try:
            query = query.filter_by(status=IncidentStatus(status_filter))
        except ValueError:
            pass
    incidents = query.order_by(Incident.created_at.desc()).all()
    return jsonify({"incidents": [i.to_dict() for i in incidents]}), 200


# ─── PATCH /api/incidents/<id>/status ────────────────────────────────────

@incidents_bp.route("/<int:incident_id>/status", methods=["PATCH"])
@jwt_required()
def update_status(incident_id):
    """Update incident status (admin action)."""
    incident = Incident.query.get(incident_id)
    if not incident:
        return jsonify({"error": "Incident not found"}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "").lower()
    try:
        incident.status = IncidentStatus(new_status)
    except ValueError:
        return jsonify({"error": "Invalid status. Choose: pending, investigating, resolved"}), 422

    db.session.commit()
    return jsonify({"message": "Status updated", "incident": incident.to_dict()}), 200

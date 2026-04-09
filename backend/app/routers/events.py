"""
Events Blueprint – /api/events
AI-powered event planner with Kanban task board.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Event, EventTask, Group, TaskStatus, Priority
from app.utils.ai_utils import generate_event_tasks

events_bp = Blueprint("events", __name__)


# ─── GET /api/events/group/<group_id> ─────────────────────────────────────

@events_bp.route("/group/<int:group_id>", methods=["GET"])
@jwt_required()
def list_events(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404
    events = Event.query.filter_by(group_id=group_id).order_by(Event.created_at.desc()).all()
    return jsonify({"events": [e.to_dict() for e in events]}), 200


# ─── POST /api/events ─────────────────────────────────────────────────────

@events_bp.route("/", methods=["POST"])
@jwt_required()
def create_event():
    """
    Create a new event.
    Pass generate_tasks=true to auto-generate Kanban tasks via AI.
    """
    data = request.get_json(silent=True)
    if not data or "group_id" not in data or "title" not in data:
        return jsonify({"error": "'group_id' and 'title' are required"}), 422

    group = Group.query.get(data["group_id"])
    if not group:
        return jsonify({"error": "Group not found"}), 404

    event = Event(
        group_id=data["group_id"],
        title=data["title"].strip(),
        description=data.get("description"),
        date=data.get("date"),
        budget=data.get("budget"),
        attendee_count=data.get("attendee_count", 0),
    )
    db.session.add(event)
    db.session.flush()

    # Auto-generate tasks from AI
    tasks_created = []
    if data.get("generate_tasks", False):
        event_details = f"Event: {event.title}\nDescription: {event.description or 'N/A'}\nBudget: {event.budget or 'N/A'}"
        ai_tasks = generate_event_tasks(event_details, group.member_count)
        for task_data in ai_tasks:
            try:
                priority = Priority(task_data.get("priority", "medium").lower())
            except ValueError:
                priority = Priority.MEDIUM
            task = EventTask(
                event_id=event.id,
                title=task_data.get("title", "Task"),
                description=task_data.get("description"),
                priority=priority,
            )
            db.session.add(task)
            tasks_created.append(task_data.get("title"))

    db.session.commit()
    db.session.refresh(event)
    return jsonify({
        "message": "Event created",
        "event": event.to_dict(),
        "ai_tasks_generated": len(tasks_created),
        "tasks": tasks_created,
    }), 201


# ─── GET /api/events/<id> ─────────────────────────────────────────────────

@events_bp.route("/<int:event_id>", methods=["GET"])
@jwt_required()
def get_event(event_id):
    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404
    return jsonify({"event": event.to_dict()}), 200


# ─── POST /api/events/<id>/tasks ──────────────────────────────────────────

@events_bp.route("/<int:event_id>/tasks", methods=["POST"])
@jwt_required()
def add_task(event_id):
    """Manually add a task to an event."""
    event = Event.query.get(event_id)
    if not event:
        return jsonify({"error": "Event not found"}), 404

    data = request.get_json(silent=True) or {}
    if not data.get("title"):
        return jsonify({"error": "'title' is required"}), 422

    try:
        priority = Priority(data.get("priority", "medium").lower())
    except ValueError:
        priority = Priority.MEDIUM

    task = EventTask(
        event_id=event_id,
        title=data["title"].strip(),
        description=data.get("description"),
        priority=priority,
        assigned_to=data.get("assigned_to"),
    )
    db.session.add(task)
    db.session.commit()
    db.session.refresh(task)
    return jsonify({"message": "Task added", "task": task.to_dict()}), 201


# ─── PATCH /api/events/tasks/<task_id> ────────────────────────────────────

@events_bp.route("/tasks/<int:task_id>", methods=["PATCH"])
@jwt_required()
def update_task_status(task_id):
    """Update kanban task status: todo → inprogress → done."""
    task = EventTask.query.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "").lower()
    try:
        task.status = TaskStatus(new_status)
    except ValueError:
        return jsonify({"error": "Invalid status. Choose: todo, inprogress, done"}), 422

    if "assigned_to" in data:
        task.assigned_to = data["assigned_to"]

    db.session.commit()
    return jsonify({"message": "Task updated", "task": task.to_dict()}), 200

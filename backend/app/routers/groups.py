"""
Groups Blueprint – /api/groups
Handles: create, list, get, update, delete hives (groups).
All write operations require JWT authentication.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Group, GroupType, Privacy

groups_bp = Blueprint("groups", __name__)


# ─── GET /api/groups ──────────────────────────────────────────────────────

@groups_bp.route("/", methods=["GET"])
def list_groups():
    """List all public groups. Filter by type with ?type=club."""
    group_type = request.args.get("type")
    query = Group.query
    if group_type:
        try:
            query = query.filter_by(type=GroupType(group_type))
        except ValueError:
            return jsonify({"error": f"Invalid group type: {group_type}"}), 422
    groups = query.order_by(Group.created_at.desc()).all()
    return jsonify({"groups": [g.to_dict() for g in groups]}), 200


# ─── POST /api/groups ─────────────────────────────────────────────────────

@groups_bp.route("/", methods=["POST"])
@jwt_required()
def create_group():
    """Create a new hive. Requires authentication."""
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True)
    if not data or "name" not in data:
        return jsonify({"error": "'name' is required"}), 422

    type_str = data.get("type", "club").lower()
    privacy_str = data.get("privacy", "public").lower()

    try:
        group_type = GroupType(type_str)
    except ValueError:
        group_type = GroupType.CLUB

    try:
        privacy = Privacy(privacy_str)
    except ValueError:
        privacy = Privacy.PUBLIC

    group = Group(
        name=data["name"].strip(),
        type=group_type,
        privacy=privacy,
        description=data.get("description"),
        icon=data.get("icon", "📚"),
        color=data.get("color", "violet"),
        admin_id=user_id,
        member_count=1,
    )
    db.session.add(group)
    db.session.commit()
    db.session.refresh(group)
    return jsonify({"message": "Group created", "group": group.to_dict()}), 201


# ─── GET /api/groups/<id> ─────────────────────────────────────────────────

@groups_bp.route("/<int:group_id>", methods=["GET"])
def get_group(group_id):
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404
    return jsonify({"group": group.to_dict()}), 200


# ─── PUT /api/groups/<id> ─────────────────────────────────────────────────

@groups_bp.route("/<int:group_id>", methods=["PUT"])
@jwt_required()
def update_group(group_id):
    """Update group – only the admin can do this."""
    user_id = int(get_jwt_identity())
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404
    if group.admin_id != user_id:
        return jsonify({"error": "Only the group admin can edit this group"}), 403

    data = request.get_json(silent=True) or {}
    for field in ["name", "description", "icon", "color"]:
        if field in data:
            setattr(group, field, data[field])

    db.session.commit()
    return jsonify({"message": "Group updated", "group": group.to_dict()}), 200


# ─── DELETE /api/groups/<id> ──────────────────────────────────────────────

@groups_bp.route("/<int:group_id>", methods=["DELETE"])
@jwt_required()
def delete_group(group_id):
    """Delete group – admin only."""
    user_id = int(get_jwt_identity())
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404
    if group.admin_id != user_id:
        return jsonify({"error": "Only the group admin can delete this group"}), 403
    db.session.delete(group)
    db.session.commit()
    return jsonify({"message": "Group deleted"}), 200

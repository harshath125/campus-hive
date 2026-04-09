"""
Polls Blueprint – /api/polls
Smart polls with AI-powered consensus summary (AI).
Requires JWT for all write operations.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import Poll, PollOption, Vote, Group
from app.utils.ai_utils import summarize_poll_reasons

polls_bp = Blueprint("polls", __name__)


# ─── GET /api/polls/group/<group_id> ──────────────────────────────────────

@polls_bp.route("/group/<int:group_id>", methods=["GET"])
@jwt_required()
def list_polls(group_id):
    """List all polls in a group."""
    group = Group.query.get(group_id)
    if not group:
        return jsonify({"error": "Group not found"}), 404
    polls = Poll.query.filter_by(group_id=group_id).order_by(Poll.created_at.desc()).all()
    return jsonify({"polls": [p.to_dict() for p in polls]}), 200


# ─── POST /api/polls ──────────────────────────────────────────────────────

@polls_bp.route("/", methods=["POST"])
@jwt_required()
def create_poll():
    """Create a poll with options."""
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    required = ["group_id", "question", "options"]
    for f in required:
        if f not in data:
            return jsonify({"error": f"'{f}' is required"}), 422

    options_data = data["options"]
    if not isinstance(options_data, list) or len(options_data) < 2:
        return jsonify({"error": "At least 2 options required"}), 422

    group = Group.query.get(data["group_id"])
    if not group:
        return jsonify({"error": "Group not found"}), 404

    poll = Poll(
        group_id=data["group_id"],
        question=data["question"].strip(),
        created_by=user_id,
        ends_at=data.get("ends_at"),
    )
    db.session.add(poll)
    db.session.flush()

    for opt in options_data:
        text = opt.get("text") or opt if isinstance(opt, str) else None
        if text:
            db.session.add(PollOption(poll_id=poll.id, text=text.strip()))

    db.session.commit()
    db.session.refresh(poll)
    return jsonify({"message": "Poll created", "poll": poll.to_dict()}), 201


# ─── POST /api/polls/<id>/vote ────────────────────────────────────────────

@polls_bp.route("/<int:poll_id>/vote", methods=["POST"])
@jwt_required()
def vote(poll_id):
    """Cast a vote with a reason. Triggers AI insight after 3+ votes."""
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    option_id = data.get("option_id")
    reason = data.get("reason", "").strip()

    if not option_id or not reason:
        return jsonify({"error": "'option_id' and 'reason' are required"}), 422

    poll = Poll.query.get(poll_id)
    if not poll:
        return jsonify({"error": "Poll not found"}), 404

    # Check already voted
    existing_vote = Vote.query.filter_by(poll_id=poll_id, user_id=user_id).first()
    if existing_vote:
        return jsonify({"error": "You have already voted on this poll"}), 409

    option = PollOption.query.get(option_id)
    if not option or option.poll_id != poll_id:
        return jsonify({"error": "Invalid option for this poll"}), 422

    # Record vote
    vote = Vote(poll_id=poll_id, option_id=option_id, user_id=user_id, reason=reason)
    option.votes += 1
    poll.total_votes += 1
    db.session.add(vote)
    db.session.commit()

    # Generate AI insight if 3+ votes
    if poll.total_votes >= 3 and not poll.ai_insight:
        all_reasons = [v.reason for v in Vote.query.filter_by(poll_id=poll_id).all()]
        insight = summarize_poll_reasons(all_reasons)
        if insight:
            poll.ai_insight = insight
            db.session.commit()

    db.session.refresh(poll)
    return jsonify({
        "message": "Vote recorded",
        "poll": poll.to_dict(),
        "ai_insight_generated": bool(poll.ai_insight),
    }), 200


# ─── GET /api/polls/<id> ──────────────────────────────────────────────────

@polls_bp.route("/<int:poll_id>", methods=["GET"])
@jwt_required()
def get_poll(poll_id):
    poll = Poll.query.get(poll_id)
    if not poll:
        return jsonify({"error": "Poll not found"}), 404
    return jsonify({"poll": poll.to_dict()}), 200

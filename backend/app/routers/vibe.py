"""
Vibe Matcher Blueprint – /api/vibe
ML-based student matching using Jaccard Similarity.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User
from app.utils.vibe_logic import calculate_jaccard_similarity, get_common_tags, generate_vibe_insight

vibe_bp = Blueprint("vibe", __name__)


# ─── GET /api/vibe/matches ────────────────────────────────────────────────

@vibe_bp.route("/matches", methods=["GET"])
@jwt_required()
def get_vibe_matches():
    """
    Find top vibe matches for the current user using Jaccard Similarity on tags.
    Returns top 5 matches sorted by score (descending).
    """
    user_id = int(get_jwt_identity())
    current_user = User.query.get(user_id)
    if not current_user:
        return jsonify({"error": "User not found"}), 404

    if not current_user.tags:
        return jsonify({
            "matches": [],
            "tip": "Add tags to your profile to find vibe matches!"
        }), 200

    # Get all other active users
    all_users = User.query.filter(
        User.id != user_id,
        User.is_active == True
    ).all()

    results = []
    for other in all_users:
        other_tags = other.tags or []
        score = calculate_jaccard_similarity(current_user.tags, other_tags)
        common = get_common_tags(current_user.tags, other_tags)
        insight = generate_vibe_insight(common)
        results.append({
            "user": other.to_dict(),
            "score": score,
            "common_tags": common,
            "insight": insight,
        })

    # Sort by score descending, return top 5
    results.sort(key=lambda x: x["score"], reverse=True)
    top_matches = [r for r in results if r["score"] > 0][:5]

    return jsonify({
        "your_tags": current_user.tags,
        "matches": top_matches,
        "total_considered": len(all_users),
    }), 200


# ─── GET /api/vibe/score ──────────────────────────────────────────────────

@vibe_bp.route("/score", methods=["GET"])
@jwt_required()
def get_vibe_score():
    """Return the current user's vibe score."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"vibe_score": user.vibe_score, "tags": user.tags or []}), 200


# ─── POST /api/vibe/tags ──────────────────────────────────────────────────

@vibe_bp.route("/tags", methods=["POST"])
@jwt_required()
def update_tags():
    """Update the current user's interest tags."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    tags = data.get("tags", [])
    if not isinstance(tags, list):
        return jsonify({"error": "'tags' must be a list of strings"}), 422

    # Deduplicate and lowercase
    user.tags = list(set(t.strip().lower() for t in tags if t.strip()))
    db.session.commit()

    return jsonify({
        "message": "Tags updated successfully",
        "tags": user.tags,
    }), 200

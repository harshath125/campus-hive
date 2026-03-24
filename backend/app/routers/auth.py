"""
Auth Blueprint – /api/auth
Handles: signup, login (returns JWT), get current user profile.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models import User, UserRole
from app.security import hash_password, verify_password, create_user_token

auth_bp = Blueprint("auth", __name__)


# ─── POST /api/auth/signup ─────────────────────────────────────────────────

@auth_bp.route("/signup", methods=["POST"])
def signup():
    """Register a new user and return a JWT token."""
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    # Required fields
    required = ["email", "password", "name"]
    for field in required:
        if field not in data or not str(data[field]).strip():
            return jsonify({"error": f"'{field}' is required"}), 422

    email = data["email"].lower().strip()
    password = data["password"]
    name = data["name"].strip()

    # Validate password length
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 422

    # Check duplicate email
    existing = User.query.filter_by(email=email).first()
    if existing:
        return jsonify({"error": "Email already registered"}), 409

    # Parse optional fields
    role_str = data.get("role", "student").lower()
    try:
        role = UserRole(role_str)
    except ValueError:
        role = UserRole.STUDENT

    # Create user
    user = User(
        email=email,
        hashed_password=hash_password(password),
        name=name,
        role=role,
        branch=data.get("branch"),
        section=data.get("section"),
        year=data.get("year"),
        tags=data.get("tags", []),
        avatar=data.get("avatar", "👤"),
    )
    db.session.add(user)
    db.session.commit()
    db.session.refresh(user)

    # Create JWT token immediately after signup
    token = create_user_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value,
    )

    return jsonify({
        "message": "Account created successfully",
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
    }), 201


# ─── POST /api/auth/login ──────────────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    """
    Authenticate user, return JWT access token.
    Accepts JSON body: { "email": "...", "password": "..." }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON"}), 400

    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 422

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.hashed_password):
        return jsonify({"error": "Invalid email or password"}), 401

    if not user.is_active:
        return jsonify({"error": "Account is deactivated"}), 403

    token = create_user_token(
        user_id=user.id,
        email=user.email,
        role=user.role.value,
    )

    return jsonify({
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": user.to_dict(),
    }), 200


# ─── GET /api/auth/me ─────────────────────────────────────────────────────

@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    """Return the authenticated user's profile."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


# ─── PUT /api/auth/me ─────────────────────────────────────────────────────

@auth_bp.route("/me", methods=["PUT"])
@jwt_required()
def update_me():
    """Update current user profile (name, branch, section, year, tags, avatar)."""
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}
    updatable = ["name", "branch", "section", "year", "tags", "avatar"]
    for field in updatable:
        if field in data:
            setattr(user, field, data[field])

    db.session.commit()
    return jsonify({"message": "Profile updated", "user": user.to_dict()}), 200

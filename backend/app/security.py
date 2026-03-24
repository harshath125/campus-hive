"""
JWT auth helpers and password hashing utilities.
Uses Flask-JWT-Extended for token management and Flask-Bcrypt for password hashing.
"""
from datetime import timedelta
from functools import wraps

from flask import jsonify
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    verify_jwt_in_request,
    get_jwt,
)

from app.extensions import bcrypt


# ─── Password Helpers ─────────────────────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    return bcrypt.generate_password_hash(plain_password).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against its bcrypt hash."""
    return bcrypt.check_password_hash(hashed_password, plain_password)


# ─── JWT Token Helpers ────────────────────────────────────────────────────────

def create_user_token(user_id: int, email: str, role: str, expires_hours: int = 24) -> str:
    """
    Create a signed JWT access token.
    Identity = user_id (stored as string in 'sub').
    Additional claims: email, role.
    """
    additional_claims = {
        "email": email,
        "role": role,
    }
    expires = timedelta(hours=expires_hours)
    token = create_access_token(
        identity=str(user_id),
        additional_claims=additional_claims,
        expires_delta=expires,
    )
    return token


def get_current_user_id() -> int:
    """Return the integer user ID from the current JWT identity."""
    return int(get_jwt_identity())


def get_current_user_role() -> str:
    """Return the role claim from the current JWT."""
    claims = get_jwt()
    return claims.get("role", "student")


# ─── Decorators ───────────────────────────────────────────────────────────────

def jwt_required_custom(fn):
    """Alias decorator that wraps Flask-JWT-Extended verify_jwt_in_request."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
        except Exception as e:
            return jsonify({"error": "Invalid or missing token", "details": str(e)}), 401
        return fn(*args, **kwargs)
    return wrapper


def admin_required(fn):
    """Restrict endpoint to admin role only."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            role = get_current_user_role()
            if role != "admin":
                return jsonify({"error": "Admin privileges required"}), 403
        except Exception as e:
            return jsonify({"error": "Invalid or missing token", "details": str(e)}), 401
        return fn(*args, **kwargs)
    return wrapper

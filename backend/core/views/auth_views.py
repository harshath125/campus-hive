"""
Auth Views – /api/auth/
Handles: signup, login (returns JWT), get current user, update profile.
"""
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.contrib.auth.hashers import make_password, check_password
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import User, ActivityLog


def _get_client_ip(request):
    x_forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    return x_forwarded.split(",")[0].strip() if x_forwarded else request.META.get("REMOTE_ADDR")


def _get_user_from_token(request):
    """Extract user from JWT Bearer token."""
    auth_header = request.META.get("HTTP_AUTHORIZATION", "")
    if not auth_header.startswith("Bearer "):
        return None
    token_str = auth_header.split("Bearer ")[1].strip()
    try:
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken(token_str)
        payload = token.payload
        user_id = payload.get("user_id") or payload.get("sub")
        if user_id is None:
            return None
        return User.objects.get(id=int(user_id))
    except Exception:
        return None


@csrf_exempt
@require_http_methods(["POST"])
def signup(request):
    """Register a new user and return JWT tokens."""
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Request body must be JSON"}, status=400)

    required = ["email", "password", "name"]
    for field in required:
        if field not in data or not str(data[field]).strip():
            return JsonResponse({"error": f"'{field}' is required"}, status=422)

    email = data["email"].lower().strip()
    password = data["password"]
    name = data["name"].strip()

    if len(password) < 6:
        return JsonResponse({"error": "Password must be at least 6 characters"}, status=422)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "Email already registered"}, status=409)

    role = data.get("role", "student").lower()
    if role not in ("student", "admin", "faculty"):
        role = "student"

    user = User.objects.create_user(
        email=email,
        password=password,
        name=name,
        role=role,
        branch=data.get("branch", ""),
        section=data.get("section", ""),
        year=data.get("year"),
        tags=data.get("tags", []),
        avatar=data.get("avatar", "👤"),
    )

    refresh = RefreshToken.for_user(user)
    # Add custom claims (sub is already set by SimpleJWT via USER_ID_CLAIM)
    refresh["email"] = user.email
    refresh["role"] = user.role

    # Log activity
    ActivityLog.objects.create(
        user=user, action="signup",
        details=f"New {role} account created: {email}",
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({
        "message": "Account created successfully",
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "token_type": "bearer",
        "user": user.to_dict(),
    }, status=201)


@csrf_exempt
@require_http_methods(["POST"])
def login(request):
    """Authenticate user and return JWT tokens."""
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        return JsonResponse({"error": "Request body must be JSON"}, status=400)

    email = data.get("email", "").lower().strip()
    password = data.get("password", "")

    if not email or not password:
        return JsonResponse({"error": "Email and password are required"}, status=422)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return JsonResponse({"error": "Invalid email or password"}, status=401)

    if not user.check_password(password):
        return JsonResponse({"error": "Invalid email or password"}, status=401)

    if not user.is_active:
        return JsonResponse({"error": "Account is deactivated"}, status=403)

    refresh = RefreshToken.for_user(user)
    refresh["email"] = user.email
    refresh["role"] = user.role

    # Log activity
    ActivityLog.objects.create(
        user=user, action="login",
        details=f"Login from IP: {_get_client_ip(request)}",
        ip_address=_get_client_ip(request),
    )

    return JsonResponse({
        "message": "Login successful",
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "token_type": "bearer",
        "user": user.to_dict(),
    })


@csrf_exempt
@require_http_methods(["GET"])
def get_me(request):
    """Return the authenticated user's profile."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)
    return JsonResponse({"user": user.to_dict()})


@csrf_exempt
@require_http_methods(["PUT"])
def update_me(request):
    """Update current user profile."""
    user = _get_user_from_token(request)
    if not user:
        return JsonResponse({"error": "Authorization token is missing or invalid"}, status=401)

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, ValueError):
        data = {}

    updatable = ["name", "branch", "section", "year", "tags", "avatar"]
    changed = []
    for field in updatable:
        if field in data:
            setattr(user, field, data[field])
            changed.append(field)

    if changed:
        user.save()
        ActivityLog.objects.create(
            user=user, action="update_profile",
            details=f"Updated: {', '.join(changed)}",
            ip_address=_get_client_ip(request),
        )

    return JsonResponse({"message": "Profile updated", "user": user.to_dict()})

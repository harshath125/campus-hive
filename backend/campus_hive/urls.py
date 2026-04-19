"""
Campus Hive URL Configuration.
Routes /admin/ to Django admin, /api/* to core app views.
Backend API only — frontend served separately by Vercel.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health_view(request):
    from django.conf import settings
    db_engine = settings.DATABASES["default"]["ENGINE"]
    db_type = "postgresql" if "postgresql" in db_engine else "sqlite"
    return JsonResponse({"status": "healthy", "db": db_type, "framework": "django"})


def root_view(request):
    """API info page for the root URL."""
    return JsonResponse({
        "message": "🐝 Campus Hive API is running (Django)",
        "version": "2.0.0",
        "admin": "/admin/",
        "endpoints": {
            "auth": "/api/auth/",
            "groups": "/api/groups/",
            "polls": "/api/polls/",
            "events": "/api/events/",
            "vibe": "/api/vibe/",
            "incidents": "/api/incidents/",
        },
    })


urlpatterns = [
    path("", root_view),
    path("health/", health_view),
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
]

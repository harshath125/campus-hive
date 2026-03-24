"""
Campus Hive URL Configuration.
Routes /admin/ to Django admin, /api/* to core app views.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def root_view(request):
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


def health_view(request):
    return JsonResponse({"status": "healthy", "db": "supabase-connected", "framework": "django"})


urlpatterns = [
    path("", root_view),
    path("health/", health_view),
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
]

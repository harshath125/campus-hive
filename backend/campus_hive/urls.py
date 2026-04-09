"""
Campus Hive URL Configuration.
Routes /admin/ to Django admin, /api/* to core app views.
In production, serves the React frontend from ../frontend/dist/.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.http import JsonResponse, FileResponse, Http404
from django.conf import settings
import os


FRONTEND_DIR = os.path.join(settings.BASE_DIR, "..", "frontend", "dist")


def health_view(request):
    db_engine = settings.DATABASES["default"]["ENGINE"]
    db_type = "postgresql" if "postgresql" in db_engine else "sqlite"
    return JsonResponse({"status": "healthy", "db": db_type, "framework": "django"})


def serve_react(request, path=""):
    """Serve React SPA — try exact file first, fallback to index.html."""
    if path and not path.startswith("api/") and not path.startswith("admin/"):
        file_path = os.path.join(FRONTEND_DIR, path)
        if os.path.isfile(file_path):
            content_type = "application/octet-stream"
            if path.endswith(".js"):
                content_type = "application/javascript"
            elif path.endswith(".css"):
                content_type = "text/css"
            elif path.endswith(".html"):
                content_type = "text/html"
            elif path.endswith(".svg"):
                content_type = "image/svg+xml"
            elif path.endswith(".png"):
                content_type = "image/png"
            elif path.endswith(".ico"):
                content_type = "image/x-icon"
            elif path.endswith(".woff2"):
                content_type = "font/woff2"
            elif path.endswith(".woff"):
                content_type = "font/woff"
            elif path.endswith(".json"):
                content_type = "application/json"
            return FileResponse(open(file_path, "rb"), content_type=content_type)

    index = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.isfile(index):
        return FileResponse(open(index, "rb"), content_type="text/html")

    # If no frontend build exists, return API info
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
    path("health/", health_view),
    path("admin/", admin.site.urls),
    path("api/", include("core.urls")),
    # Serve React frontend for all other routes
    re_path(r"^(?P<path>.*)$", serve_react),
]

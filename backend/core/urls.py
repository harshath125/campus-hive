"""
Core app URL configuration.
Maps /api/* routes to view functions.
"""
from django.urls import path
from core.views import auth_views, group_views, poll_views, event_views, vibe_views, incident_views, admin_views

urlpatterns = [
    # ── Auth ─────────────────────────────────────────────────────────────
    path("auth/signup", auth_views.signup),
    path("auth/login", auth_views.login),
    path("auth/me", auth_views.get_me),
    path("auth/me/update", auth_views.update_me),

    # ── Groups ───────────────────────────────────────────────────────────
    path("groups/", group_views.list_groups),
    path("groups/create", group_views.create_group),
    path("groups/<int:group_id>", group_views.get_group),
    path("groups/<int:group_id>/update", group_views.update_group),
    path("groups/<int:group_id>/delete", group_views.delete_group),

    # ── Polls ────────────────────────────────────────────────────────────
    path("polls/", poll_views.create_poll),
    path("polls/group/<int:group_id>", poll_views.list_polls),
    path("polls/<int:poll_id>", poll_views.get_poll),
    path("polls/<int:poll_id>/vote", poll_views.vote_on_poll),

    # ── Events ───────────────────────────────────────────────────────────
    path("events/", event_views.create_event),
    path("events/group/<int:group_id>", event_views.list_events),
    path("events/<int:event_id>", event_views.get_event),
    path("events/<int:event_id>/tasks", event_views.add_task),
    path("events/tasks/<int:task_id>", event_views.update_task_status),

    # ── Vibe Matcher ─────────────────────────────────────────────────────
    path("vibe/matches", vibe_views.get_vibe_matches),
    path("vibe/score", vibe_views.get_vibe_score),
    path("vibe/tags", vibe_views.update_tags),

    # ── Incidents ────────────────────────────────────────────────────────
    path("incidents/report", incident_views.report_incident),
    path("incidents/", incident_views.list_incidents),
    path("incidents/<int:incident_id>/status", incident_views.update_incident_status),

    # ── Admin Dashboard API ──────────────────────────────────────────────
    path("admin-api/stats", admin_views.dashboard_stats),
    path("admin-api/users", admin_views.list_users),
    path("admin-api/users/<int:user_id>", admin_views.update_user),
    path("admin-api/users/<int:user_id>/delete", admin_views.delete_user),
    path("admin-api/logs", admin_views.list_activity_logs),
    path("admin-api/incidents", admin_views.list_incidents_admin),
    path("admin-api/incidents/<int:incident_id>", admin_views.update_incident),
    path("admin-api/db-health", admin_views.db_health),

    # ── Phase 8: Extended Admin & Notifications ───────────────────────────
    path("admin-api/upload-users", admin_views.upload_users_csv),
    path("announcements/", admin_views.admin_announcements),
    path("announcements/<int:pk>", admin_views.delete_announcement),
    path("resources/", admin_views.admin_resources),
    path("resources/<int:pk>", admin_views.delete_resource),
    path("admin-api/create-event", admin_views.admin_create_event),
    path("admin-api/create-group", admin_views.admin_create_group),
    path("admin-api/create-poll", admin_views.admin_create_poll),
]


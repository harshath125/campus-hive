"""
Django Admin Configuration for Campus Hive.
Full admin panel with all models, filters, search, and activity logging.
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import (
    User, Group, Poll, PollOption, Vote,
    Event, EventTask, Incident, ActivityLog,
    Announcement, Resource,
)


# ── Customize Admin Site ────────────────────────────────────────────────────

admin.site.site_header = "🐝 Campus Hive Administration"
admin.site.site_title = "Campus Hive Admin"
admin.site.index_title = "Dashboard — Manage Users, Spaces, Polls, Events & Logs"


# ── User Admin ──────────────────────────────────────────────────────────────

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "name", "role", "branch", "section", "year", "vibe_score", "is_active", "date_joined")
    list_filter = ("role", "is_active", "branch", "year")
    search_fields = ("email", "name", "branch", "section")
    ordering = ("-date_joined",)
    list_editable = ("is_active",)
    readonly_fields = ("date_joined", "last_login")

    fieldsets = (
        ("Account", {"fields": ("email", "password")}),
        ("Profile", {"fields": ("name", "avatar", "role", "branch", "section", "year", "tags", "vibe_score")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser")}),
        ("Timestamps", {"fields": ("date_joined", "last_login")}),
    )
    add_fieldsets = (
        ("New User", {
            "classes": ("wide",),
            "fields": ("email", "name", "password1", "password2", "role", "branch", "section", "year"),
        }),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).defer("password")


# ── Group Admin ─────────────────────────────────────────────────────────────

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ("icon", "name", "type", "privacy", "member_count", "admin", "created_at")
    list_filter = ("type", "privacy")
    search_fields = ("name", "description")
    raw_id_fields = ("admin",)


# ── Poll Admin ──────────────────────────────────────────────────────────────

class PollOptionInline(admin.TabularInline):
    model = PollOption
    extra = 0
    readonly_fields = ("votes",)

@admin.register(Poll)
class PollAdmin(admin.ModelAdmin):
    list_display = ("id", "question_short", "group", "total_votes", "has_ai_insight", "created_at")
    list_filter = ("group",)
    search_fields = ("question",)
    inlines = [PollOptionInline]
    readonly_fields = ("total_votes", "ai_insight", "created_at")

    def question_short(self, obj):
        return obj.question[:80] + "…" if len(obj.question) > 80 else obj.question
    question_short.short_description = "Question"

    def has_ai_insight(self, obj):
        return bool(obj.ai_insight)
    has_ai_insight.boolean = True
    has_ai_insight.short_description = "AI Insight"

@admin.register(PollOption)
class PollOptionAdmin(admin.ModelAdmin):
    list_display = ("id", "text", "poll", "votes")
    list_filter = ("poll",)


# ── Vote Admin ──────────────────────────────────────────────────────────────

@admin.register(Vote)
class VoteAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "poll", "option", "reason_short", "created_at")
    list_filter = ("poll",)
    search_fields = ("reason", "user__email")
    readonly_fields = ("created_at",)

    def reason_short(self, obj):
        return obj.reason[:60] + "…" if len(obj.reason) > 60 else obj.reason
    reason_short.short_description = "Reason"


# ── Event Admin ─────────────────────────────────────────────────────────────

class EventTaskInline(admin.TabularInline):
    model = EventTask
    extra = 0
    raw_id_fields = ("assigned_to",)

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "group", "date", "budget", "attendee_count", "task_count", "created_at")
    list_filter = ("group",)
    search_fields = ("title", "description")
    inlines = [EventTaskInline]

    def task_count(self, obj):
        return obj.tasks.count()
    task_count.short_description = "Tasks"

@admin.register(EventTask)
class EventTaskAdmin(admin.ModelAdmin):
    list_display = ("title", "event", "assigned_to", "status", "priority", "created_at")
    list_filter = ("status", "priority")
    search_fields = ("title",)
    raw_id_fields = ("assigned_to",)


# ── Incident Admin ──────────────────────────────────────────────────────────

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ("id", "severity", "description_short", "location", "status", "created_at")
    list_filter = ("severity", "status")
    search_fields = ("description", "location")
    list_editable = ("status",)

    def description_short(self, obj):
        return obj.description[:80] + "…" if len(obj.description) > 80 else obj.description
    description_short.short_description = "Description"


# ── Activity Log Admin ──────────────────────────────────────────────────────

@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("timestamp", "user", "action", "details_short", "ip_address")
    list_filter = ("action", "timestamp")
    search_fields = ("user__email", "details", "ip_address")
    readonly_fields = ("user", "action", "details", "ip_address", "timestamp")
    ordering = ("-timestamp",)

    def details_short(self, obj):
        return obj.details[:100] + "…" if len(obj.details) > 100 else obj.details
    details_short.short_description = "Details"

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


# ── Announcement Admin ──────────────────────────────────────────────────────

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ("title", "created_by", "created_at", "is_active")
    list_filter = ("is_active", "created_at")
    search_fields = ("title", "content")


# ── Resource Admin ──────────────────────────────────────────────────────────

@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "url", "created_by", "created_at")
    search_fields = ("title", "description", "url")

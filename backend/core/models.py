"""
Django ORM models for Campus Hive.
All tables stored in Supabase PostgreSQL (or SQLite fallback).
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils import timezone


# ─── Custom User Manager ──────────────────────────────────────────────────────

class UserManager(BaseUserManager):
    """Custom manager — uses email as the unique identifier instead of username."""

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("name", "Admin")
        return self.create_user(email, password, **extra_fields)


# ─── Choices ───────────────────────────────────────────────────────────────────

class UserRole(models.TextChoices):
    STUDENT = "student", "Student"
    ADMIN = "admin", "Admin"
    FACULTY = "faculty", "Faculty"

class GroupType(models.TextChoices):
    SECTION = "section", "Section"
    CLUB = "club", "Club"
    SQUAD = "squad", "Squad"
    COMMITTEE = "committee", "Committee"

class Privacy(models.TextChoices):
    PUBLIC = "public", "Public"
    PRIVATE = "private", "Private"

class TaskStatusChoice(models.TextChoices):
    TODO = "todo", "To Do"
    INPROGRESS = "inprogress", "In Progress"
    DONE = "done", "Done"

class PriorityChoice(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"

class SeverityChoice(models.TextChoices):
    GREEN = "green", "Green"
    YELLOW = "yellow", "Yellow"
    ORANGE = "orange", "Orange"
    RED = "red", "Red"

class IncidentStatusChoice(models.TextChoices):
    PENDING = "pending", "Pending"
    INVESTIGATING = "investigating", "Investigating"
    RESOLVED = "resolved", "Resolved"


# ─── ANITS BTech Branch, Section & Year Choices ───────────────────────────────

class BranchChoice(models.TextChoices):
    CSE = "CSE", "Computer Science & Engineering"
    CSM = "CSM", "CSE (AI & Machine Learning)"
    CSD = "CSD", "CSE (Data Science)"
    CSO = "CSO", "CSE (Cyber Security)"
    IT  = "IT",  "Information Technology"
    ECE = "ECE", "Electronics & Communication"
    EEE = "EEE", "Electrical & Electronics"
    ME  = "ME",  "Mechanical Engineering"
    CE  = "CE",  "Civil Engineering"

# Sections per branch (A and B for most)
SECTION_CHOICES = [
    ("A", "Section A"),
    ("B", "Section B"),
]

YEAR_CHOICES = [
    (1, "1st Year"),
    (2, "2nd Year"),
    (3, "3rd Year"),
    (4, "4th Year"),
]


# ─── User Model ────────────────────────────────────────────────────────────────

class User(AbstractUser):
    """Custom user model — email-based auth, profile fields, vibe tags."""

    username = None  # We use email instead
    email = models.EmailField(unique=True, db_index=True)
    name = models.CharField(max_length=255)
    avatar = models.CharField(max_length=50, default="👤")
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.STUDENT)
    branch = models.CharField(max_length=100, blank=True, default="")
    section = models.CharField(max_length=50, blank=True, default="")
    year = models.IntegerField(null=True, blank=True)
    tags = models.JSONField(default=list, blank=True)
    vibe_score = models.IntegerField(default=0)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # email + password are already required

    objects = UserManager()

    class Meta:
        db_table = "ch_users"
        verbose_name = "User"
        verbose_name_plural = "Users"
        ordering = ["-date_joined"]

    def __str__(self):
        return f"{self.name} ({self.email})"

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "avatar": self.avatar,
            "role": self.role,
            "branch": self.branch,
            "section": self.section,
            "year": self.year,
            "tags": self.tags or [],
            "vibe_score": self.vibe_score,
            "is_active": self.is_active,
            "created_at": self.date_joined.isoformat() if self.date_joined else None,
        }


# ─── Group Model ───────────────────────────────────────────────────────────────

class Group(models.Model):
    name = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=GroupType.choices, default=GroupType.CLUB)
    privacy = models.CharField(max_length=20, choices=Privacy.choices, default=Privacy.PUBLIC)
    description = models.TextField(blank=True, default="")
    icon = models.CharField(max_length=50, default="📚")
    color = models.CharField(max_length=50, default="violet")
    member_count = models.IntegerField(default=1)
    admin = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="groups_owned")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ch_groups"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.icon} {self.name}"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "privacy": self.privacy,
            "description": self.description,
            "icon": self.icon,
            "color": self.color,
            "member_count": self.member_count,
            "admin_id": self.admin_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

class GroupMember(models.Model):
    class StatusChoice(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"

    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="group_memberships")
    role = models.CharField(max_length=20, default="member") # "admin" or "member"
    status = models.CharField(max_length=20, choices=StatusChoice.choices, default=StatusChoice.APPROVED)
    joined_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = "ch_group_members"
        unique_together = ("group", "user")

    def __str__(self):
        return f"{self.user.name} in {self.group.name} ({self.status})"
        
    def to_dict(self):
        return {
            "id": self.id,
            "group_id": self.group_id,
            "user_id": self.user_id,
            "user_name": self.user.name,
            "user_avatar": self.user.avatar,
            "role": self.role,
            "status": self.status,
            "joined_at": self.joined_at.isoformat() if self.joined_at else None,
        }


# ─── Poll Model ────────────────────────────────────────────────────────────────

class Poll(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="polls")
    question = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="polls_created")
    created_at = models.DateTimeField(auto_now_add=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    ai_insight = models.TextField(blank=True, default="")
    total_votes = models.IntegerField(default=0)

    class Meta:
        db_table = "ch_polls"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Poll #{self.id}: {self.question[:60]}"

    def to_dict(self):
        return {
            "id": self.id,
            "group_id": self.group_id,
            "question": self.question,
            "created_by": self.created_by_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "ends_at": self.ends_at.isoformat() if self.ends_at else None,
            "ai_insight": self.ai_insight,
            "total_votes": self.total_votes,
            "options": [o.to_dict() for o in self.options.all()],
        }


class PollOption(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="options")
    text = models.CharField(max_length=500)
    votes = models.IntegerField(default=0)

    class Meta:
        db_table = "ch_poll_options"

    def __str__(self):
        return f"{self.text} ({self.votes} votes)"

    def to_dict(self):
        return {
            "id": self.id,
            "poll_id": self.poll_id,
            "text": self.text,
            "votes": self.votes,
        }


class Vote(models.Model):
    poll = models.ForeignKey(Poll, on_delete=models.CASCADE, related_name="vote_records")
    option = models.ForeignKey(PollOption, on_delete=models.CASCADE, related_name="vote_records")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="votes")
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ch_votes"
        unique_together = ("poll", "user")

    def __str__(self):
        return f"Vote by {self.user_id} on poll {self.poll_id}"

    def to_dict(self):
        return {
            "id": self.id,
            "poll_id": self.poll_id,
            "option_id": self.option_id,
            "user_id": self.user_id,
            "reason": self.reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ─── Event Model ───────────────────────────────────────────────────────────────

class Event(models.Model):
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="events")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    date = models.DateTimeField(null=True, blank=True)
    budget = models.IntegerField(null=True, blank=True)
    attendee_count = models.IntegerField(default=0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="events_created")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ch_events"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def to_dict(self):
        return {
            "id": self.id,
            "group_id": self.group_id,
            "title": self.title,
            "description": self.description,
            "date": self.date.isoformat() if self.date else None,
            "budget": self.budget,
            "attendee_count": self.attendee_count,
            "created_by": self.created_by_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "tasks": [t.to_dict() for t in self.tasks.all()],
        }


class EventTask(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="assigned_tasks")
    status = models.CharField(max_length=20, choices=TaskStatusChoice.choices, default=TaskStatusChoice.TODO)
    priority = models.CharField(max_length=20, choices=PriorityChoice.choices, default=PriorityChoice.MEDIUM)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ch_event_tasks"

    def __str__(self):
        return f"{self.title} [{self.status}]"

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "title": self.title,
            "description": self.description,
            "assigned_to": self.assigned_to_id,
            "status": self.status,
            "priority": self.priority,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ─── Incident Model ───────────────────────────────────────────────────────────

class Incident(models.Model):
    severity = models.CharField(max_length=20, choices=SeverityChoice.choices)
    description = models.TextField()
    location = models.CharField(max_length=255, blank=True, default="")
    status = models.CharField(max_length=20, choices=IncidentStatusChoice.choices, default=IncidentStatusChoice.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ch_incidents"
        ordering = ["-created_at"]

    def __str__(self):
        return f"[{self.severity.upper()}] {self.description[:60]}"

    def to_dict(self):
        return {
            "id": self.id,
            "severity": self.severity,
            "description": self.description,
            "location": self.location,
            "status": self.status,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ─── Activity Log Model ───────────────────────────────────────────────────────

class ActivityLog(models.Model):
    """Tracks all user actions — visible in Django admin panel."""

    ACTION_CHOICES = [
        ("login", "Login"),
        ("signup", "Signup"),
        ("logout", "Logout"),
        ("create_group", "Create Group"),
        ("join_group", "Join Group"),
        ("create_poll", "Create Poll"),
        ("vote", "Vote"),
        ("create_event", "Create Event"),
        ("update_task", "Update Task"),
        ("report_incident", "Report Incident"),
        ("update_profile", "Update Profile"),
        ("vibe_match", "Vibe Match"),
    ]

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="activity_logs")
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    details = models.TextField(blank=True, default="")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ch_activity_logs"
        ordering = ["-timestamp"]
        verbose_name = "Activity Log"
        verbose_name_plural = "Activity Logs"

    def __str__(self):
        user_str = self.user.email if self.user else "anonymous"
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {user_str} → {self.action}"


# ─── Announcement Model ───────────────────────────────────────────────────────

class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="announcements")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "ch_announcements"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "created_by": self.created_by.name if self.created_by else "Admin",
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "is_active": self.is_active,
        }


# ─── Resource Model ───────────────────────────────────────────────────────────

class Resource(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    url = models.URLField()
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="resources")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ch_resources"
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "url": self.url,
            "created_by": self.created_by.name if self.created_by else "Admin",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

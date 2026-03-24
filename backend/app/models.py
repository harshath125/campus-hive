"""
SQLAlchemy ORM models for Campus Hive.
All tables are created in Supabase PostgreSQL.
"""
import enum
from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, ForeignKey,
    Boolean, Enum as SAEnum, ARRAY
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.extensions import db


# ─── Enums ────────────────────────────────────────────────────────────────────

class UserRole(str, enum.Enum):
    STUDENT = "student"
    ADMIN = "admin"
    FACULTY = "faculty"

class GroupType(str, enum.Enum):
    SECTION = "section"
    CLUB = "club"
    SQUAD = "squad"
    COMMITTEE = "committee"

class Privacy(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"

class TaskStatus(str, enum.Enum):
    TODO = "todo"
    INPROGRESS = "inprogress"
    DONE = "done"

class Priority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class Severity(str, enum.Enum):
    YELLOW = "yellow"
    ORANGE = "orange"
    RED = "red"

class IncidentStatus(str, enum.Enum):
    PENDING = "pending"
    INVESTIGATING = "investigating"
    RESOLVED = "resolved"


# ─── Models ───────────────────────────────────────────────────────────────────

class User(db.Model):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    avatar = Column(String(50), default="👤")
    role = Column(SAEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    branch = Column(String(100))
    section = Column(String(50))
    year = Column(Integer)
    tags = Column(ARRAY(String), default=[])
    vibe_score = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    groups_owned = relationship("Group", back_populates="owner", lazy="select")
    votes = relationship("Vote", back_populates="user", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "avatar": self.avatar,
            "role": self.role.value if self.role else "student",
            "branch": self.branch,
            "section": self.section,
            "year": self.year,
            "tags": self.tags or [],
            "vibe_score": self.vibe_score,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Group(db.Model):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(SAEnum(GroupType), default=GroupType.CLUB)
    privacy = Column(SAEnum(Privacy), default=Privacy.PUBLIC)
    description = Column(Text)
    icon = Column(String(50), default="📚")
    color = Column(String(50), default="violet")
    member_count = Column(Integer, default=1)
    admin_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    owner = relationship("User", back_populates="groups_owned")
    polls = relationship("Poll", back_populates="group", lazy="select")
    events = relationship("Event", back_populates="group", lazy="select")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type.value if self.type else "club",
            "privacy": self.privacy.value if self.privacy else "public",
            "description": self.description,
            "icon": self.icon,
            "color": self.color,
            "member_count": self.member_count,
            "admin_id": self.admin_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Poll(db.Model):
    __tablename__ = "polls"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    question = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    ends_at = Column(DateTime(timezone=True))
    ai_insight = Column(Text)
    total_votes = Column(Integer, default=0)

    # Relationships
    group = relationship("Group", back_populates="polls")
    options = relationship("PollOption", back_populates="poll", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "group_id": self.group_id,
            "question": self.question,
            "created_by": self.created_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "ends_at": self.ends_at.isoformat() if self.ends_at else None,
            "ai_insight": self.ai_insight,
            "total_votes": self.total_votes,
            "options": [o.to_dict() for o in self.options],
        }


class PollOption(db.Model):
    __tablename__ = "poll_options"

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    text = Column(String(500), nullable=False)
    votes = Column(Integer, default=0)

    # Relationships
    poll = relationship("Poll", back_populates="options")
    vote_records = relationship("Vote", back_populates="option")

    def to_dict(self):
        return {
            "id": self.id,
            "poll_id": self.poll_id,
            "text": self.text,
            "votes": self.votes,
        }


class Vote(db.Model):
    __tablename__ = "votes"

    id = Column(Integer, primary_key=True, index=True)
    poll_id = Column(Integer, ForeignKey("polls.id"), nullable=False)
    option_id = Column(Integer, ForeignKey("poll_options.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="votes")
    option = relationship("PollOption", back_populates="vote_records")

    def to_dict(self):
        return {
            "id": self.id,
            "poll_id": self.poll_id,
            "option_id": self.option_id,
            "user_id": self.user_id,
            "reason": self.reason,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Event(db.Model):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    date = Column(DateTime(timezone=True))
    budget = Column(Integer)
    attendee_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    group = relationship("Group", back_populates="events")
    tasks = relationship("EventTask", back_populates="event", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "group_id": self.group_id,
            "title": self.title,
            "description": self.description,
            "date": self.date.isoformat() if self.date else None,
            "budget": self.budget,
            "attendee_count": self.attendee_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "tasks": [t.to_dict() for t in self.tasks],
        }


class EventTask(db.Model):
    __tablename__ = "event_tasks"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    assigned_to = Column(Integer, ForeignKey("users.id"))
    status = Column(SAEnum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(SAEnum(Priority), default=Priority.MEDIUM)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    event = relationship("Event", back_populates="tasks")

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "title": self.title,
            "description": self.description,
            "assigned_to": self.assigned_to,
            "status": self.status.value if self.status else "todo",
            "priority": self.priority.value if self.priority else "medium",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Incident(db.Model):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    severity = Column(SAEnum(Severity), nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String(255))
    status = Column(SAEnum(IncidentStatus), default=IncidentStatus.PENDING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Intentionally NO user_id – true anonymity

    def to_dict(self):
        return {
            "id": self.id,
            "severity": self.severity.value if self.severity else None,
            "description": self.description,
            "location": self.location,
            "status": self.status.value if self.status else "pending",
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

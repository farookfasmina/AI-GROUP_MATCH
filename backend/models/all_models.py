from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text, Time
from sqlalchemy.orm import relationship

from core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    university = Column(String)
    department = Column(String)
    academic_year = Column(String)
    is_platform_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Research consent (proposal: Ethics) - students are only matched after agreeing.
    consent_given = Column(Boolean, default=False)
    consent_at = Column(DateTime, nullable=True)
    # Demo students are flagged so an admin can remove them before real data collection.
    is_demo = Column(Boolean, default=False)

    preference = relationship("Preference", back_populates="user", uselist=False, cascade="all, delete-orphan")
    availabilities = relationship("Availability", back_populates="user", cascade="all, delete-orphan")
    memberships = relationship("Membership", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    created_groups = relationship("StudyGroup", back_populates="creator")


class Subject(Base):
    """Course catalogue (proposal: secondary data - university course catalogue)."""
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    active = Column(Boolean, default=True)


class Preference(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Subjects of interest, stored as a comma-separated string
    subjects_of_interest = Column(String)
    learning_style = Column(String)            # Visual, Auditory, Reading/Writing, Kinesthetic
    communication_preference = Column(String)  # Text, Voice, Video, In-Person
    competency_level = Column(String)          # overall level: Beginner .. Expert
    preferred_study_type = Column(String, default="Group")  # Group | Buddy | Either
    collaboration_tendency = Column(String, default="Collaborative Peer")  # Collaborative Peer | Driven Leader | Focused Learner

    # Level per subject, e.g. {"Database Systems": "Advanced"} - lets groups mix strong and weaker students.
    subject_levels = Column(JSON, default=dict)
    preferred_group_size = Column(Integer, default=4)

    user = relationship("User", back_populates="preference")


class Availability(Base):
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_of_week = Column(String, nullable=False)  # e.g. 'Monday'
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    user = relationship("User", back_populates="availabilities")


class MatchRun(Base):
    """One run of the AI group formation, with its comparison against random grouping."""
    __tablename__ = "match_runs"

    id = Column(Integer, primary_key=True)
    started_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    trigger = Column(String, default="admin")  # admin | student | seed
    params = Column(JSON, default=dict)
    stats = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)


class StudyGroup(Base):
    __tablename__ = "study_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    subject = Column(String, nullable=False)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # manual = created by a student | ai_group = formed by the AI | buddy = 1-to-1 pair
    kind = Column(String, default="manual")
    # active | proposed (AI invitation waiting for answers) | closed
    status = Column(String, default="active")
    match_score = Column(Float, nullable=True)       # 0-100 compatibility
    reasons = Column(JSON, default=list)             # "why you were matched"
    meeting_slot = Column(String, nullable=True)     # e.g. "Tuesday 18:00-20:00"
    run_id = Column(Integer, ForeignKey("match_runs.id", ondelete="SET NULL"), nullable=True)

    creator = relationship("User", back_populates="created_groups")
    memberships = relationship("Membership", back_populates="group", cascade="all, delete-orphan")
    sessions = relationship("StudySession", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("GroupMessage", back_populates="group", cascade="all, delete-orphan")
    feedback = relationship("GroupFeedback", back_populates="group", cascade="all, delete-orphan")


class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("study_groups.id"), nullable=False)
    title = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    location = Column(String)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    attendees = Column(JSON, default=list)  # user ids who marked "I attended" (engagement metric)

    group = relationship("StudyGroup", back_populates="sessions")


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("study_groups.id"), nullable=False)
    role = Column(String, default="member")  # member | admin
    joined_at = Column(DateTime, default=datetime.utcnow)
    # accepted | pending (AI invitation) | declined
    status = Column(String, default="accepted")

    user = relationship("User", back_populates="memberships")
    group = relationship("StudyGroup", back_populates="memberships")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    type = Column(String, default="general")  # match_request | group_invite | group | session | message | general
    payload_id = Column(Integer, nullable=True)  # sender id or group id
    link = Column(String, nullable=True)         # page to open, e.g. /groups/12
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class GroupMessage(Base):
    __tablename__ = "group_messages"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("study_groups.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=True)
    is_file = Column(Boolean, default=False)
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("StudyGroup", back_populates="messages")
    sender = relationship("User")


class StudyInsight(Base):
    __tablename__ = "study_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("study_groups.id"), nullable=True)
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String, nullable=False)  # challenge | resource
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    group = relationship("StudyGroup")


class MatchFeedback(Base):
    """Rating of one study partner (KNN buddy match)."""
    __tablename__ = "match_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    matched_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    compatibility_rating = Column(Integer, nullable=False)
    collaboration_quality = Column(Integer, nullable=False)
    scheduling_ease = Column(Integer, nullable=False)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    matched_user = relationship("User", foreign_keys=[matched_user_id])


class GroupFeedback(Base):
    """Rating of a whole study group by one member (same three questions as MatchFeedback)."""
    __tablename__ = "group_feedbacks"

    id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("study_groups.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    compatibility_rating = Column(Integer, nullable=False)
    collaboration_quality = Column(Integer, nullable=False)
    scheduling_ease = Column(Integer, nullable=False)
    would_continue = Column(Boolean, default=True)
    feedback_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("StudyGroup", back_populates="feedback")
    user = relationship("User")


class SurveyResponse(Base):
    """System Usability Scale + fairness/usefulness/ease (proposal: research question 4)."""
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    sus_answers = Column(JSON, nullable=False)
    sus_score = Column(Float, nullable=False)
    fairness = Column(Integer, nullable=False)
    usefulness = Column(Integer, nullable=False)
    ease = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class ModelWeights(Base):
    """History of matching weights. A new row is written each time the model learns from feedback.
    (Kept in the database instead of weights.json so it survives server restarts.)"""
    __tablename__ = "model_weights"

    id = Column(Integer, primary_key=True)
    weights = Column(JSON, nullable=False)
    samples = Column(Integer, default=0)
    accuracy = Column(Float, nullable=True)
    note = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Time, Text
from sqlalchemy.orm import relationship
from datetime import datetime

# Import 'Base' from the database setup we created earlier
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

    # Relationships: Links User to other tables
    # 'User' has one 'Preference', many 'Availabilities', 'Memberships', and 'Notifications'
    preference = relationship("Preference", back_populates="user", uselist=False) 
    availabilities = relationship("Availability", back_populates="user")
    memberships = relationship("Membership", back_populates="user")
    notifications = relationship("Notification", back_populates="user")
    
    # Groups created by this user
    created_groups = relationship("StudyGroup", back_populates="creator")


class Preference(Base):
    __tablename__ = "preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False) # FK connects to users
    
    # Subjects of interest, stored as a comma-separated string for simplicity
    subjects_of_interest = Column(String) 
    learning_style = Column(String) # e.g., Visual, Auditory, Reading, Kinesthetic
    communication_preference = Column(String)
    competency_level = Column(String)
    preferred_study_type = Column(String, default="Group") # 'Group' or 'Buddy'
    collaboration_tendency = Column(String, default="Collaborative Peer") # e.g., Collaborative Peer, Driven Leader, Focused Learner
    
    # Relationship: Links back to User
    user = relationship("User", back_populates="preference")


class Availability(Base):
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # FK connects to users
    
    day_of_week = Column(String, nullable=False) # e.g., 'Monday'
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)

    # Relationship: Links back to User
    user = relationship("User", back_populates="availabilities")


class StudyGroup(Base):
    __tablename__ = "study_groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text)
    subject = Column(String, nullable=False)
    
    # FK connects to the user who created the group
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="created_groups")
    memberships = relationship("Membership", back_populates="group")
    sessions = relationship("StudySession", back_populates="group", cascade="all, delete-orphan")
    messages = relationship("GroupMessage", back_populates="group", cascade="all, delete-orphan")

class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("study_groups.id"), nullable=False)
    
    title = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    duration_minutes = Column(Integer, default=60)
    location = Column(String)  # e.g., Zoom link or Library room

    # Relationships
    group = relationship("StudyGroup", back_populates="sessions")


class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # FK to User
    group_id = Column(Integer, ForeignKey("study_groups.id"), nullable=False) # FK to StudyGroup
    
    role = Column(String, default="member") # could be "member", "admin"
    joined_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="memberships")
    group = relationship("StudyGroup", back_populates="memberships")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # FK to User
    
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
    type = Column(String, default="general") # e.g., 'match_request'
    payload_id = Column(Integer, nullable=True) # contextual ID (e.g., sender_id)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship("User", back_populates="notifications")


class GroupMessage(Base):
    __tablename__ = "group_messages"

    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("study_groups.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=True) # Content can be null if it is a file-only message
    is_file = Column(Boolean, default=False)
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    group = relationship("StudyGroup", back_populates="messages")
    sender = relationship("User")


class StudyInsight(Base):
    __tablename__ = "study_insights"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    group_id = Column(Integer, ForeignKey("study_groups.id"), nullable=True)
    
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String, nullable=False) # 'challenge' or 'resource'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User")
    group = relationship("StudyGroup")

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from core.database import get_db
from core.deps import get_current_user
from models.all_models import User, StudyGroup, Membership, StudySession
from schemas.session import StudySessionCreate, StudySessionResponse

router = APIRouter()

@router.get("/me", response_model=List[StudySessionResponse])
def get_my_upcoming_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch all upcoming sessions for all groups the user belongs to."""
    # Find all group IDs the user is a member of
    memberships = db.query(Membership).filter(Membership.user_id == current_user.id).all()
    group_ids = [m.group_id for m in memberships]
    
    if not group_ids:
        return []
        
    # Get upcoming sessions (start_time >= now)
    now = datetime.utcnow()
    sessions = db.query(StudySession).filter(
        StudySession.group_id.in_(group_ids),
        StudySession.start_time >= now
    ).order_by(StudySession.start_time.asc()).all()
    
    return sessions

@router.get("", response_model=List[StudySessionResponse])
def get_all_upcoming_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch all upcoming sessions across the entire platform."""
    now = datetime.utcnow()
    # Get all upcoming sessions (start_time >= now)
    sessions = db.query(StudySession).filter(
        StudySession.start_time >= now
    ).order_by(StudySession.start_time.asc()).all()
    
    result = []
    for s in sessions:
        # Transform SQLAlchemy model to dict and include group_name
        result.append({
            "id": s.id,
            "group_id": s.group_id,
            "group_name": s.group.name,
            "title": s.title,
            "start_time": s.start_time,
            "duration_minutes": s.duration_minutes,
            "location": s.location
        })
        
    return result

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user
from models.all_models import Membership, StudySession, User
from routes.groups import session_out

router = APIRouter()


def my_group_ids(db: Session, user: User) -> list[int]:
    return [m.group_id for m in db.query(Membership).filter(Membership.user_id == user.id,
                                                            Membership.status == "accepted").all()]


@router.get("/me")
def get_my_upcoming_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Upcoming sessions in the student's own groups."""
    ids = my_group_ids(db, current_user)
    if not ids:
        return []
    rows = (db.query(StudySession).filter(StudySession.group_id.in_(ids), StudySession.start_time >= datetime.utcnow())
            .order_by(StudySession.start_time.asc()).all())
    return [session_out(s) for s in rows]


@router.get("")
def get_my_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Upcoming sessions plus the last 30 days (to mark attendance) - only the student's own groups.
    (The first version listed every session on the platform, including other students' groups.)"""
    ids = my_group_ids(db, current_user)
    if not ids:
        return []
    since = datetime.utcnow() - timedelta(days=30)
    rows = (db.query(StudySession).filter(StudySession.group_id.in_(ids), StudySession.start_time >= since)
            .order_by(StudySession.start_time.asc()).all())
    return [session_out(s) for s in rows]

from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user
from models.all_models import Notification, User
from schemas.notification import NotificationResponse

router = APIRouter()


@router.get("", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (db.query(Notification).filter(Notification.user_id == current_user.id)
            .order_by(Notification.created_at.desc()).limit(200).all())


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"count": db.query(Notification).filter(Notification.user_id == current_user.id,
                                                   Notification.is_read.is_(False)).count()}


@router.put("/read-all")
def mark_all_read(link: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Mark all as read, or only those that point to one page (e.g. a group chat)."""
    q = db.query(Notification).filter(Notification.user_id == current_user.id, Notification.is_read.is_(False))
    if link:
        q = q.filter(Notification.link == link)
    q.update({"is_read": True}, synchronize_session=False)
    db.commit()
    return {"status": "success"}


@router.post("/{notification_id}/read")
def mark_notif_read(notification_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.id == notification_id, Notification.user_id == current_user.id) \
        .update({"is_read": True})
    db.commit()
    return {"status": "success"}


@router.delete("/clear-all")
def clear_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == current_user.id).delete()
    db.commit()
    return {"status": "success"}

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.deps import get_current_user
from models.all_models import User, Notification
from schemas.notification import NotificationResponse

router = APIRouter()

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all notifications securely linked to the current user."""
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()
    return notifs

@router.put("/read-all")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Securely mark all current user notifications as read via a single transactional query."""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True}, synchronize_session="fetch")
    db.commit()
    return {"status": "success", "message": "All notifications marked as read."}

@router.post("/{notification_id}/read")
def mark_notif_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a specific notification as read."""
    db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).update({"is_read": True})
    db.commit()
    return {"status": "success"}

@router.delete("/clear-all")
def clear_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Securely delete all notifications for the current user."""
    db.query(Notification).filter(Notification.user_id == current_user.id).delete()
    db.commit()
    return {"status": "success", "message": "All notifications cleared."}

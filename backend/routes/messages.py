import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from core.config import settings
from core.database import get_db
from core.deps import get_current_user
from models.all_models import GroupMessage, Notification, User
from routes.groups import active_members, load_group
from schemas.message import GroupMessageCreate, GroupMessageResponse
from services.group_formation import notify

router = APIRouter()

ALLOWED_EXT = {".pdf", ".doc", ".docx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".txt", ".zip"}


def message_out(m: GroupMessage) -> dict:
    return {"id": m.id, "group_id": m.group_id, "sender_id": m.sender_id,
            "sender_name": m.sender.full_name or m.sender.email if m.sender else "Former member",
            "content": m.content, "is_file": m.is_file, "file_url": m.file_url, "file_name": m.file_name,
            "created_at": m.created_at}


def notify_new_message(db: Session, group, sender: User, preview: str):
    link = f"/groups/{group.id}"
    for m in active_members(group):
        if m.user_id == sender.id or m.status != "accepted":
            continue
        unread = db.query(Notification).filter(Notification.user_id == m.user_id, Notification.type == "message",
                                               Notification.link == link, Notification.is_read.is_(False)).first()
        if not unread:  # one "new messages" alert until they read it
            notify(db, m.user_id, f"New message in {group.name} - {sender.full_name}: {preview[:80]}", "message", group.id, link)


@router.get("/{group_id}/messages", response_model=List[GroupMessageResponse])
def get_group_messages(group_id: int, after: int = 0, limit: int = 200, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    """Chat history for members. Pass ?after=<last id> to fetch only new messages."""
    group, _ = load_group(db, group_id, current_user)
    rows = (db.query(GroupMessage).filter(GroupMessage.group_id == group.id, GroupMessage.id > after)
            .order_by(GroupMessage.id.desc()).limit(min(limit, 500)).all())
    return [message_out(m) for m in reversed(rows)]


@router.post("/{group_id}/messages", response_model=GroupMessageResponse)
def send_group_message(group_id: int, message_in: GroupMessageCreate, db: Session = Depends(get_db),
                       current_user: User = Depends(get_current_user)):
    group, _ = load_group(db, group_id, current_user, need_accepted=True)
    text = (message_in.content or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Write a message first.")
    msg = GroupMessage(group_id=group.id, sender_id=current_user.id, content=text[:4000])
    db.add(msg)
    notify_new_message(db, group, current_user, text)
    db.commit()
    db.refresh(msg)
    return message_out(msg)


@router.post("/{group_id}/upload", response_model=GroupMessageResponse)
async def upload_group_file(group_id: int, file: UploadFile = File(...), db: Session = Depends(get_db),
                            current_user: User = Depends(get_current_user)):
    """Share a file in the group chat (PDF, Office, images, text or zip; size limited)."""
    group, _ = load_group(db, group_id, current_user, need_accepted=True)
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="This file type is not allowed. Share PDF, Word, PowerPoint, images, text or zip files.")
    data = await file.read(settings.MAX_UPLOAD_MB * 1024 * 1024 + 1)
    if len(data) > settings.MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"The file is larger than {settings.MAX_UPLOAD_MB} MB.")
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    stored = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(settings.UPLOAD_DIR, stored), "wb") as out:
        out.write(data)
    msg = GroupMessage(group_id=group.id, sender_id=current_user.id, is_file=True,
                       file_url=f"/uploads/{stored}", file_name=os.path.basename(file.filename)[:200])
    db.add(msg)
    notify_new_message(db, group, current_user, f"shared {msg.file_name}")
    db.commit()
    db.refresh(msg)
    return message_out(msg)

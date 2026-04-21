from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.deps import get_current_user
from models.all_models import User, Membership, GroupMessage, StudyGroup
from schemas.message import GroupMessageCreate, GroupMessageResponse

router = APIRouter()

@router.get("/{group_id}/messages", response_model=List[GroupMessageResponse])
def get_group_messages(
    group_id: int,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Fetch chat history for a group, restricted to its members."""
    membership = db.query(Membership).filter(
        Membership.group_id == group_id,
        Membership.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="You are not a member of this study group.")
    
    # We fetch the latest 50 messages
    messages = db.query(GroupMessage).filter(GroupMessage.group_id == group_id).order_by(GroupMessage.created_at.asc()).limit(limit).all()
    
    result = []
    for m in messages:
        result.append({
            "id": m.id,
            "group_id": m.group_id,
            "sender_id": m.sender_id,
            "sender_name": m.sender.full_name or m.sender.email,
            "content": m.content,
            "created_at": m.created_at
        })
        
    return result

@router.post("/{group_id}/messages", response_model=GroupMessageResponse)
def send_group_message(
    group_id: int,
    message_in: GroupMessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a new message to a study group."""
    membership = db.query(Membership).filter(
        Membership.group_id == group_id,
        Membership.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="You must be a member to send messages.")
    
    new_message = GroupMessage(
        group_id=group_id,
        sender_id=current_user.id,
        content=message_in.content
    )
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    return {
        "id": new_message.id,
        "group_id": new_message.group_id,
        "sender_id": new_message.sender_id,
        "sender_name": current_user.full_name or current_user.email,
        "content": new_message.content,
        "created_at": new_message.created_at
    }

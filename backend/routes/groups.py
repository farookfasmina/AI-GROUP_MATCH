from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from core.database import get_db
from core.deps import get_current_user, get_optional_current_user
from schemas.study_group import StudyGroupCreate, StudyGroupResponse
from schemas.session import StudySessionCreate, StudySessionResponse
from models.all_models import User, StudyGroup, Membership, StudySession

router = APIRouter()

@router.post("", response_model=StudyGroupResponse)
def create_group(
    group_in: StudyGroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new study group and set the creator as admin."""
    group = StudyGroup(
        name=group_in.name,
        description=group_in.description,
        subject=group_in.subject,
        creator_id=current_user.id
    )
    db.add(group)
    db.commit()
    db.refresh(group)
    
    # Automatically add creator to the group as an admin
    membership = Membership(user_id=current_user.id, group_id=group.id, role="admin")
    db.add(membership)
    db.commit()
    
    # Return group with role populated as a dict to ensure serialization
    group_dict = {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "subject": group.subject,
        "creator_id": group.creator_id,
        "created_at": group.created_at,
        "user_role": "admin"
    }
    return group_dict

@router.get("", response_model=List[StudyGroupResponse])
def list_groups(
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user)
):
    """List all available study groups, including current user's membership role if any."""
    groups = db.query(StudyGroup).all()
    
    # Check memberships ONLY IF user is logged in
    mem_map = {}
    if current_user:
        memberships = db.query(Membership).filter(Membership.user_id == current_user.id).all()
        mem_map = {m.group_id: m.role for m in memberships}
    
    result = []
    for g in groups:
        # Manually construct dict from SQLAlchemy model
        g_data = {
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "subject": g.subject,
            "creator_id": g.creator_id,
            "created_at": g.created_at,
            "user_role": mem_map.get(g.id, "")
        }
        result.append(g_data)
        
    return result

@router.get("/me", response_model=List[StudyGroupResponse])
def my_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List only study groups the user is currently a member of, including their role."""
    memberships = db.query(Membership).filter(Membership.user_id == current_user.id).all()
    
    result = []
    for m in memberships:
        group = db.query(StudyGroup).filter(StudyGroup.id == m.group_id).first()
        if group:
            g_data = {
                "id": group.id,
                "name": group.name,
                "description": group.description,
                "subject": group.subject,
                "creator_id": group.creator_id,
                "created_at": group.created_at,
                "user_role": m.role
            }
            result.append(g_data)
            
    return result

@router.post("/{group_id}/join")
def join_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Self-join an existing study group."""
    group = db.query(StudyGroup).filter(StudyGroup.id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Study group not found")
        
    existing_member = db.query(Membership).filter(
        Membership.group_id == group_id, 
        Membership.user_id == current_user.id
    ).first()
    
    if existing_member:
        raise HTTPException(status_code=400, detail="Already a member of this group")
        
    membership = Membership(user_id=current_user.id, group_id=group_id, role="member")
    db.add(membership)
    db.commit()
    return {"message": f"Successfully joined {group.name}"}

@router.get("/{group_id}/members")
def get_group_members(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List members of a group."""
    memberships = db.query(Membership).filter(Membership.group_id == group_id).all()
    
    result = []
    for m in memberships:
        user = db.query(User).filter(User.id == m.user_id).first()
        if user:
            result.append({
                "id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "role": m.role,
                "joined_at": m.joined_at
            })
    return result

@router.post("/{group_id}/sessions", response_model=StudySessionResponse)
def create_session(
    group_id: int,
    session_in: StudySessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new session for a group. Only admins can do this."""
    membership = db.query(Membership).filter(
        Membership.group_id == group_id, 
        Membership.user_id == current_user.id
    ).first()
    
    if not membership or membership.role != "admin":
        raise HTTPException(status_code=403, detail="Only group admins can create sessions.")
        
    db_session = StudySession(
        group_id=group_id,
        title=session_in.title,
        start_time=session_in.start_time,
        duration_minutes=session_in.duration_minutes,
        location=session_in.location
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

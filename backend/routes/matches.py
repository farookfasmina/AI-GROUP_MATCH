from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from core.database import get_db
from core.deps import get_current_user
from models.all_models import User, Notification, StudyGroup, Membership
from services.matching_service import get_top_user_matches

router = APIRouter()

@router.get("/me")
def get_my_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get top study matches for the current user using the custom AI matching service.
    """
    all_other_users = db.query(User).filter(User.id != current_user.id).all()
    
    # Execute our custom rule-based matching algorithm from the service directly
    matches = get_top_user_matches(current_user=current_user, other_users=all_other_users, top_n=5)
    return matches

@router.post("/{target_user_id}/connect")
def connect_with_match(
    target_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a connection request notification to a specific match."""
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Create the actionable notification
    notif = Notification(
        user_id=target_user_id,
        message=f"{current_user.full_name or current_user.email} is interested in studying with you!",
        type="match_request",
        payload_id=current_user.id
    )
    db.add(notif)
    db.commit()
    return {"message": "Connection request sent"}

@router.post("/{target_user_id}/init-private-group")
def init_private_group(
    target_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Finds or creates a private 2-person study group for the current user and their match.
    Returns the group_id to enable scheduling sessions for this 'match'.
    """
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if a private group already exists between these two users
    # We look for groups named exactly 'Private: [ID1] & [ID2]' or vice versa
    id_pair = sorted([current_user.id, target_user_id])
    group_name = f"Match: {current_user.full_name or 'User'} & {target_user.full_name or 'User'}"
    
    # Query for a group where both are members
    # Simpler: check for groups where current_user is creator and it involves the target name
    # Better: Use a specific naming convention to find existing match groups
    match_group = db.query(StudyGroup).filter(
        StudyGroup.name.like(f"%Match: %"),
        StudyGroup.creator_id.in_([current_user.id, target_user_id])
    ).first() # This is a heuristic. In a real app, you'd use a many-to-many join or a specific group type.
    
    if match_group:
        return {"group_id": match_group.id, "name": match_group.name}
        
    # Create new private group
    new_group = StudyGroup(
        name=group_name,
        description=f"Automated study group for matched partners {current_user.email} and {target_user.email}.",
        subject="Personal Study",
        creator_id=current_user.id
    )
    db.add(new_group)
    db.flush() # Get the new ID
    
    # Add both users as admins of this match group
    db.add(Membership(user_id=current_user.id, group_id=new_group.id, role="admin"))
    db.add(Membership(user_id=target_user_id, group_id=new_group.id, role="admin"))
    
    db.commit()
    return {"group_id": new_group.id, "name": new_group.name}

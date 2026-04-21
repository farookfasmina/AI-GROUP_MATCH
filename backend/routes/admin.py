from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from core.database import get_db
from core.deps import get_current_user
from models.all_models import User, StudyGroup, StudySession

router = APIRouter()

def get_platform_admin(current_user: User = Depends(get_current_user)):
    """Dependency to enforce platform admin status."""
    if not current_user.is_platform_admin:
        raise HTTPException(status_code=403, detail="Platform administrator privileges required.")
    return current_user

@router.get("/stats", response_model=Dict[str, Any])
def get_platform_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(get_platform_admin)
):
    """Calculate platform-wide KPIs."""
    total_users = db.query(User).count()
    total_groups = db.query(StudyGroup).count()
    total_sessions = db.query(StudySession).count()
    
    return {
        "total_users": total_users,
        "total_groups": total_groups,
        "total_sessions": total_sessions
    }

@router.get("/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(get_platform_admin)
):
    """Get all registered users for the directory table."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "university": u.university,
            "is_admin": u.is_platform_admin,
            "created_at": u.created_at
        })
    return result

@router.patch("/users/{user_id}/toggle-admin")
def toggle_user_admin(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_platform_admin)
):
    """Toggle a user's admin status."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent self-demotion to avoid being locked out
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot toggle your own admin status")
        
    user.is_platform_admin = not user.is_platform_admin
    db.commit()
    return {"message": f"User admin status changed to {user.is_platform_admin}"}

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(get_platform_admin)
):
    """Permanently delete a user and their associated data."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account from the admin panel")
        
    # Note: SQLAlchemy cascade handles child objects like Preferences, Memberships if configured.
    # If not, we do it manually. 
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully"}

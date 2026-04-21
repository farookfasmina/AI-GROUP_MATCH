from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models.all_models import User
from schemas.user import UserProfile, UserUpdate
from core.deps import get_current_user
from core.database import get_db

router = APIRouter()

@router.get("/me", response_model=UserProfile)
def read_current_user(current_user: User = Depends(get_current_user)):
    """
    Get current logged-in user.
    This acts as a clear example of a protected route using JWT authentication.
    """
    return current_user

@router.put("/me", response_model=UserProfile)
def update_current_user(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update current user profile information."""
    if user_in.full_name is not None:
        current_user.full_name = user_in.full_name
    if user_in.university is not None:
        current_user.university = user_in.university
    if user_in.department is not None:
        current_user.department = user_in.department
    if user_in.academic_year is not None:
        current_user.academic_year = user_in.academic_year
        
    db.commit()
    db.refresh(current_user)
    return current_user

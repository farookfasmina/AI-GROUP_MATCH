from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.deps import get_current_user
from models.all_models import User, Availability
from schemas.availability import AvailabilityCreate, AvailabilityResponse
from typing import List

router = APIRouter()

@router.get("", response_model=List[AvailabilityResponse])
def get_availability(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current user's availability slots."""
    availabilities = db.query(Availability).filter(Availability.user_id == current_user.id).all()
    return availabilities

@router.post("", response_model=dict)
def save_availability(
    availability_in: List[AvailabilityCreate],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Save the current user's availability slots by replacing the old ones."""
    # Delete old availabilities
    db.query(Availability).filter(Availability.user_id == current_user.id).delete()
    
    # Insert new availabilities
    new_slots = []
    for slot in availability_in:
        new_avail = Availability(
            user_id=current_user.id,
            day_of_week=slot.day_of_week,
            start_time=slot.start_time,
            end_time=slot.end_time
        )
        db.add(new_avail)
    
    db.commit()
    return {"message": "Availability updated successfully"}

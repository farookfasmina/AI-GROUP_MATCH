from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user
from models.all_models import Availability, User
from schemas.availability import AvailabilityCreate, AvailabilityResponse
from services.matching_service import DAYS

router = APIRouter()


@router.get("", response_model=List[AvailabilityResponse])
def get_availability(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Availability).filter(Availability.user_id == current_user.id).all()


@router.post("", response_model=dict)
def save_availability(availability_in: List[AvailabilityCreate], db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    """Replace the student's weekly free time."""
    for slot in availability_in:
        if slot.day_of_week not in DAYS:
            raise HTTPException(status_code=400, detail=f"'{slot.day_of_week}' is not a day of the week.")
        if slot.end_time <= slot.start_time and slot.end_time.hour != 0:
            raise HTTPException(status_code=400, detail=f"On {slot.day_of_week} the end time must be after the start time.")
    db.query(Availability).filter(Availability.user_id == current_user.id).delete()
    for slot in availability_in:
        db.add(Availability(user_id=current_user.id, day_of_week=slot.day_of_week,
                            start_time=slot.start_time, end_time=slot.end_time))
    db.commit()
    return {"message": "Availability saved"}

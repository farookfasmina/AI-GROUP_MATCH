from pydantic import BaseModel
from typing import Optional
from datetime import time

class AvailabilityCreate(BaseModel):
    day_of_week: str
    start_time: time
    end_time: time

class AvailabilityResponse(AvailabilityCreate):
    id: int
    user_id: int

    class Config:
        from_attributes = True

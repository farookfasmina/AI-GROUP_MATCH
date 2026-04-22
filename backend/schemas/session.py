from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class StudySessionCreate(BaseModel):
    title: str
    start_time: datetime
    duration_minutes: int = 60
    location: Optional[str] = None

class StudySessionResponse(StudySessionCreate):
    id: int
    group_id: int
    group_name: Optional[str] = None

    class Config:
        from_attributes = True

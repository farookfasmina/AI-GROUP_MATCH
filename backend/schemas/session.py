from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class StudySessionCreate(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    start_time: datetime
    duration_minutes: int = Field(default=60, ge=15, le=480)
    location: Optional[str] = Field(default=None, max_length=300)


class StudySessionResponse(StudySessionCreate):
    id: int
    group_id: int
    group_name: Optional[str] = None

    class Config:
        from_attributes = True

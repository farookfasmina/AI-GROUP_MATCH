from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class StudyInsightBase(BaseModel):
    title: str
    content: str
    type: str

class StudyInsightCreate(StudyInsightBase):
    user_id: int
    group_id: Optional[int] = None

class StudyInsightResponse(StudyInsightBase):
    id: int
    user_id: int
    group_id: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

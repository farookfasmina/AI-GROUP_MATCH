from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class StudyGroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    subject: str

class StudyGroupCreate(StudyGroupBase):
    pass

class StudyGroupResponse(StudyGroupBase):
    id: int
    creator_id: int
    created_at: datetime
    user_role: str = "" # Default to empty string instead of None to ensure key exists

    class Config:
        from_attributes = True

class MatchResponse(BaseModel):
    # Represents a grouping suggestion made by the platform
    group: StudyGroupResponse
    match_score: float
    reason: str

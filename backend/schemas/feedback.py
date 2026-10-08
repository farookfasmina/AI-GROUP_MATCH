from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    compatibility_rating: int = Field(..., ge=1, le=5)
    collaboration_quality: int = Field(..., ge=1, le=5)
    scheduling_ease: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = Field(default=None, max_length=1000)


class GroupFeedbackCreate(FeedbackCreate):
    would_continue: bool = True


class FeedbackResponse(FeedbackCreate):
    id: int
    user_id: int
    matched_user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SurveyCreate(BaseModel):
    sus_answers: List[int] = Field(min_length=10, max_length=10)
    fairness: int = Field(ge=1, le=5)
    usefulness: int = Field(ge=1, le=5)
    ease: int = Field(ge=1, le=5)
    comment: Optional[str] = Field(default=None, max_length=1000)

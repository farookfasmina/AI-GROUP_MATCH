from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class FeedbackCreate(BaseModel):
    compatibility_rating: int = Field(..., ge=1, le=5)
    collaboration_quality: int = Field(..., ge=1, le=5)
    scheduling_ease: int = Field(..., ge=1, le=5)
    feedback_text: Optional[str] = None

class FeedbackResponse(FeedbackCreate):
    id: int
    user_id: int
    matched_user_id: int
    created_at: datetime

    class Config:
        from_attributes = True

from typing import Dict, Optional

from pydantic import BaseModel, Field


class PreferenceUpdate(BaseModel):
    subjects_of_interest: Optional[str] = None
    learning_style: Optional[str] = None
    communication_preference: Optional[str] = None
    competency_level: Optional[str] = None
    preferred_study_type: Optional[str] = None
    collaboration_tendency: Optional[str] = None
    subject_levels: Optional[Dict[str, str]] = None
    preferred_group_size: Optional[int] = Field(default=None, ge=2, le=8)


class PreferenceResponse(PreferenceUpdate):
    id: Optional[int] = None
    user_id: int

    class Config:
        from_attributes = True

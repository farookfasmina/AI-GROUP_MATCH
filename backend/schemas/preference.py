from pydantic import BaseModel
from typing import Optional

class PreferenceUpdate(BaseModel):
    subjects_of_interest: Optional[str] = None
    learning_style: Optional[str] = None
    communication_preference: Optional[str] = None
    competency_level: Optional[str] = None
    preferred_study_type: Optional[str] = None
    collaboration_tendency: Optional[str] = None

class PreferenceResponse(PreferenceUpdate):
    id: Optional[int] = None
    user_id: int

    class Config:
        from_attributes = True

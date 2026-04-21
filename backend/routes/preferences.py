from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from core.database import get_db
from core.deps import get_current_user
from models.all_models import User, Preference
from schemas.preference import PreferenceUpdate, PreferenceResponse

router = APIRouter()

@router.get("/me", response_model=PreferenceResponse)
def get_my_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the current user's preferences.
    """
    pref = db.query(Preference).filter(Preference.user_id == current_user.id).first()
    if not pref:
        # Return an empty preference block if not set yet
        return {"user_id": current_user.id, "subjects_of_interest": "", "learning_style": "", "communication_preference": "", "competency_level": ""}
    return pref

@router.put("/me", response_model=dict)
def update_preferences(
    prefs_in: PreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update the current user's preferences.
    """
    pref = db.query(Preference).filter(Preference.user_id == current_user.id).first()
    if not pref:
        pref = Preference(user_id=current_user.id)
        db.add(pref)
        
    if prefs_in.subjects_of_interest is not None:
        pref.subjects_of_interest = prefs_in.subjects_of_interest
    if prefs_in.learning_style is not None:
        pref.learning_style = prefs_in.learning_style
    if prefs_in.communication_preference is not None:
        pref.communication_preference = prefs_in.communication_preference
    if prefs_in.competency_level is not None:
        pref.competency_level = prefs_in.competency_level
    if prefs_in.preferred_study_type is not None:
        pref.preferred_study_type = prefs_in.preferred_study_type
    if prefs_in.collaboration_tendency is not None:
        pref.collaboration_tendency = prefs_in.collaboration_tendency
        
    db.commit()
    db.refresh(pref)
    return {"message": "Preferences updated successfully"}

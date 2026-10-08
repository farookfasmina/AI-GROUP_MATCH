from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user
from models.all_models import Preference, Subject, User
from schemas.preference import PreferenceResponse, PreferenceUpdate

router = APIRouter()

ALLOWED = {
    "learning_style": {"Visual", "Auditory", "Reading/Writing", "Kinesthetic"},
    "communication_preference": {"Text", "Voice", "Video", "In-Person"},
    "competency_level": {"Beginner", "Intermediate", "Advanced", "Expert"},
    "preferred_study_type": {"Group", "Buddy", "Either"},
    "collaboration_tendency": {"Collaborative Peer", "Driven Leader", "Focused Learner"},
}


@router.get("/subjects")
def subject_catalogue(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Course catalogue students pick their subjects from."""
    rows = db.query(Subject).filter(Subject.active.is_(True)).order_by(Subject.name).all()
    return [{"id": s.id, "code": s.code, "name": s.name} for s in rows]


@router.get("/me", response_model=PreferenceResponse)
def get_my_preferences(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    pref = db.query(Preference).filter(Preference.user_id == current_user.id).first()
    if not pref:
        return {"user_id": current_user.id, "subjects_of_interest": "", "learning_style": "",
                "communication_preference": "", "competency_level": "", "preferred_study_type": "Group",
                "collaboration_tendency": "Collaborative Peer", "subject_levels": {}, "preferred_group_size": 4}
    return pref


@router.put("/me", response_model=dict)
def update_preferences(prefs_in: PreferenceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for field, options in ALLOWED.items():
        value = getattr(prefs_in, field)
        if value and value not in options:
            raise HTTPException(status_code=400, detail=f"'{value}' is not a valid choice for {field.replace('_', ' ')}.")
    if prefs_in.subject_levels:
        bad = [v for v in prefs_in.subject_levels.values() if v not in ALLOWED["competency_level"]]
        if bad:
            raise HTTPException(status_code=400, detail=f"'{bad[0]}' is not a valid level.")

    pref = db.query(Preference).filter(Preference.user_id == current_user.id).first()
    if not pref:
        pref = Preference(user_id=current_user.id)
        db.add(pref)
    for field, value in prefs_in.model_dump(exclude_unset=True).items():
        if value is None:
            continue
        if field == "subjects_of_interest":
            # Tidy "ML ,  Calculus,," into "ML, Calculus"
            value = ", ".join(dict.fromkeys(s.strip() for s in value.split(",") if s.strip()))
        setattr(pref, field, value)
    # Keep only levels for subjects the student still studies
    if pref.subject_levels and pref.subjects_of_interest is not None:
        chosen = {s.strip().lower() for s in pref.subjects_of_interest.split(",")}
        pref.subject_levels = {k: v for k, v in pref.subject_levels.items() if k.strip().lower() in chosen}
    db.commit()
    return {"message": "Preferences saved"}

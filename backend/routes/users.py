from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user
from core.security import get_password_hash, verify_password
from models.all_models import SurveyResponse, User
from schemas.user import ChangePasswordIn, UserUpdate

router = APIRouter()


def user_profile(user: User) -> dict:
    pref = user.preference
    return {
        "id": user.id, "email": user.email, "full_name": user.full_name, "university": user.university,
        "department": user.department, "academic_year": user.academic_year,
        "is_platform_admin": bool(user.is_platform_admin), "created_at": user.created_at,
        "consent_given": bool(user.consent_given), "consent_at": user.consent_at, "is_demo": bool(user.is_demo),
        # Ready to be matched: agreed to take part, said what they study, and when they are free.
        "profile_complete": bool(user.consent_given and pref and pref.subjects_of_interest and user.availabilities),
    }


@router.get("/me")
def read_current_user(current_user: User = Depends(get_current_user)):
    return user_profile(current_user)


@router.put("/me")
def update_current_user(user_in: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for field in ("full_name", "university", "department", "academic_year"):
        value = getattr(user_in, field)
        if value is not None:
            setattr(current_user, field, value.strip())
    db.commit()
    db.refresh(current_user)
    return user_profile(current_user)


@router.post("/me/password")
def change_password(data: ChangePasswordIn, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Your current password is not correct.")
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password changed."}


@router.post("/me/consent")
def give_consent(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Informed consent (proposal: Ethics). Students are only matched after this."""
    if not current_user.consent_given:
        current_user.consent_given = True
        current_user.consent_at = datetime.utcnow()
        db.commit()
    return user_profile(current_user)


@router.delete("/me/consent")
def withdraw_consent(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Right to withdraw at any time without penalty: the student is no longer matched."""
    current_user.consent_given = False
    db.commit()
    return user_profile(current_user)


@router.get("/me/survey")
def my_survey(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    r = db.query(SurveyResponse).filter(SurveyResponse.user_id == current_user.id).first()
    if not r:
        return None
    return {"sus_answers": r.sus_answers, "sus_score": r.sus_score, "fairness": r.fairness,
            "usefulness": r.usefulness, "ease": r.ease, "comment": r.comment}

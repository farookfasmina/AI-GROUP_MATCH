from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.database import get_db
from core.deps import get_current_user
from models.all_models import SurveyResponse, User
from schemas.feedback import SurveyCreate

router = APIRouter()


def sus_score(answers: list[int]) -> float:
    """Standard System Usability Scale: odd items (x-1), even items (5-x), total x 2.5 -> 0..100."""
    return round(sum((a - 1) if i % 2 == 0 else (5 - a) for i, a in enumerate(answers)) * 2.5, 1)


@router.post("")
def submit_survey(data: SurveyCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if any(a < 1 or a > 5 for a in data.sus_answers):
        raise HTTPException(status_code=400, detail="Each answer must be from 1 to 5.")
    row = db.query(SurveyResponse).filter(SurveyResponse.user_id == current_user.id).first()
    if not row:
        row = SurveyResponse(user_id=current_user.id)
        db.add(row)
    row.sus_answers = data.sus_answers
    row.sus_score = sus_score(data.sus_answers)
    row.fairness, row.usefulness, row.ease, row.comment = data.fairness, data.usefulness, data.ease, data.comment
    db.commit()
    return {"sus_score": row.sus_score}

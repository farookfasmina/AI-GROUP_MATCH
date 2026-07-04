from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from core.database import get_db
from core.deps import get_current_user
from models.all_models import User, StudyInsight
from schemas.insight import StudyInsightResponse
from services.ai_service import generate_user_insights
import json
import os

router = APIRouter()

@router.get("/insights", response_model=List[StudyInsightResponse])
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetches personalized AI insights. 
    Generates fresh insights dynamically on request to support real-time demo updates.
    """
    # Clear previous insights to prevent table bloat and guarantee immediate updates
    db.query(StudyInsight).filter(StudyInsight.user_id == current_user.id).delete()
    db.commit()
    
    recent_insights = generate_user_insights(db, user_id=current_user.id)
    return recent_insights


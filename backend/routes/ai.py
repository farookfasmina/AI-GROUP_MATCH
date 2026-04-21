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
    Generates new ones if none exist for the last hour to ensure fresh content.
    """
    # Check for insights generated in the last hour
    hour_ago = datetime.utcnow() - timedelta(hours=1)
    recent_insights = db.query(StudyInsight).filter(
        StudyInsight.user_id == current_user.id,
        StudyInsight.created_at >= hour_ago
    ).order_by(StudyInsight.created_at.desc()).all()
    
    if not recent_insights:
        # Generate fresh insights through the AI engine
        recent_insights = generate_user_insights(db, user_id=current_user.id)
        
    return recent_insights

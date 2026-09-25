from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas import RecommendationRequest, RecommendationResponse
from ..services.recommendation_service import RecommendationService
from ..auth import get_current_user_optional
from ..models import User

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

@router.post("/intelligent", response_model=RecommendationResponse)
def get_intelligent_recommendations(
    req: RecommendationRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    uid = current_user.id if current_user else 1
    return RecommendationService.get_recommendations(db, req, user_id=uid)

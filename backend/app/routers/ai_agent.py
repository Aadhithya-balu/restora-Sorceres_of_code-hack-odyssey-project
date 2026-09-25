from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas import (
    RestPointAIRequest, RestPointAIResponse,
    RakshitArthaAIRequest, RakshitArthaAIResponse
)
from ..services.ai_agent_service import AIAgentService
from ..auth import get_current_user_optional
from ..models import User

router = APIRouter(prefix="/api/ai", tags=["Groq AI Agents"])

@router.post("/restpoint-recommend", response_model=RestPointAIResponse)
def recommend_restpoint_ai(
    req: RestPointAIRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Agent 1: RestPoint Recommendation Agent
    Takes natural language gig-worker inquiries (e.g. 'I need washroom and water nearby'),
    extracts structured intent via Groq, deterministically retrieves and ranks real facilities,
    and returns verified facilities with Groq grounded explanations.
    """
    uid = current_user.id if current_user else 1
    return AIAgentService.recommend_restpoint(
        db=db,
        query=req.query,
        lat=req.lat,
        lng=req.lng,
        max_distance_km=req.max_distance_km,
        user_id=uid
    )

@router.post("/rakshitartha-disruption", response_model=RakshitArthaAIResponse)
def evaluate_rakshitartha_disruption(
    req: RakshitArthaAIRequest,
    db: Session = Depends(get_db)
):
    """
    Agent 2: RakshitArtha Disruption Agent
    Takes live coordinates and worker income inputs, verifies real weather data,
    evaluates deterministic disruption safety rules and income-impact calculations,
    connects real nearby Restora support facilities, and returns Groq practical summaries.
    """
    return AIAgentService.evaluate_disruption(
        db=db,
        lat=req.lat,
        lng=req.lng,
        daily_income=req.daily_income,
        working_hours=req.working_hours,
        downtime_hours=req.downtime_hours,
        affected_days=req.affected_days,
        client_weather=req.client_weather
    )

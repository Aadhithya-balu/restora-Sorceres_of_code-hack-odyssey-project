from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..schemas import RoutePlanRequest, RoutePlanResponse
from ..services.route_service import RouteService
from ..auth import get_current_user_optional
from ..models import User

router = APIRouter(prefix="/api/routes", tags=["Route Planning"])

@router.post("/plan", response_model=RoutePlanResponse)
def plan_route_rest_points(
    req: RoutePlanRequest,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # Reject identical or nearly identical origin and destination (< 50 meters)
    if abs(req.origin_lat - req.destination_lat) < 0.00045 and abs(req.origin_lng - req.destination_lng) < 0.00045:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Origin and destination must be different locations."
        )

    uid = current_user.id if current_user else 1
    return RouteService.plan_route_rest_points(db, req, user_id=uid)

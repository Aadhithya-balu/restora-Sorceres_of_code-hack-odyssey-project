from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas import (
    BreakSessionCreate, BreakSessionUpdate, BreakSessionSchema,
    IncomeImpactEstimateRequest, IncomeImpactEstimateResponse,
    BookmarkSchema
)
from ..services.break_service import BreakService
from ..auth import get_current_user
from ..models import User

router = APIRouter(prefix="/api", tags=["Break Planning & Support"])

@router.post("/breaks", response_model=BreakSessionSchema, status_code=status.HTTP_201_CREATED)
def create_break_session(
    data: BreakSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = BreakService.create_break_session(db, data, current_user)
    breaks = BreakService.get_user_breaks(db, current_user.id)
    return next((x for x in breaks if x["id"] == b.id), None)

@router.get("/breaks", response_model=List[BreakSessionSchema])
def get_breaks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return BreakService.get_user_breaks(db, current_user.id)

@router.patch("/breaks/{break_id}")
def update_break(
    break_id: int,
    data: BreakSessionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        updated = BreakService.update_break_session(db, break_id, data, current_user)
        if not updated:
            raise HTTPException(status_code=404, detail="Break session not found")
        return updated
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

@router.post("/breaks/estimate-impact", response_model=IncomeImpactEstimateResponse)
def estimate_income_impact(req: IncomeImpactEstimateRequest):
    return BreakService.estimate_income_impact(req)

# Bookmarks endpoints
@router.post("/bookmarks/{facility_id}")
def toggle_bookmark(
    facility_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return BreakService.toggle_bookmark(db, facility_id, current_user.id)

@router.get("/bookmarks", response_model=List[BookmarkSchema])
def get_bookmarks(
    lat: float = Query(11.0267),
    lng: float = Query(77.0118),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return BreakService.get_user_bookmarks(db, current_user.id, lat=lat, lng=lng)

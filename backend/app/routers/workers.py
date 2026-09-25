from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import WorkerProfileSchema, ActivitySchema
from ..services.worker_service import WorkerService
from typing import List

router = APIRouter(prefix="/api/worker", tags=["Worker"])

@router.get("", response_model=WorkerProfileSchema)
def get_worker_profile(db: Session = Depends(get_db)):
    profile = WorkerService.get_profile(db, worker_id=1)
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found")
    return profile

@router.post("/toggle-shift")
def toggle_shift(db: Session = Depends(get_db)):
    return WorkerService.toggle_shift(db, worker_id=1)

@router.post("/toggle-emergency")
def toggle_emergency(db: Session = Depends(get_db)):
    return WorkerService.toggle_emergency(db, worker_id=1)

@router.get("/activities", response_model=List[ActivitySchema])
def get_worker_activities(db: Session = Depends(get_db)):
    return WorkerService.get_activities(db, worker_id=1)

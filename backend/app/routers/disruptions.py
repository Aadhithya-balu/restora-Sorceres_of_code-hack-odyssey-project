from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas import CityConditionsSchema, DisruptionEventSchema
from ..services.disruption_service import DisruptionService

router = APIRouter(prefix="/api/disruptions", tags=["Disruptions"])

@router.get("/conditions", response_model=CityConditionsSchema)
def get_city_conditions(db: Session = Depends(get_db)):
    return DisruptionService.get_city_conditions(db, zone="Peelamedu")

@router.get("/active", response_model=List[DisruptionEventSchema])
def get_active_disruptions(db: Session = Depends(get_db)):
    return DisruptionService.get_active_disruptions(db)

@router.post("/simulate", response_model=DisruptionEventSchema)
def simulate_disruption(event_type: str = "HEAVY_RAIN", db: Session = Depends(get_db)):
    return DisruptionService.trigger_disruption_simulation(db, event_type=event_type)

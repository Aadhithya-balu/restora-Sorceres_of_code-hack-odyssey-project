from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from ..database import get_db
from ..schemas import ProtectionPlanSchema, WorkerPolicySchema, RiskExplainabilitySchema
from ..services.protection_service import ProtectionService

router = APIRouter(prefix="/api/protection", tags=["Protection"])

@router.get("/plans", response_model=List[ProtectionPlanSchema])
def get_plans(db: Session = Depends(get_db)):
    return ProtectionService.get_plans(db)

@router.get("/policy")
def get_policy(db: Session = Depends(get_db)):
    policy = ProtectionService.get_worker_policy(db, worker_id=1)
    if not policy:
        raise HTTPException(status_code=404, detail="No active policy found")
    return policy

@router.post("/switch-plan")
def switch_plan(payload: Dict[str, str] = Body(...), db: Session = Depends(get_db)):
    plan_slug = payload.get("plan_slug", "standard")
    try:
        return ProtectionService.switch_plan(db, worker_id=1, plan_slug=plan_slug)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/risk", response_model=RiskExplainabilitySchema)
def get_risk_assessment():
    return ProtectionService.get_risk_assessment(worker_id=1)

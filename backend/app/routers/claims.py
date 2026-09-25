from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..schemas import ClaimSchema, PayoutSchema
from ..services.claim_service import ClaimService

router = APIRouter(prefix="/api/claims", tags=["Claims & Payouts"])

@router.get("", response_model=List[ClaimSchema])
def get_claims(db: Session = Depends(get_db)):
    return ClaimService.get_claims(db, worker_id=1)

@router.get("/{claim_id}", response_model=ClaimSchema)
def get_claim_detail(claim_id: int, db: Session = Depends(get_db)):
    claim = ClaimService.get_claim_by_id(db, claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    return claim

@router.post("/{claim_id}/payout")
def complete_payout(claim_id: int, db: Session = Depends(get_db)):
    try:
        return ClaimService.complete_payout(db, claim_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/payouts/history", response_model=List[PayoutSchema])
def get_payouts_history(db: Session = Depends(get_db)):
    return ClaimService.get_payouts(db, worker_id=1)

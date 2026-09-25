import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from ..models import Claim, Payout, WorkerProfile, DisruptionEvent, ActivityLog

class ClaimService:
    @staticmethod
    def get_claims(db: Session, worker_id: int = 1) -> List[Claim]:
        return db.query(Claim).filter(Claim.worker_id == worker_id).order_by(Claim.created_at.desc()).all()

    @staticmethod
    def get_claim_by_id(db: Session, claim_id: int) -> Optional[Claim]:
        return db.query(Claim).filter(Claim.id == claim_id).first()

    @staticmethod
    def get_payouts(db: Session, worker_id: int = 1) -> List[Payout]:
        return db.query(Payout).filter(Payout.worker_id == worker_id).order_by(Payout.created_at.desc()).all()

    @staticmethod
    def complete_payout(db: Session, claim_id: int) -> dict:
        claim = db.query(Claim).filter(Claim.id == claim_id).first()
        if not claim:
            raise ValueError("Claim not found")

        claim.stage = "PAYOUT_COMPLETED"
        claim.status = "PAYOUT_COMPLETED"
        claim.paid_at = datetime.datetime.utcnow()

        # Update timeline
        if claim.timeline:
            tl = list(claim.timeline)
            for item in tl:
                item["completed"] = True
            claim.timeline = tl

        # Create Payout receipt
        payout = Payout(
            claim_id=claim.id,
            worker_id=claim.worker_id,
            amount=claim.amount,
            status="COMPLETED",
            method="UPI Instant",
            upi_id="aadhi@okhdfcbank",
            reference_number=f"UPI/{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}/OIVU",
            event_title=f"{claim.event_type} disruption",
            disclaimer="SIMULATED PAYOUT — Prototype demonstration",
            created_at=datetime.datetime.utcnow()
        )
        db.add(payout)

        # Update Worker stats
        worker = db.query(WorkerProfile).filter(WorkerProfile.id == claim.worker_id).first()
        if worker and worker.policy:
            worker.policy.total_payout_received += claim.amount
            worker.policy.total_claims_count += 1

        # Add Activity Log
        act = ActivityLog(
            worker_id=claim.worker_id,
            time_str=datetime.datetime.utcnow().strftime("%H:%M"),
            title=f"₹{int(claim.amount)} Payout Completed",
            subtitle=f"Directly credited via UPI to aadhi@okhdfcbank · {claim.event_type}",
            icon_name="check-circle-2",
            category="PROTECTION"
        )
        db.add(act)

        db.commit()
        return {
            "success": True,
            "claim_number": claim.claim_number,
            "amount": claim.amount,
            "status": "PAYOUT_COMPLETED",
            "reference_number": payout.reference_number,
            "message": f"₹{int(claim.amount)} credited to UPI successfully."
        }

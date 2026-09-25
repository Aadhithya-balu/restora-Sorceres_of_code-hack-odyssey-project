import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models import BreakSession, Facility, User, Bookmark
from ..schemas import BreakSessionCreate, BreakSessionUpdate, IncomeImpactEstimateRequest, IncomeImpactEstimateResponse
from .facility_service import FacilityService

class BreakService:
    @staticmethod
    def create_break_session(db: Session, data: BreakSessionCreate, user: User) -> BreakSession:
        break_sess = BreakSession(
            user_id=user.id,
            facility_id=data.facility_id,
            planned_duration_minutes=data.planned_duration_minutes,
            actual_duration_minutes=data.planned_duration_minutes,
            start_time=datetime.datetime.utcnow(),
            status="ACTIVE",
            notes=data.notes,
            created_at=datetime.datetime.utcnow()
        )
        db.add(break_sess)
        db.commit()
        db.refresh(break_sess)
        return break_sess

    @staticmethod
    def get_user_breaks(db: Session, user_id: int) -> List[dict]:
        breaks = db.query(BreakSession).filter(BreakSession.user_id == user_id).order_by(BreakSession.created_at.desc()).all()
        results = []
        for b in breaks:
            fac_name = b.facility.name if b.facility else "Unspecified Rest Spot"
            results.append({
                "id": b.id,
                "user_id": b.user_id,
                "facility_id": b.facility_id,
                "facility_name": fac_name,
                "planned_duration_minutes": b.planned_duration_minutes,
                "actual_duration_minutes": b.actual_duration_minutes,
                "start_time": b.start_time,
                "end_time": b.end_time,
                "status": b.status,
                "notes": b.notes,
                "created_at": b.created_at
            })
        return results

    @staticmethod
    def update_break_session(db: Session, break_id: int, data: BreakSessionUpdate, user: User) -> Optional[dict]:
        b = db.query(BreakSession).filter(BreakSession.id == break_id).first()
        if not b:
            return None
        if b.user_id != user.id and user.role != "admin":
            raise PermissionError("Not authorized to update this break session")

        if data.status:
            b.status = data.status
            if data.status == "COMPLETED" and not b.end_time:
                b.end_time = datetime.datetime.utcnow()
        if data.actual_duration_minutes is not None:
            b.actual_duration_minutes = data.actual_duration_minutes
        if data.notes:
            b.notes = data.notes

        db.commit()
        db.refresh(b)
        return {
            "id": b.id,
            "status": b.status,
            "actual_duration_minutes": b.actual_duration_minutes,
            "message": "Break session updated."
        }

    @staticmethod
    def estimate_income_impact(req: IncomeImpactEstimateRequest) -> IncomeImpactEstimateResponse:
        # Opportunity window estimation
        minute_rate = req.hourly_rate_estimate / 60.0
        opportunity_amount = round(minute_rate * req.planned_break_minutes, 2)

        disclaimer = (
            "This output is purely an illustrative planning estimate based on your self-entered average earnings rate. "
            "It does not represent actual platform earnings and does not imply that taking rest causes financial penalty. "
            "Restora does not guarantee income outcomes or compensate for downtime."
        )

        health_note = (
            "Preventing fatigue and heat exhaustion directly reduces road accidents and maintains physical stamina. "
            "A structured 15-20 min pause in the shade with hydration helps workers sustain higher productivity "
            "and alertness during peak order hours."
        )

        return IncomeImpactEstimateResponse(
            hourly_rate=req.hourly_rate_estimate,
            break_minutes=req.planned_break_minutes,
            estimated_opportunity_amount=opportunity_amount,
            disclaimer=disclaimer,
            health_benefit_note=health_note
        )

    # Bookmarks
    @staticmethod
    def toggle_bookmark(db: Session, facility_id: int, user_id: int) -> dict:
        existing = db.query(Bookmark).filter(Bookmark.facility_id == facility_id, Bookmark.user_id == user_id).first()
        if existing:
            db.delete(existing)
            db.commit()
            return {"bookmarked": False, "message": "Facility removed from saved places"}
        else:
            bm = Bookmark(facility_id=facility_id, user_id=user_id, created_at=datetime.datetime.utcnow())
            db.add(bm)
            db.commit()
            return {"bookmarked": True, "message": "Facility saved to your bookmarks"}

    @staticmethod
    def get_user_bookmarks(db: Session, user_id: int, lat: float = 11.0267, lng: float = 77.0118) -> List[dict]:
        bms = db.query(Bookmark).filter(Bookmark.user_id == user_id).all()
        results = []
        for bm in bms:
            fac_dict = FacilityService.get_facility_by_id(db, bm.facility_id, lat, lng, user_id)
            if fac_dict:
                results.append({
                    "id": bm.id,
                    "user_id": bm.user_id,
                    "facility_id": bm.facility_id,
                    "facility": fac_dict,
                    "created_at": bm.created_at
                })
        return results

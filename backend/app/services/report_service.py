import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models import FacilityReport, Facility, User
from ..schemas import FacilityReportCreate, ReportModeration

class ReportService:
    @staticmethod
    def create_report(db: Session, data: FacilityReportCreate, user: User) -> FacilityReport:
        fac = db.query(Facility).filter(Facility.id == data.facility_id).first()
        if not fac:
            raise ValueError("Facility not found")

        report = FacilityReport(
            facility_id=data.facility_id,
            user_id=user.id,
            user_name=user.name,
            report_type=data.report_type,
            description=data.description,
            image_url=data.image_url,
            status="PENDING",
            created_at=datetime.datetime.utcnow()
        )
        db.add(report)

        # Update facility metadata
        fac.last_reported_at = datetime.datetime.utcnow()
        fac.verification_status = "RECENTLY_REPORTED"

        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def get_reports(
        db: Session,
        facility_id: Optional[int] = None,
        user_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[dict]:
        query = db.query(FacilityReport).join(Facility, FacilityReport.facility_id == Facility.id)

        if facility_id:
            query = query.filter(FacilityReport.facility_id == facility_id)
        if user_id:
            query = query.filter(FacilityReport.user_id == user_id)
        if status and status.upper() != "ALL":
            query = query.filter(FacilityReport.status == status.upper())

        reports = query.order_by(FacilityReport.created_at.desc()).all()

        results = []
        for r in reports:
            results.append({
                "id": r.id,
                "facility_id": r.facility_id,
                "facility_name": r.facility.name if r.facility else "Unknown Facility",
                "user_id": r.user_id,
                "user_name": r.user_name,
                "report_type": r.report_type,
                "description": r.description,
                "image_url": r.image_url,
                "status": r.status,
                "created_at": r.created_at,
                "review_notes": r.review_notes
            })
        return results

    @staticmethod
    def get_report_by_id(db: Session, report_id: int) -> Optional[dict]:
        r = db.query(FacilityReport).filter(FacilityReport.id == report_id).first()
        if not r:
            return None
        return {
            "id": r.id,
            "facility_id": r.facility_id,
            "facility_name": r.facility.name if r.facility else "Unknown Facility",
            "user_id": r.user_id,
            "user_name": r.user_name,
            "report_type": r.report_type,
            "description": r.description,
            "image_url": r.image_url,
            "status": r.status,
            "created_at": r.created_at,
            "review_notes": r.review_notes
        }

    @staticmethod
    def moderate_report(
        db: Session,
        report_id: int,
        mod: ReportModeration,
        admin_user: User
    ) -> FacilityReport:
        report = db.query(FacilityReport).filter(FacilityReport.id == report_id).first()
        if not report:
            raise ValueError("Report not found")

        report.status = mod.status
        report.reviewed_by_id = admin_user.id
        report.review_notes = mod.review_notes

        # If approved, apply status changes to facility if relevant
        if mod.status == "APPROVED" and report.facility:
            fac = report.facility
            if report.report_type in ["CLOSED", "UNAVAILABLE"]:
                fac.is_open = False
            elif report.report_type == "OPEN":
                fac.is_open = True
            elif report.report_type == "WATER_UNAVAILABLE":
                fac.has_water = False
            elif report.report_type == "CHARGER_BROKEN":
                fac.has_charging = False
            fac.last_reported_at = datetime.datetime.utcnow()

        db.commit()
        db.refresh(report)
        return report

    @staticmethod
    def delete_report(db: Session, report_id: int, user: User) -> bool:
        report = db.query(FacilityReport).filter(FacilityReport.id == report_id).first()
        if not report:
            return False
        # Only admin or the report creator can delete
        if user.role != "admin" and report.user_id != user.id:
            raise PermissionError("Not authorized to delete this report")

        db.delete(report)
        db.commit()
        return True

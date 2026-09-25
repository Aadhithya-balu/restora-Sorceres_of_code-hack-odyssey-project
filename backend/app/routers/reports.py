from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas import FacilityReportCreate, FacilityReportSchema, ReportModeration
from ..services.report_service import ReportService
from ..auth import get_current_user, require_admin
from ..models import User

router = APIRouter(prefix="/api/reports", tags=["Crowdsourced Reports"])

@router.get("", response_model=List[FacilityReportSchema])
def get_reports(
    facility_id: Optional[int] = Query(None),
    user_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return ReportService.get_reports(db, facility_id=facility_id, user_id=user_id, status=status)

@router.get("/{report_id}", response_model=FacilityReportSchema)
def get_report(report_id: int, db: Session = Depends(get_db)):
    r = ReportService.get_report_by_id(db, report_id)
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    return r

@router.post("", response_model=FacilityReportSchema, status_code=status.HTTP_201_CREATED)
def create_report(
    data: FacilityReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        rep = ReportService.create_report(db, data, current_user)
        return ReportService.get_report_by_id(db, rep.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{report_id}/moderate", response_model=FacilityReportSchema)
def moderate_report(
    report_id: int,
    mod: ReportModeration,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    try:
        ReportService.moderate_report(db, report_id, mod, admin)
        return ReportService.get_report_by_id(db, report_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/{report_id}")
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        deleted = ReportService.delete_report(db, report_id, current_user)
        if not deleted:
            raise HTTPException(status_code=404, detail="Report not found")
        return {"success": True, "message": "Report deleted"}
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

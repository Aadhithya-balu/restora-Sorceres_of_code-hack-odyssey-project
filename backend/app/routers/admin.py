from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import AdminOverviewResponse
from ..services.admin_service import AdminService
from ..auth import require_admin
from ..models import User

router = APIRouter(prefix="/api/admin", tags=["Admin Management"])

@router.get("/overview", response_model=AdminOverviewResponse)
def get_admin_overview(
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return AdminService.get_overview_stats(db)

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas import SupportResourceSchema, SupportResourceCreate, PartnerOfferSchema, PartnerOfferCreate
from ..services.support_service import SupportService
from ..auth import require_admin
from ..models import User

router = APIRouter(prefix="/api", tags=["Support & Partner Offers"])

@router.get("/support-resources", response_model=List[SupportResourceSchema])
def get_support_resources(
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return SupportService.get_support_resources(db, category=category)

@router.post("/support-resources", response_model=SupportResourceSchema, status_code=status.HTTP_201_CREATED)
def create_support_resource(
    data: SupportResourceCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return SupportService.create_support_resource(db, data)

@router.delete("/support-resources/{resource_id}")
def delete_support_resource(
    resource_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    deleted = SupportService.delete_support_resource(db, resource_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {"success": True, "message": "Resource deleted"}

@router.get("/partner-offers", response_model=List[PartnerOfferSchema])
def get_partner_offers(db: Session = Depends(get_db)):
    return SupportService.get_partner_offers(db)

@router.post("/partner-offers", response_model=PartnerOfferSchema, status_code=status.HTTP_201_CREATED)
def create_partner_offer(
    data: PartnerOfferCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    return SupportService.create_partner_offer(db, data)

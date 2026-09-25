from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas import FacilitySchema, FacilityCreate, FacilityUpdate, VerificationCreate
from ..services.facility_service import FacilityService
from ..auth import get_current_user, get_current_user_optional, require_admin
from ..models import User

router = APIRouter(prefix="/api/facilities", tags=["Facilities"])

@router.get("", response_model=List[FacilitySchema])
def get_facilities(
    lat: float = Query(11.0267),
    lng: float = Query(77.0118),
    category: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    access_type: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    uid = current_user.id if current_user else None
    return FacilityService.get_facilities(
        db, lat=lat, lng=lng, category=category,
        service_filter=service, access_type=access_type,
        search_query=q, current_user_id=uid
    )

@router.get("/{facility_id}", response_model=FacilitySchema)
def get_facility(
    facility_id: int,
    lat: float = Query(11.0267),
    lng: float = Query(77.0118),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    uid = current_user.id if current_user else None
    fac = FacilityService.get_facility_by_id(db, facility_id, lat=lat, lng=lng, current_user_id=uid)
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")
    return fac

@router.post("", response_model=FacilitySchema, status_code=status.HTTP_201_CREATED)
def create_facility(
    data: FacilityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fac = FacilityService.create_facility(db, data, user_id=current_user.id)
    fac_dict = FacilityService.get_facility_by_id(db, fac.id, current_user_id=current_user.id)
    return fac_dict

@router.patch("/{facility_id}", response_model=FacilitySchema)
def update_facility(
    facility_id: int,
    data: FacilityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    fac = FacilityService.update_facility(db, facility_id, data)
    if not fac:
        raise HTTPException(status_code=404, detail="Facility not found")
    return FacilityService.get_facility_by_id(db, facility_id, current_user_id=current_user.id)

@router.delete("/{facility_id}")
def delete_facility(
    facility_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    deleted = FacilityService.delete_facility(db, facility_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Facility not found")
    return {"success": True, "message": "Facility deleted successfully"}

@router.post("/verify")
def verify_facility(
    data: VerificationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return FacilityService.verify_facility(db, data, user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

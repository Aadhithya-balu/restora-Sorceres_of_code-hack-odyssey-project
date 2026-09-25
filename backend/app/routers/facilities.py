from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas import FacilitySchema, FacilityCreate, FacilityUpdate, VerificationCreate, AdaptiveSearchResponse
from ..services.facility_service import FacilityService
from ..auth import get_current_user, get_current_user_optional, require_admin
from ..models import User

router = APIRouter(prefix="/api/facilities", tags=["Facilities"])

@router.get("/nearby", response_model=AdaptiveSearchResponse)
def get_nearby_facilities(
    lat: float = Query(11.0267),
    lng: float = Query(77.0118),
    category: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    access_type: Optional[str] = Query(None),
    initialRadius: int = Query(5),
    step: int = Query(1),
    minResults: int = Query(5),
    maxRadius: int = Query(20),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    uid = current_user.id if current_user else None
    return FacilityService.get_adaptive_facilities(
        db, lat=lat, lng=lng, category=category,
        service_filter=service, access_type=access_type,
        initial_radius_km=initialRadius, step_km=step,
        min_results=minResults, max_radius_km=maxRadius,
        current_user_id=uid
    )

@router.get("", response_model=List[FacilitySchema])
def get_facilities(
    lat: float = Query(11.0267),
    lng: float = Query(77.0118),
    category: Optional[str] = Query(None),
    service: Optional[str] = Query(None),
    access_type: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    max_distance_meters: Optional[int] = Query(None),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    uid = current_user.id if current_user else None
    return FacilityService.get_facilities(
        db, lat=lat, lng=lng, category=category,
        service_filter=service, access_type=access_type,
        search_query=q, max_distance_meters=max_distance_meters, current_user_id=uid
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

from pydantic import BaseModel

class DemoSeedRequest(BaseModel):
    lat: float = 11.0267
    lng: float = 77.0118
    city: Optional[str] = "Demo City"

@router.post("/seed-demo")
def seed_demo_facilities(
    data: DemoSeedRequest,
    db: Session = Depends(get_db)
):
    from sqlalchemy import text
    from ..models import Facility

    # Align sequence to prevent key collisions
    try:
        db.execute(text("SELECT setval('facilities_id_seq', (SELECT COALESCE(MAX(id), 1) FROM facilities));"))
        db.commit()
    except Exception:
        db.rollback()

    demo_templates = [
        {
            "name": "Restora Community Rest Pavilion & Hydration Point",
            "category": "REST_POINT",
            "address": "Near Main Road Transit Junction",
            "d_lat": 0.0025,
            "d_lng": 0.0018,
            "has_rest": True,
            "has_washroom": True,
            "has_water": True,
            "has_charging": True,
            "has_shade": True,
            "has_parking": True,
            "has_food": False,
            "has_medical": True,
            "operating_hours": "06:00 - 23:00",
            "notes": "Community verified shelter with cool drinking water and multi-pin smartphone chargers."
        },
        {
            "name": "City Petroleum 24/7 Rest Stop & RO Water Bay",
            "category": "WATER",
            "address": "Fuel Station Forecourt, Service Corridor",
            "d_lat": -0.0020,
            "d_lng": 0.0030,
            "has_rest": False,
            "has_washroom": True,
            "has_water": True,
            "has_charging": False,
            "has_shade": True,
            "has_parking": True,
            "has_food": True,
            "has_medical": False,
            "operating_hours": "24 Hours Open",
            "notes": "24-hour clean washrooms and commercial RO water dispenser accessible to two-wheelers."
        },
        {
            "name": "EV Rider Mobility Hub & Smartphone Fast-Charge Dock",
            "category": "CHARGING",
            "address": "Commercial Arcade, Ground Floor Bay 2",
            "d_lat": 0.0040,
            "d_lng": -0.0025,
            "has_rest": True,
            "has_washroom": False,
            "has_water": True,
            "has_charging": True,
            "has_shade": True,
            "has_parking": True,
            "has_food": False,
            "has_medical": False,
            "operating_hours": "07:00 - 22:30",
            "notes": "High-speed charging dock for gig workers with sheltered seating benches."
        },
        {
            "name": "Civic Transit Concourse Shaded Respite Point",
            "category": "SHADED_AREA",
            "address": "Metro / Bus Concourse Underpass Shelter",
            "d_lat": -0.0035,
            "d_lng": -0.0030,
            "has_rest": True,
            "has_washroom": True,
            "has_water": True,
            "has_charging": False,
            "has_shade": True,
            "has_parking": False,
            "has_food": False,
            "has_medical": True,
            "operating_hours": "05:30 - 23:30",
            "notes": "Large shaded civic pavilion with clean seating and emergency first-aid station."
        },
        {
            "name": "Worker Well-Being Rest Stop & Clean Restrooms",
            "category": "WASHROOM",
            "address": "Municipal Public Utility Complex",
            "d_lat": 0.0055,
            "d_lng": 0.0040,
            "has_rest": True,
            "has_washroom": True,
            "has_water": True,
            "has_charging": True,
            "has_shade": True,
            "has_parking": True,
            "has_food": False,
            "has_medical": False,
            "operating_hours": "06:00 - 22:00",
            "notes": "Municipal sanitation rest facility specifically designated for gig and logistics delivery personnel."
        }
    ]

    for t in demo_templates:
        f = Facility(
            name=t["name"],
            category=t["category"],
            address=t["address"],
            zone="Jury Demo Zone",
            city=data.city or "Demo City",
            lat=round(data.lat + t["d_lat"], 6),
            lng=round(data.lng + t["d_lng"], 6),
            is_open=True,
            operating_hours=t["operating_hours"],
            access_type="PUBLIC",
            pricing_info="Free to use",
            accessibility_info="Ground level, 2W accessible",
            has_rest=t["has_rest"],
            has_washroom=t["has_washroom"],
            has_water=t["has_water"],
            has_charging=t["has_charging"],
            has_shade=t["has_shade"],
            has_parking=t["has_parking"],
            has_food=t["has_food"],
            has_medical=t["has_medical"],
            verification_status="VERIFIED",
            verification_count=5,
            notes=t["notes"]
        )
        db.add(f)

    db.commit()
    return {
        "success": True,
        "message": f"Successfully created 5 demo rest hubs around coordinates ({data.lat:.4f}, {data.lng:.4f})!",
        "count": 5
    }


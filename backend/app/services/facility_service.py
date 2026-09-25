import math
import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models import Facility, FacilityVerification, Bookmark, User
from ..schemas import FacilityCreate, FacilityUpdate, VerificationCreate

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> int:
    """Calculate distance in meters between two coordinates"""
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return int(R * c)

class FacilityService:
    @staticmethod
    def get_facilities(
        db: Session,
        lat: float = 11.0267,
        lng: float = 77.0118,
        category: Optional[str] = None,
        service_filter: Optional[str] = None,
        access_type: Optional[str] = None,
        search_query: Optional[str] = None,
        max_distance_meters: Optional[int] = None,
        current_user_id: Optional[int] = None
    ) -> List[dict]:
        query = db.query(Facility)

        if category and category.upper() != "ALL":
            cats = [c.strip().upper() for c in category.split(",") if c.strip().upper() != "ALL"]
            db_cats = []
            for c in cats:
                if c == "WASHROOM":
                    query = query.filter(Facility.has_washroom == True)
                elif c == "WATER":
                    query = query.filter(Facility.has_water == True)
                elif c in ["REST", "REST_POINT"]:
                    query = query.filter(Facility.has_rest == True)
                elif c in ["CHARGE", "CHARGING"]:
                    query = query.filter(Facility.has_charging == True)
                elif c == "FOOD":
                    query = query.filter(Facility.has_food == True)
                else:
                    db_cats.append(c)
            if db_cats:
                query = query.filter(Facility.category.in_(db_cats))

        if access_type and access_type.upper() != "ALL":
            query = query.filter(Facility.access_type == access_type.upper())

        if service_filter:
            services = [s.strip().upper() for s in service_filter.split(",")]
            for sf in services:
                if sf == "ALL":
                    continue
                elif sf == "REST":
                    query = query.filter(Facility.has_rest == True)
                elif sf == "WASHROOM":
                    query = query.filter(Facility.has_washroom == True)
                elif sf == "WATER":
                    query = query.filter(Facility.has_water == True)
                elif sf in ["CHARGE", "CHARGING"]:
                    query = query.filter(Facility.has_charging == True)
                elif sf == "SHADE":
                    query = query.filter(Facility.has_shade == True)
                elif sf in ["PARK", "PARKING"]:
                    query = query.filter(Facility.has_parking == True)
                elif sf == "FOOD":
                    query = query.filter(Facility.has_food == True)
                elif sf == "MEDICAL":
                    query = query.filter(Facility.has_medical == True)

        facilities = query.all()

        bookmarked_ids = set()
        if current_user_id:
            bookmarks = db.query(Bookmark.facility_id).filter(Bookmark.user_id == current_user_id).all()
            bookmarked_ids = {b[0] for b in bookmarks}

        results = []
        for fac in facilities:
            dist = haversine_distance(lat, lng, fac.lat, fac.lng)

            if search_query:
                sq = search_query.lower()
                matches = (
                    sq in fac.name.lower() or
                    sq in fac.address.lower() or
                    sq in fac.zone.lower() or
                    (fac.notes and sq in fac.notes.lower()) or
                    (fac.pricing_info and sq in fac.pricing_info.lower())
                )
                if not matches:
                    continue

            if max_distance_meters is not None and dist > max_distance_meters:
                continue

            results.append({
                "id": fac.id,
                "name": fac.name,
                "category": fac.category,
                "address": fac.address,
                "zone": fac.zone,
                "city": fac.city,
                "lat": fac.lat,
                "lng": fac.lng,
                "distance_meters": dist,
                "is_open": fac.is_open,
                "operating_hours": fac.operating_hours,
                "access_type": fac.access_type,
                "pricing_info": fac.pricing_info,
                "accessibility_info": fac.accessibility_info,
                "has_rest": fac.has_rest,
                "has_washroom": fac.has_washroom,
                "has_water": fac.has_water,
                "has_charging": fac.has_charging,
                "has_shade": fac.has_shade,
                "has_parking": fac.has_parking,
                "has_food": fac.has_food,
                "has_medical": fac.has_medical,
                "verification_status": fac.verification_status,
                "verification_count": fac.verification_count,
                "last_reported_at": fac.last_reported_at,
                "notes": fac.notes,
                "created_at": fac.created_at,
                "is_bookmarked": fac.id in bookmarked_ids
            })

        results.sort(key=lambda x: x["distance_meters"])
        return results

    @staticmethod
    def get_adaptive_facilities(
        db: Session,
        lat: float,
        lng: float,
        category: Optional[str] = None,
        service_filter: Optional[str] = None,
        access_type: Optional[str] = None,
        initial_radius_km: int = 5,
        step_km: int = 1,
        min_results: int = 5,
        max_radius_km: int = 20,
        current_user_id: Optional[int] = None
    ) -> dict:
        current_radius = initial_radius_km
        expanded = False
        final_facilities = []
        
        while current_radius <= max_radius_km:
            results = FacilityService.get_facilities(
                db, lat=lat, lng=lng, category=category,
                service_filter=service_filter, access_type=access_type,
                max_distance_meters=current_radius * 1000,
                current_user_id=current_user_id
            )
            
            if len(results) >= min_results:
                final_facilities = results[:min_results]
                expanded = (current_radius > initial_radius_km)
                msg = f"{len(final_facilities)} facilities found within {current_radius} km"
                if len(results) == 0 and current_radius == initial_radius_km:
                    msg = f"No suitable facilities found within {current_radius} km."
                
                return {
                    "facilities": final_facilities,
                    "searchRadiusKm": current_radius,
                    "expanded": expanded,
                    "message": msg
                }
            
            # Not enough results, expand radius
            current_radius += step_km
            
        # Reached max radius
        results = FacilityService.get_facilities(
            db, lat=lat, lng=lng, category=category,
            service_filter=service_filter, access_type=access_type,
            max_distance_meters=max_radius_km * 1000,
            current_user_id=current_user_id
        )
        final_facilities = results[:min_results]
        
        if len(final_facilities) > 0:
            msg = f"{len(final_facilities)} facilities found within {max_radius_km} km"
        else:
            msg = f"No suitable facilities found within {max_radius_km} km."
            
        return {
            "facilities": final_facilities,
            "searchRadiusKm": max_radius_km,
            "expanded": True,
            "message": msg
        }

    @staticmethod
    def get_facility_by_id(
        db: Session,
        facility_id: int,
        lat: float = 11.0267,
        lng: float = 77.0118,
        current_user_id: Optional[int] = None
    ) -> Optional[dict]:
        fac = db.query(Facility).filter(Facility.id == facility_id).first()
        if not fac:
            return None

        dist = haversine_distance(lat, lng, fac.lat, fac.lng)
        is_bm = False
        if current_user_id:
            is_bm = db.query(Bookmark).filter(Bookmark.facility_id == fac.id, Bookmark.user_id == current_user_id).first() is not None

        return {
            "id": fac.id,
            "name": fac.name,
            "category": fac.category,
            "address": fac.address,
            "zone": fac.zone,
            "city": fac.city,
            "lat": fac.lat,
            "lng": fac.lng,
            "distance_meters": dist,
            "is_open": fac.is_open,
            "operating_hours": fac.operating_hours,
            "access_type": fac.access_type,
            "pricing_info": fac.pricing_info,
            "accessibility_info": fac.accessibility_info,
            "has_rest": fac.has_rest,
            "has_washroom": fac.has_washroom,
            "has_water": fac.has_water,
            "has_charging": fac.has_charging,
            "has_shade": fac.has_shade,
            "has_parking": fac.has_parking,
            "has_food": fac.has_food,
            "has_medical": fac.has_medical,
            "verification_status": fac.verification_status,
            "verification_count": fac.verification_count,
            "last_reported_at": fac.last_reported_at,
            "notes": fac.notes,
            "created_at": fac.created_at,
            "is_bookmarked": is_bm
        }

    @staticmethod
    def create_facility(db: Session, data: FacilityCreate, user_id: Optional[int] = None) -> Facility:
        fac = Facility(
            name=data.name,
            category=data.category,
            address=data.address,
            zone=data.zone,
            city=data.city,
            lat=data.lat,
            lng=data.lng,
            is_open=data.is_open,
            operating_hours=data.operating_hours,
            access_type=data.access_type,
            pricing_info=data.pricing_info,
            accessibility_info=data.accessibility_info,
            has_rest=data.has_rest,
            has_washroom=data.has_washroom,
            has_water=data.has_water,
            has_charging=data.has_charging,
            has_shade=data.has_shade,
            has_parking=data.has_parking,
            has_food=data.has_food,
            has_medical=data.has_medical,
            verification_status="RECENTLY_REPORTED",
            verification_count=1,
            last_reported_at=datetime.datetime.utcnow(),
            notes=data.notes,
            created_by_id=user_id,
            created_at=datetime.datetime.utcnow()
        )
        db.add(fac)
        db.commit()
        db.refresh(fac)
        return fac

    @staticmethod
    def update_facility(db: Session, facility_id: int, data: FacilityUpdate) -> Optional[Facility]:
        fac = db.query(Facility).filter(Facility.id == facility_id).first()
        if not fac:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(fac, key, val)

        fac.last_reported_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(fac)
        return fac

    @staticmethod
    def delete_facility(db: Session, facility_id: int) -> bool:
        fac = db.query(Facility).filter(Facility.id == facility_id).first()
        if not fac:
            return False
        db.delete(fac)
        db.commit()
        return True

    @staticmethod
    def verify_facility(db: Session, data: VerificationCreate, user_id: int) -> dict:
        fac = db.query(Facility).filter(Facility.id == data.facility_id).first()
        if not fac:
            raise ValueError("Facility not found")

        verif = FacilityVerification(
            facility_id=data.facility_id,
            user_id=user_id,
            washroom_ok=data.washroom_ok,
            water_ok=data.water_ok,
            charging_ok=data.charging_ok,
            rest_ok=data.rest_ok,
            notes=data.notes,
            created_at=datetime.datetime.utcnow()
        )
        db.add(verif)

        fac.verification_count += 1
        fac.verification_status = "VERIFIED"
        fac.last_reported_at = datetime.datetime.utcnow()
        db.commit()

        return {
            "success": True,
            "facility_id": fac.id,
            "verification_status": fac.verification_status,
            "verification_count": fac.verification_count,
            "message": "Verification submitted successfully."
        }

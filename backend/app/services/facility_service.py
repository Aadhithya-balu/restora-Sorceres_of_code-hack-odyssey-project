import math
import json
import datetime
from typing import List, Optional
from sqlalchemy.orm import Session
from ..models import Facility, FacilityVerification, FacilityReport, Bookmark, User
from ..schemas import FacilityCreate, FacilityUpdate, VerificationCreate, ReviewCreate

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
        is_24_7_filter: Optional[bool] = None,
        open_now_filter: Optional[bool] = None,
        status_filter: Optional[str] = None,
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
                elif c in ["REST", "REST_POINT", "SHADE_REST"]:
                    query = query.filter((Facility.has_rest == True) | (Facility.has_shade == True))
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

        if status_filter and status_filter.upper() != "ALL":
            query = query.filter(Facility.verification_status == status_filter.upper())

        if open_now_filter:
            query = query.filter(Facility.is_open == True)

        if service_filter:
            services = [s.strip().upper() for s in service_filter.split(",")]
            for sf in services:
                if sf == "ALL":
                    continue
                elif sf in ["REST", "SHADE_REST"]:
                    query = query.filter((Facility.has_rest == True) | (Facility.has_shade == True))
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
            is_24 = "24" in (fac.operating_hours or "").lower()

            if is_24_7_filter and not is_24:
                continue

            if search_query:
                sq = search_query.lower().strip()
                matches = (
                    sq in fac.name.lower() or
                    sq in fac.address.lower() or
                    sq in fac.zone.lower() or
                    (fac.notes and sq in fac.notes.lower()) or
                    (fac.pricing_info and sq in fac.pricing_info.lower()) or
                    ("washroom" in sq and fac.has_washroom) or
                    ("toilet" in sq and fac.has_washroom) or
                    ("restroom" in sq and fac.has_washroom) or
                    ("water" in sq and fac.has_water) or
                    ("drink" in sq and fac.has_water) or
                    ("hydrate" in sq and fac.has_water) or
                    ("rest" in sq and (fac.has_rest or fac.has_shade)) or
                    ("shade" in sq and fac.has_shade) or
                    ("charge" in sq and fac.has_charging) or
                    ("battery" in sq and fac.has_charging) or
                    ("food" in sq and fac.has_food) or
                    ("eat" in sq and fac.has_food) or
                    ("tea" in sq and fac.has_food) or
                    ("park" in sq and fac.has_parking) or
                    ("medical" in sq and fac.has_medical)
                )
                if not matches:
                    continue

            if max_distance_meters is not None and dist > max_distance_meters:
                continue

            # Deterministic rating and review count
            rating = round(min(5.0, max(4.2, 4.4 + ((fac.id * 3) % 7) * 0.1)), 1)
            review_count = max(1, fac.verification_count * 2 + (fac.id % 5))

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
                "is_24_7": is_24,
                "rating": rating,
                "review_count": review_count,
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

        is_24 = "24" in (fac.operating_hours or "").lower()
        rating = round(min(5.0, max(4.2, 4.4 + ((fac.id * 3) % 7) * 0.1)), 1)
        review_count = max(1, fac.verification_count * 2 + (fac.id % 5))

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
            "is_24_7": is_24,
            "rating": rating,
            "review_count": review_count,
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
        verif_status = data.verification_status or "PENDING"
        verif_count = 1 if verif_status.upper() == "VERIFIED" else 0
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
            verification_status=verif_status,
            verification_count=verif_count,
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
    def approve_facility(db: Session, facility_id: int) -> Optional[Facility]:
        fac = db.query(Facility).filter(Facility.id == facility_id).first()
        if not fac:
            return None
        fac.verification_status = "VERIFIED"
        fac.verification_count = max(fac.verification_count, 1)
        fac.last_reported_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(fac)
        return fac

    @staticmethod
    def reject_facility(db: Session, facility_id: int) -> Optional[Facility]:
        fac = db.query(Facility).filter(Facility.id == facility_id).first()
        if not fac:
            return None
        fac.verification_status = "REJECTED"
        fac.last_reported_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(fac)
        return fac

    @staticmethod
    def get_pending_facilities(db: Session) -> List[dict]:
        facs = db.query(Facility).filter(Facility.verification_status == "PENDING").order_by(Facility.created_at.desc()).all()
        return [FacilityService.get_facility_by_id(db, f.id) for f in facs]

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
            "message": "Verification submitted successfully. You earned +5 points!"
        }

    @staticmethod
    def create_review(db: Session, facility_id: int, data: ReviewCreate, user_id: int, user_name: str) -> dict:
        fac = db.query(Facility).filter(Facility.id == facility_id).first()
        if not fac:
            raise ValueError("Facility not found")

        meta = {
            "rating": data.rating,
            "cleanliness": data.cleanliness or 5.0,
            "accessibility": data.accessibility or 5.0,
            "safety": data.safety or 5.0,
        }
        rep = FacilityReport(
            facility_id=facility_id,
            user_id=user_id,
            user_name=user_name,
            report_type="WORKER_REVIEW",
            description=data.comment or "Worker review",
            review_notes=json.dumps(meta),
            status="APPROVED",
            created_at=datetime.datetime.utcnow()
        )
        db.add(rep)
        fac.verification_count += 1
        fac.last_reported_at = datetime.datetime.utcnow()
        db.commit()
        db.refresh(rep)

        return {
            "id": rep.id,
            "facility_id": rep.facility_id,
            "user_name": rep.user_name,
            "rating": data.rating,
            "cleanliness": meta["cleanliness"],
            "accessibility": meta["accessibility"],
            "safety": meta["safety"],
            "comment": rep.description,
            "created_at": rep.created_at
        }

    @staticmethod
    def get_reviews(db: Session, facility_id: int) -> List[dict]:
        reports = db.query(FacilityReport).filter(
            FacilityReport.facility_id == facility_id,
            FacilityReport.report_type == "WORKER_REVIEW"
        ).order_by(FacilityReport.created_at.desc()).all()

        reviews = []
        for r in reports:
            rating = 5.0
            cleanliness = 5.0
            accessibility = 5.0
            safety = 5.0
            if r.review_notes:
                try:
                    p = json.loads(r.review_notes)
                    rating = float(p.get("rating", 5.0))
                    cleanliness = float(p.get("cleanliness", 5.0))
                    accessibility = float(p.get("accessibility", 5.0))
                    safety = float(p.get("safety", 5.0))
                except Exception:
                    pass
            reviews.append({
                "id": r.id,
                "facility_id": r.facility_id,
                "user_name": r.user_name,
                "rating": rating,
                "cleanliness": cleanliness,
                "accessibility": accessibility,
                "safety": safety,
                "comment": r.description,
                "created_at": r.created_at
            })
        return reviews

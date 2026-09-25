import math
from typing import List
from sqlalchemy.orm import Session
from ..models import Facility
from ..schemas import RoutePlanRequest, RoutePlanResponse, RouteFacilityMatch
from .facility_service import FacilityService, haversine_distance

class RouteService:
    @staticmethod
    def plan_route_rest_points(db: Session, req: RoutePlanRequest, user_id: int = 1) -> RoutePlanResponse:
        # Calculate total straight line route distance
        total_dist_meters = haversine_distance(
            req.origin_lat, req.origin_lng,
            req.destination_lat, req.destination_lng
        )
        total_km = round(total_dist_meters / 1000.0, 2)
        # Estimated driving time at city average 25 km/h for 2W
        est_minutes = max(5, int((total_km / 25.0) * 60))

        facilities = db.query(Facility).all()
        matched_facilities = []

        # Vector mathematics for distance from point to line segment
        # Segment from O (origin) to D (destination)
        x1, y1 = req.origin_lng, req.origin_lat
        x2, y2 = req.destination_lng, req.destination_lat
        dx = x2 - x1
        dy = y2 - y1
        line_len_sq = dx*dx + dy*dy

        for fac in facilities:
            # Check service filter if specified
            matched_services = []
            if req.required_services:
                for req_svc in req.required_services:
                    s = req_svc.lower()
                    if "water" in s and fac.has_water: matched_services.append("Drinking Water")
                    elif ("washroom" in s or "toilet" in s or "wc" in s) and fac.has_washroom: matched_services.append("Sanitized Washroom")
                    elif "charg" in s and fac.has_charging: matched_services.append("Fast Charging")
                    elif ("rest" in s or "seat" in s) and fac.has_rest: matched_services.append("Rest Seating")
                    elif "shade" in s and fac.has_shade: matched_services.append("Shade Area")
                    elif "food" in s and fac.has_food: matched_services.append("Meals")
                    elif "med" in s and fac.has_medical: matched_services.append("First-Aid")
                
                # If requested services are not matched, skip
                if not matched_services:
                    continue
            else:
                if fac.has_water: matched_services.append("Water")
                if fac.has_washroom: matched_services.append("Washroom")
                if fac.has_rest: matched_services.append("Rest")
                if fac.has_charging: matched_services.append("Charging")

            # Project facility point onto line segment
            px, py = fac.lng, fac.lat
            if line_len_sq == 0:
                t = 0.0
            else:
                t = max(0.0, min(1.0, ((px - x1) * dx + (py - y1) * dy) / line_len_sq))

            closest_lng = x1 + t * dx
            closest_lat = y1 + t * dy

            # Detour distance from route corridor to facility
            detour_meters = haversine_distance(closest_lat, closest_lng, fac.lat, fac.lng)
            detour_km = round(detour_meters / 1000.0, 2)

            if detour_km <= req.max_detour_km:
                straight_line_dist = round(haversine_distance(req.origin_lat, req.origin_lng, fac.lat, fac.lng) / 1000.0, 2)
                
                fac_dict = FacilityService.get_facility_by_id(db, fac.id, req.origin_lat, req.origin_lng, user_id)
                if fac_dict:
                    reason = f"Adds only ~{int(detour_meters)}m detour off corridor with {', '.join(matched_services[:3])}."
                    matched_facilities.append(RouteFacilityMatch(
                        facility=fac_dict,
                        straight_line_dist_km=straight_line_dist,
                        estimated_corridor_detour_km=detour_km,
                        matched_services=matched_services,
                        stop_recommendation_reason=reason
                    ))

        # Sort by detour distance
        matched_facilities.sort(key=lambda x: x.estimated_corridor_detour_km)

        return RoutePlanResponse(
            origin=req.origin_name,
            destination=req.destination_name,
            total_route_distance_km=total_km,
            estimated_travel_time_minutes=est_minutes,
            nearby_facilities_count=len(matched_facilities),
            facilities=matched_facilities,
            disclaimer="Detours are corridor approximations based on GPS coordinates. Actual navigation detour times may vary depending on one-way streets, traffic, and traffic signals."
        )

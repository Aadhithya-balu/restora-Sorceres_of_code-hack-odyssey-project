from typing import List
from sqlalchemy.orm import Session
from ..models import Facility, User
from ..schemas import RecommendationRequest, RecommendationResponse, RecommendationResult
from .facility_service import FacilityService, haversine_distance

class RecommendationService:
    @staticmethod
    def get_recommendations(
        db: Session,
        req: RecommendationRequest,
        user_id: int = 1
    ) -> RecommendationResponse:
        facilities = db.query(Facility).all()
        scored_results = []

        # Count requested features
        requested_features = []
        if req.need_water: requested_features.append("Water")
        if req.need_washroom: requested_features.append("Washroom")
        if req.need_charging: requested_features.append("Phone/EV Charging")
        if req.need_rest: requested_features.append("Rest Seating")
        if req.need_shade: requested_features.append("Shaded Area")
        if req.need_food: requested_features.append("Food")
        if req.need_medical: requested_features.append("First-Aid")

        total_req_count = len(requested_features)

        for fac in facilities:
            dist = haversine_distance(req.lat, req.lng, fac.lat, fac.lng)
            if dist > req.max_distance_meters:
                continue

            # 1. Proximity score (0 to 40)
            # 0m -> 40pts, max_distance -> 0pts
            proximity_score = max(0.0, 40.0 * (1.0 - (dist / req.max_distance_meters)))

            # 2. Amenity match score (0 to 35)
            matched_amenities = []
            if req.need_water and fac.has_water: matched_amenities.append("Water")
            if req.need_washroom and fac.has_washroom: matched_amenities.append("Washroom")
            if req.need_charging and fac.has_charging: matched_amenities.append("Charging")
            if req.need_rest and fac.has_rest: matched_amenities.append("Rest")
            if req.need_shade and fac.has_shade: matched_amenities.append("Shade")
            if req.need_food and fac.has_food: matched_amenities.append("Food")
            if req.need_medical and fac.has_medical: matched_amenities.append("First-Aid")

            if total_req_count > 0:
                match_ratio = len(matched_amenities) / total_req_count
                amenity_score = match_ratio * 35.0
            else:
                # If no specific need selected, reward having multiple basic services
                available_count = sum([fac.has_water, fac.has_washroom, fac.has_rest, fac.has_charging])
                amenity_score = (available_count / 4.0) * 35.0

            # 3. Access & Open status score (0 to 15)
            status_score = 0.0
            if fac.is_open:
                status_score += 8.0
            if fac.access_type == "PUBLIC":
                status_score += 7.0
            elif fac.access_type == "PERMISSION_REQUIRED":
                status_score += 4.0

            # 4. Community verification recency score (0 to 10)
            recency_score = 0.0
            if fac.verification_status == "VERIFIED":
                recency_score += 10.0
            elif fac.verification_status == "RECENTLY_REPORTED":
                recency_score += 7.0
            else:
                recency_score += 3.0

            total_score = round(proximity_score + amenity_score + status_score + recency_score, 1)

            # Generate transparent explanation
            dist_desc = f"{dist}m away" if dist < 1000 else f"{(dist/1000):.1f}km away"
            if total_req_count > 0 and len(matched_amenities) > 0:
                matched_str = ", ".join(matched_amenities)
                explanation = (
                    f"Recommended ({total_score}/100) because it is {dist_desc}, "
                    f"matches your requested {matched_str}, and has {fac.verification_status.lower().replace('_', ' ')} status."
                )
            elif not fac.is_open:
                explanation = f"Nearby ({dist_desc}), but currently outside reported operating hours ({fac.operating_hours})."
            else:
                explanation = f"Recommended ({total_score}/100) for general rest support, situated {dist_desc} with {fac.access_type.lower()} access."

            facility_dict = FacilityService.get_facility_by_id(db, fac.id, req.lat, req.lng, user_id)
            if facility_dict:
                scored_results.append(RecommendationResult(
                    facility=facility_dict,
                    score=total_score,
                    explanation=explanation
                ))

        # Sort descending by score
        scored_results.sort(key=lambda x: x.score, reverse=True)

        return RecommendationResponse(
            total_found=len(scored_results),
            recommendations=scored_results[:6]
        )

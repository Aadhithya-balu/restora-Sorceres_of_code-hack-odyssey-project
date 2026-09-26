import os
import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from ..models import Facility
from ..schemas import (
    RestPointAIIntent, RestPointAIResponse,
    RakshitArthaAIResponse, FacilitySchema
)
from .facility_service import FacilityService, haversine_distance

load_dotenv()
logger = logging.getLogger(__name__)

# Valid Restora amenity categories
VALID_AMENITIES = {"water", "washroom", "charging", "rest", "shade", "food", "medical"}

class AIAgentService:
    @staticmethod
    def _get_groq_client_and_model():
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
        return api_key, model

    # =========================================================================
    # AGENT 1: RESTPOINT RECOMMENDATION AGENT
    # =========================================================================

    @staticmethod
    def _extract_intent_deterministic(query: str, default_distance_km: float = 5.0) -> RestPointAIIntent:
        """Deterministic keyword parser as a bulletproof fallback when Groq is unavailable."""
        q = query.lower()
        categories = []
        if any(w in q for w in ["water", "drink", "thirsty", "hydrate", "ro water", "bottle"]):
            categories.append("water")
        if any(w in q for w in ["washroom", "toilet", "bathroom", "restroom", "urinal", "clean"]):
            categories.append("washroom")
        if any(w in q for w in ["charge", "charging", "battery", "phone", "ev", "socket", "power"]):
            categories.append("charging")
        if any(w in q for w in ["rest", "sit", "sleep", "tired", "seat", "relax", "break", "couch"]):
            categories.append("rest")
        if any(w in q for w in ["shade", "tree", "covered", "sun", "hot", "heat", "roof"]):
            categories.append("shade")
        if any(w in q for w in ["food", "eat", "lunch", "dinner", "snack", "hungry", "chai", "tea"]):
            categories.append("food")
        if any(w in q for w in ["medical", "first-aid", "first aid", "bandage", "injury", "medicine"]):
            categories.append("medical")

        # Parse potential distance mentioned (e.g., "within 2 km", "1.5km")
        distance = default_distance_km
        import re
        dist_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:km|kms|kilometer|kilometre)', q)
        if dist_match:
            try:
                distance = min(20.0, max(0.5, float(dist_match.group(1))))
            except ValueError:
                pass

        # Parse duration (e.g., "15 minutes", "20 mins")
        dur_match = re.search(r'(\d+)\s*(?:min|mins|minute|minutes)', q)
        duration = int(dur_match.group(1)) if dur_match else None

        return RestPointAIIntent(
            facility_categories=categories,
            purpose="break_recovery" if categories else "general_rest",
            max_distance_km=distance,
            duration_minutes=duration,
            availability_required=True
        )

    @classmethod
    def _extract_intent_groq(cls, query: str, default_dist_km: float, api_key: str, model: str) -> Optional[RestPointAIIntent]:
        """Call Groq to extract structured intent with prompt-injection isolation."""
        system_prompt = (
            "You are the Restora Intent Classification Agent for gig workers. "
            "Extract structured search intent from the worker's inquiry. "
            "Output ONLY valid JSON matching this schema:\n"
            "{\n"
            '  "facility_categories": ["water", "washroom", "charging", "rest", "shade", "food", "medical"],\n'
            '  "purpose": "short_break",\n'
            '  "max_distance_km": 3.0,\n'
            '  "duration_minutes": 15,\n'
            '  "availability_required": true\n'
            "}\n"
            "Rule: 'facility_categories' MUST ONLY contain elements from: ['water', 'washroom', 'charging', 'rest', 'shade', 'food', 'medical']. "
            "If no category is specified, leave it empty. DO NOT output conversational text, markdown fences, or explanations."
        )

        # Isolated user message with boundary delimiter to prevent prompt injection
        user_message = f"<worker_inquiry>\n{query}\n</worker_inquiry>"

        try:
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
                "max_tokens": 250
            }
            with httpx.Client(timeout=8.0) as client:
                res = client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    content = data["choices"][0]["message"]["content"]
                    parsed = json.loads(content)
                    
                    # Validate and sanitize categories
                    raw_cats = parsed.get("facility_categories", [])
                    valid_cats = [c.lower() for c in raw_cats if isinstance(c, str) and c.lower() in VALID_AMENITIES]
                    
                    dist = float(parsed.get("max_distance_km") or default_dist_km)
                    dist = min(25.0, max(0.5, dist))

                    dur = parsed.get("duration_minutes")
                    dur_int = int(dur) if dur and isinstance(dur, (int, float)) else None

                    return RestPointAIIntent(
                        facility_categories=valid_cats,
                        purpose=str(parsed.get("purpose", "rest")),
                        max_distance_km=dist,
                        duration_minutes=dur_int,
                        availability_required=bool(parsed.get("availability_required", True))
                    )
        except Exception as e:
            logger.warning(f"[AI Agent] Groq intent extraction failed: {e}. Falling back to deterministic parser.")
        return None

    @classmethod
    def recommend_restpoint(
        cls,
        db: Session,
        query: str,
        lat: float,
        lng: float,
        max_distance_km: float = 5.0,
        user_id: int = 1
    ) -> RestPointAIResponse:
        api_key, model = cls._get_groq_client_and_model()

        # Step 1: Extract intent (Groq with deterministic fallback)
        intent = None
        used_groq = False
        if api_key:
            intent = cls._extract_intent_groq(query, max_distance_km, api_key, model)
            if intent:
                used_groq = True

        if not intent:
            intent = cls._extract_intent_deterministic(query, max_distance_km)

        # Step 2: Retrieve real facilities deterministically from database
        all_facilities = db.query(Facility).all()
        max_dist_meters = intent.max_distance_km * 1000

        scored_candidates = []
        for fac in all_facilities:
            dist = haversine_distance(lat, lng, fac.lat, fac.lng)
            if dist > max_dist_meters:
                continue

            # Amenity matching
            req_cats = intent.facility_categories
            matched_cats = []
            if "water" in req_cats and fac.has_water: matched_cats.append("Water")
            if "washroom" in req_cats and fac.has_washroom: matched_cats.append("Washroom")
            if "charging" in req_cats and fac.has_charging: matched_cats.append("Phone/EV Charging")
            if "rest" in req_cats and fac.has_rest: matched_cats.append("Rest Seating")
            if "shade" in req_cats and fac.has_shade: matched_cats.append("Shade")
            if "food" in req_cats and fac.has_food: matched_cats.append("Food")
            if "medical" in req_cats and fac.has_medical: matched_cats.append("First-Aid")

            match_count = len(matched_cats)
            total_req = len(req_cats)
            is_full_match = (match_count == total_req) if total_req > 0 else True

            # Deterministic scoring
            # 1. Proximity score (0-40)
            prox_score = max(0.0, 40.0 * (1.0 - (dist / max_dist_meters)))
            # 2. Amenity score (0-35)
            amenity_score = (match_count / max(1, total_req)) * 35.0 if total_req > 0 else 25.0
            # 3. Open & verified status (0-25)
            status_score = (10.0 if fac.is_open else 0.0) + (15.0 if fac.verification_status == "VERIFIED" else 7.0)
            total_score = round(prox_score + amenity_score + status_score, 1)

            fac_dict = FacilityService.get_facility_by_id(db, fac.id, lat, lng, user_id)
            if fac_dict:
                fac_schema = FacilitySchema.model_validate(fac_dict)
                scored_candidates.append({
                    "facility": fac_schema,
                    "score": total_score,
                    "is_full_match": is_full_match,
                    "matched_cats": matched_cats,
                    "distance_meters": dist
                })

        # Sort descending by score
        scored_candidates.sort(key=lambda x: x["score"], reverse=True)

        full_matches = [c["facility"] for c in scored_candidates if c["is_full_match"]]
        partial_matches = [c["facility"] for c in scored_candidates if not c["is_full_match"]]

        top_facilities = full_matches[:4]
        partial_alternatives = partial_matches[:3] if not top_facilities else []

        # Step 3: Explanation generation (Groq or deterministic fallback)
        explanation = ""
        if api_key and used_groq and (top_facilities or partial_alternatives):
            explanation = cls._generate_explanation_groq(
                query=query,
                intent=intent,
                candidates=top_facilities or partial_alternatives,
                api_key=api_key,
                model=model
            )

        if not explanation:
            # Deterministic fallback explanation
            if top_facilities:
                top = top_facilities[0]
                dist_str = f"{top.distance_meters}m away" if (top.distance_meters and top.distance_meters < 1000) else f"{((top.distance_meters or 1000)/1000):.1f}km away"
                matched_str = ", ".join(intent.facility_categories).title() if intent.facility_categories else "general rest support"
                explanation = (
                    f"Found {len(top_facilities)} verified rest points matching your request. "
                    f"Top recommendation is {top.name} ({dist_str}), featuring {matched_str} "
                    f"with {top.verification_status.lower().replace('_', ' ')} community status."
                )
            elif partial_alternatives:
                top_part = partial_alternatives[0]
                dist_str = f"{top_part.distance_meters}m away" if top_part.distance_meters else "nearby"
                explanation = (
                    f"No single verified facility currently matches all your requirements within {intent.max_distance_km} km. "
                    f"Showing nearest partial alternative: {top_part.name} ({dist_str}), which offers related rest amenities."
                )
            else:
                explanation = (
                    f"No verified facilities were found within {intent.max_distance_km} km. "
                    f"Try broadening your search radius or checking along major delivery corridors."
                )

        return RestPointAIResponse(
            query=query,
            intent=intent,
            explanation=explanation,
            facilities=top_facilities,
            partial_alternatives=partial_alternatives,
            is_fallback=not used_groq,
            source="groq" if used_groq else "deterministic_engine",
            total_found=len(top_facilities) + len(partial_alternatives)
        )

    @classmethod
    def _generate_explanation_groq(
        cls,
        query: str,
        intent: RestPointAIIntent,
        candidates: List[FacilitySchema],
        api_key: str,
        model: str
    ) -> str:
        """Ask Groq to generate a grounded explanation referencing ONLY real facilities."""
        factual_context = []
        valid_ids = set()
        for f in candidates[:3]:
            valid_ids.add(f.id)
            factual_context.append(
                f"- Facility ID #{f.id}: {f.name} in {f.zone} ({f.distance_meters}m away). "
                f"Services: Water={f.has_water}, Washroom={f.has_washroom}, Charging={f.has_charging}, "
                f"Shade={f.has_shade}, Rest={f.has_rest}. Status={f.verification_status}, Access={f.access_type}."
            )

        system_prompt = (
            "You are Restora's AI Rest-Point Assistant. Provide a 2-sentence helpful explanation "
            "recommending these specific facilities to a delivery rider. "
            "STRICT RULES: You must ONLY reference the facilities listed in the factual data. "
            "DO NOT invent facilities, coordinates, or amenities. Keep tone concise, professional, and practical."
        )

        user_content = (
            f"<worker_request>{query}</worker_request>\n\n"
            f"<factual_candidates>\n" + "\n".join(factual_context) + "\n</factual_candidates>"
        )

        try:
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content}
                ],
                "temperature": 0.2,
                "max_tokens": 150
            }
            with httpx.Client(timeout=8.0) as client:
                res = client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    text = res.json()["choices"][0]["message"]["content"].strip()
                    return text
        except Exception as e:
            logger.warning(f"[AI Agent] Groq explanation generation failed: {e}")
        return ""

    # =========================================================================
    # AGENT 2: RAKSHITARTHA DISRUPTION AGENT
    # =========================================================================

    @classmethod
    def evaluate_disruption(
        cls,
        db: Session,
        lat: float,
        lng: float,
        daily_income: float,
        working_hours: float,
        downtime_hours: float,
        affected_days: float,
        client_weather: Optional[Dict[str, Any]] = None
    ) -> RakshitArthaAIResponse:
        api_key, model = cls._get_groq_client_and_model()

        # Step 1: Real Weather API retrieval (Open-Meteo)
        weather_data = client_weather or {}
        weather_available = True
        
        if not weather_data or "temperature" not in weather_data:
            try:
                url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&timezone=auto"
                with httpx.Client(timeout=6.0) as client:
                    resp = client.get(url)
                    if resp.status_code == 200:
                        raw = resp.json()
                        current = raw.get("current", {})
                        hourly = raw.get("hourly", {})
                        temp = current.get("temperature_2m", 31.0)
                        wind = current.get("wind_speed_10m", 15.0)
                        precip = current.get("precipitation", 0.0)
                        prob_list = hourly.get("precipitation_probability", [0])
                        prob = prob_list[0] if prob_list else 0
                        weather_code = current.get("weather_code", 0)

                        weather_data = {
                            "temperature": round(temp, 1),
                            "wind_speed": round(wind, 1),
                            "precipitation": round(precip, 1),
                            "precipitation_prob": prob,
                            "weather_code": weather_code,
                            "condition_text": "Monsoon Rain" if (precip > 0 or prob > 50) else "Clear / Partly Cloudy",
                            "last_updated": current.get("time") or "Live Telemetry"
                        }
                    else:
                        weather_available = False
            except Exception as e:
                logger.warning(f"[RakshitArtha AI] Live weather fetch failed: {e}")
                weather_available = False

        if not weather_data:
            weather_data = {
                "temperature": 32.0,
                "wind_speed": 16.0,
                "precipitation": 0.0,
                "precipitation_prob": 20,
                "condition_text": "Weather Telemetry Fallback",
                "last_updated": "Fallback Telemetry"
            }

        # Step 2: Deterministic Disruption Rules (Configurable thresholds)
        temp = float(weather_data.get("temperature", 30))
        precip_prob = float(weather_data.get("precipitation_prob", 0))
        precip_amt = float(weather_data.get("precipitation", 0))
        wind_speed = float(weather_data.get("wind_speed", 0))

        # Threshold evaluation
        disruption_status = "NORMAL_CONDITIONS"
        severity = "LOW"
        threshold_met = False
        rule_description = "Normal operating weather. No extreme disruption triggers active."

        if precip_prob >= 70 or precip_amt >= 15.0:
            disruption_status = "HEAVY_RAIN_RISK"
            severity = "INFORMATIONAL_HIGH"
            threshold_met = True
            rule_description = (
                f"Precipitation probability ({precip_prob}%) or rainfall rate ({precip_amt}mm) "
                f"exceeds standard monsoon disruption threshold (65%). Road waterlogging and reduced grip anticipated."
            )
        elif precip_prob >= 50 or precip_amt >= 5.0:
            disruption_status = "MODERATE_RAIN_ADVISORY"
            severity = "INFORMATIONAL"
            threshold_met = True
            rule_description = f"Moderate rain probability ({precip_prob}%). Wet pavement and reduced rider visibility."
        elif temp >= 38.0:
            disruption_status = "EXTREME_HEAT_WARNING"
            severity = "INFORMATIONAL_HIGH"
            threshold_met = True
            rule_description = f"Ambient temperature ({temp}°C) exceeds heatwave trigger threshold (38°C). Elevated risk of heatstroke."
        elif temp >= 33.0:
            disruption_status = "HIGH_HEAT_ADVISORY"
            severity = "INFORMATIONAL"
            threshold_met = True
            rule_description = f"High temperature ({temp}°C). Thermal fatigue and engine overheating risk."
        elif wind_speed >= 35.0:
            disruption_status = "HIGH_WIND_ADVISORY"
            severity = "INFORMATIONAL"
            threshold_met = True
            rule_description = f"Wind speed ({wind_speed} km/h) exceeds two-wheeler crosswind safety threshold (35 km/h)."

        disruption_rule = {
            "condition_type": disruption_status,
            "severity": severity,
            "threshold_met": threshold_met,
            "status_label": "Weather-based guidance (Informational)",
            "rule_description": rule_description,
            "data_source": "Open-Meteo Numerical Meteorological Model"
        }

        # Step 3: Deterministic Income Calculation (Validations)
        valid_daily = max(100.0, float(daily_income))
        valid_hours = max(1.0, min(24.0, float(working_hours)))
        valid_downtime = max(0.0, min(valid_hours, float(downtime_hours)))
        valid_days = max(1.0, min(30.0, float(affected_days)))

        hourly_rate = round(valid_daily / valid_hours, 2)
        direct_lost_earnings = round(hourly_rate * valid_downtime * valid_days, 2)
        # Approximate daily fixed fuel/bike wear amortized
        fixed_operating_loss = round((150.0 / valid_hours) * valid_downtime * valid_days, 2)
        total_estimated_impact = round(direct_lost_earnings + fixed_operating_loss, 2)

        income_calculation = {
            "daily_income_input": valid_daily,
            "working_hours_input": valid_hours,
            "downtime_hours_input": valid_downtime,
            "affected_days_input": valid_days,
            "calculated_hourly_rate": hourly_rate,
            "direct_lost_earnings": direct_lost_earnings,
            "fixed_operating_loss": fixed_operating_loss,
            "total_estimated_impact": total_estimated_impact,
            "calculation_nature": "Deterministic mathematical estimate based on worker input",
            "is_guaranteed_payout": False
        }

        # Step 4: Real Nearby RESTORA Support Facilities
        all_facs = db.query(Facility).all()
        support_matches = []
        for fac in all_facs:
            dist = haversine_distance(lat, lng, fac.lat, fac.lng)
            if dist > 6000: # 6km radius
                continue
            # Look for shaded/rest facilities with water or charging
            if fac.has_shade or fac.has_rest or fac.has_water or fac.has_charging:
                fac_dict = FacilityService.get_facility_by_id(db, fac.id, lat, lng, 1)
                if fac_dict:
                    support_matches.append((dist, FacilitySchema.model_validate(fac_dict)))

        support_matches.sort(key=lambda x: x[0])
        nearby_support = [item[1] for item in support_matches[:3]]

        # Step 5: Groq AI Explanation (with fallback)
        explanation = ""
        used_groq = False
        if api_key:
            explanation = cls._generate_disruption_explanation_groq(
                weather=weather_data,
                disruption=disruption_rule,
                income=income_calculation,
                facilities=nearby_support,
                api_key=api_key,
                model=model
            )
            if explanation:
                used_groq = True

        if not explanation:
            # Deterministic grounded fallback explanation
            nearest_fac = nearby_support[0].name if nearby_support else "a verified Restora hub"
            explanation = (
                f"Current meteorological telemetry indicates {weather_data['condition_text'].lower()} "
                f"({weather_data['temperature']}°C, {weather_data['precipitation_prob']}% rain probability). "
                f"Under RESTORA weather guidance, this constitutes {disruption_status.replace('_', ' ').title()}. "
                f"Based on your entered shift profile, your illustrative income impact is estimated at ₹{total_estimated_impact}. "
                f"If you encounter severe conditions, take shelter at nearby verified support ({nearest_fac})."
            )

        demo_badges = {
            "protection_plan": "DEMO / ILLUSTRATIVE — Educational micro-coverage model",
            "weekly_contribution": "DEMO / ILLUSTRATIVE — Prototype contribution value",
            "simulated_claim_payout": "DEMO / ILLUSTRATIVE — Example payout demonstration only",
            "parametric_trigger": "INFORMATIONAL — Meteorological guidance threshold, not an underwritten insurance policy"
        }

        disclaimer = (
            "Illustrative estimate based on worker-entered parameters and public meteorological forecasts. "
            "RakshitArtha prototype demonstrates parametric disruption safeguards and does not constitute "
            "an underwritten insurance policy or guaranteed financial payout."
        )

        return RakshitArthaAIResponse(
            weather=weather_data,
            disruption_rule=disruption_rule,
            income_calculation=income_calculation,
            explanation=explanation,
            nearby_support_facilities=nearby_support,
            is_fallback=not used_groq,
            source="groq" if used_groq else "deterministic_engine",
            disclaimer=disclaimer,
            demo_badges=demo_badges
        )

    @classmethod
    def _generate_disruption_explanation_groq(
        cls,
        weather: Dict[str, Any],
        disruption: Dict[str, Any],
        income: Dict[str, Any],
        facilities: List[FacilitySchema],
        api_key: str,
        model: str
    ) -> str:
        fac_names = [f"{f.name} ({f.distance_meters}m)" for f in facilities[:2]]
        fac_summary = ", ".join(fac_names) if fac_names else "nearby roadside rest points"

        system_prompt = (
            "You are the RakshitArtha AI Disruption Assistant for gig workers in India. "
            "Explain in 3-4 concise, empathetic, and actionable sentences: "
            "1. The current weather condition and why it matters for motorcycle delivery safety. "
            "2. The calculated illustrative income disruption amount. "
            "3. Practical safety action and specific nearby Restora support facilities. "
            "STRICT RULES: Rely ONLY on the provided factual numbers and facility names. "
            "DO NOT claim this is an approved insurance payout or medical guarantee."
        )

        factual_context = (
            f"Weather: {weather.get('condition_text')} ({weather.get('temperature')}°C, "
            f"Rain Prob: {weather.get('precipitation_prob')}%, Wind: {weather.get('wind_speed')} km/h).\n"
            f"Disruption Rule: {disruption.get('condition_type')} ({disruption.get('rule_description')}).\n"
            f"Illustrative Income Impact: ₹{income.get('total_estimated_impact')} (based on ₹{income.get('calculated_hourly_rate')}/hr rate).\n"
            f"Nearby Restora Facilities: {fac_summary}."
        )

        try:
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": factual_context}
                ],
                "temperature": 0.2,
                "max_tokens": 200
            }
            with httpx.Client(timeout=8.0) as client:
                res = client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    text = res.json()["choices"][0]["message"]["content"].strip()
                    return text
        except Exception as e:
            logger.warning(f"[RakshitArtha AI] Groq explanation failed: {e}")
        return ""

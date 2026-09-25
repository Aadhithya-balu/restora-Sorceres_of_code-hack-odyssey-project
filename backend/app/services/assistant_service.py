from sqlalchemy.orm import Session
from ..models import WorkerProfile, Facility, Claim, WorkerPolicy, DisruptionEvent
from .facility_service import FacilityService

class AssistantService:
    @staticmethod
    def answer_query(db: Session, query: str, worker_id: int = 1) -> dict:
        q = query.lower()
        worker = db.query(WorkerProfile).filter(WorkerProfile.id == worker_id).first()
        policy = db.query(WorkerPolicy).filter(WorkerPolicy.worker_id == worker_id).first()
        claim = db.query(Claim).filter(Claim.worker_id == worker_id).order_by(Claim.created_at.desc()).first()

        suggested = [
            "Where can I rest nearby?",
            "Is my protection active?",
            "What is the status of my claim?",
            "Find EV charging near me"
        ]

        # 1. Rest / Pause places
        if "rest" in q or "tired" in q or "sit" in q or "pause" in q:
            facilities = FacilityService.get_facilities(db, service_filter="REST")
            top = facilities[0] if facilities else None
            if top:
                return {
                    "reply": f"The nearest verified rest spot is {top['name']} on {top['address']}, just {top['distance_meters']}m away. It has quiet seating, cold RO water, clean washrooms, and phone charging docks.",
                    "action_type": "VIEW_FACILITY",
                    "action_data": top,
                    "suggested_prompts": ["How do I navigate there?", "Is there parking for my bike?", "Is my protection active?"]
                }

        # 2. Charging / Battery
        if "charge" in q or "charging" in q or "battery" in q:
            facilities = FacilityService.get_facilities(db, service_filter="CHARGE")
            top = facilities[0] if facilities else None
            if top:
                return {
                    "reply": f"Found fast charging {top['distance_meters']}m away at {top['name']}. Your battery is currently at {worker.battery_pct if worker else 38}%. This spot has sheltered docks and verified working sockets.",
                    "action_type": "VIEW_FACILITY",
                    "action_data": top,
                    "suggested_prompts": ["Show directions", "Are washrooms available there?", "Check my claim status"]
                }

        # 3. Washroom / Water
        if "washroom" in q or "toilet" in q or "bathroom" in q or "water" in q:
            facilities = FacilityService.get_facilities(db, service_filter="WASHROOM")
            top = facilities[0] if facilities else None
            if top:
                return {
                    "reply": f"Nearest sanitized washroom is at {top['name']} ({top['distance_meters']}m away, {top['address']}). Community verified with high cleanliness score ({top['cleanliness_score']}/100) and RO drinking water.",
                    "action_type": "VIEW_FACILITY",
                    "action_data": top,
                    "suggested_prompts": ["Take me there", "Where can I rest after?", "Show weather alerts"]
                }

        # 4. Protection status
        if "protect" in q or "policy" in q or "insurance" in q or "coverage" in q:
            if policy and policy.status == "ACTIVE":
                return {
                    "reply": f"Your Standard Resilience plan is ACTIVE (₹{int(policy.weekly_premium)}/week). You are protected against Heavy Rain (>50mm), Urban Flooding, Heatwave (>42°C), and Curfews. Next automated renewal is on {policy.next_renewal_at}.",
                    "action_type": "OPEN_PROTECT_TAB",
                    "action_data": {"status": "ACTIVE", "plan": "Standard Resilience", "amount": policy.weekly_premium},
                    "suggested_prompts": ["What happened to my latest claim?", "Why did my risk change?", "Explore other plans"]
                }
            else:
                return {
                    "reply": "Your income protection is currently paused. Activate Standard Shield (₹30/week) to unlock automatic weather and disruption compensation.",
                    "action_type": "OPEN_PROTECT_TAB",
                    "suggested_prompts": ["Show protection plans", "What events are covered?"]
                }

        # 5. Claim status
        if "claim" in q or "payout" in q or "money" in q or "disruption" in q:
            if claim:
                return {
                    "reply": f"Your claim {claim.claim_number} for ₹{int(claim.amount)} is currently in {claim.stage.replace('_', ' ').title()}. All 5 fraud & telemetry layers have passed. The simulated payout is being routed to your registered UPI ID (aadhi@okhdfcbank).",
                    "action_type": "VIEW_CLAIM",
                    "action_data": {"claim_number": claim.claim_number, "stage": claim.stage, "amount": claim.amount},
                    "suggested_prompts": ["Simulate instant UPI credit", "Why was this claim triggered?", "Show nearby shelter"]
                }
            else:
                return {
                    "reply": "You currently do not have any active claims. When extreme rain or disruptions occur in your operating zone, OIVU detects them and generates claims automatically.",
                    "suggested_prompts": ["Is my protection active?", "Check current weather"]
                }

        # 6. Default helpful response
        return {
            "reply": "I'm your OIVU Assistant. I can help you find nearby rest points, clean washrooms, water, EV chargers, check your weekly protection status, or track automated disruption claims. What do you need right now?",
            "suggested_prompts": suggested
        }

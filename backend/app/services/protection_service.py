from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..models import ProtectionPlan, WorkerPolicy, WorkerProfile

class ProtectionService:
    @staticmethod
    def get_plans(db: Session) -> List[ProtectionPlan]:
        return db.query(ProtectionPlan).all()

    @staticmethod
    def get_worker_policy(db: Session, worker_id: int = 1) -> Optional[dict]:
        policy = db.query(WorkerPolicy).filter(WorkerPolicy.worker_id == worker_id).first()
        if not policy:
            return None
        plan = db.query(ProtectionPlan).filter(ProtectionPlan.slug == policy.plan_slug).first()
        return {
            "plan_slug": policy.plan_slug,
            "plan_title": plan.title if plan else "Standard Resilience",
            "status": policy.status,
            "next_renewal_at": policy.next_renewal_at,
            "weekly_premium": policy.weekly_premium,
            "total_claims_count": policy.total_claims_count,
            "total_payout_received": policy.total_payout_received,
            "covered_events": plan.covered_events if plan else ["Heavy Rain", "Flooding", "Extreme Heat"],
            "disclaimer": "PROTOTYPE / DEMO: Protection plans shown are prototype configurations for demonstration."
        }

    @staticmethod
    def switch_plan(db: Session, worker_id: int, plan_slug: str) -> dict:
        plan = db.query(ProtectionPlan).filter(ProtectionPlan.slug == plan_slug).first()
        if not plan:
            raise ValueError("Plan not found")
        
        policy = db.query(WorkerPolicy).filter(WorkerPolicy.worker_id == worker_id).first()
        if not policy:
            policy = WorkerPolicy(
                worker_id=worker_id,
                plan_slug=plan_slug,
                status="ACTIVE",
                weekly_premium=plan.weekly_price
            )
            db.add(policy)
        else:
            policy.plan_slug = plan_slug
            policy.weekly_premium = plan.weekly_price
            policy.status = "ACTIVE"

        db.commit()
        return {
            "success": True,
            "plan_slug": plan_slug,
            "title": plan.title,
            "weekly_price": plan.weekly_price,
            "message": f"Successfully switched to {plan.title} (₹{int(plan.weekly_price)}/week)"
        }

    @staticmethod
    def get_risk_assessment(worker_id: int = 1) -> Dict[str, Any]:
        """Explainable risk model with SHAP-style breakdown factors"""
        return {
            "overall_risk": "MODERATE",
            "risk_score_numeric": 58,
            "rain_risk": "HIGH",
            "flood_risk": "MEDIUM",
            "heat_risk": "LOW",
            "aqi_risk": "LOW",
            "factors": [
                {
                    "name": "Current Heavy Rainfall",
                    "impact": "+18",
                    "direction": "RISK_INCREASE",
                    "description": "68 mm/hr active monsoon downpour in Peelamedu corridor"
                },
                {
                    "name": "Southwest Monsoon Season",
                    "impact": "+8",
                    "direction": "RISK_INCREASE",
                    "description": "Historical peak weather disruption window for Western Tamil Nadu"
                },
                {
                    "name": "Peelamedu Low-Lying Underpasses",
                    "impact": "+5",
                    "direction": "RISK_INCREASE",
                    "description": "Zone topography prone to temporary road waterlogging"
                },
                {
                    "name": "Recent Disruption Frequency",
                    "impact": "+4",
                    "direction": "RISK_INCREASE",
                    "description": "2 rain-related work pauses recorded in this sector over 14 days"
                },
                {
                    "name": "Rider Safety Mitigation",
                    "impact": "-7",
                    "direction": "RISK_DECREASE",
                    "description": "Active shelter utilization at verified OIVU rest point"
                }
            ],
            "explanation_summary": "Your risk is currently Moderate, primarily elevated (+18) by ongoing 68 mm/hr rainfall and seasonal monsoon patterns in Peelamedu. Active shelter utilization helps protect your safety."
        }

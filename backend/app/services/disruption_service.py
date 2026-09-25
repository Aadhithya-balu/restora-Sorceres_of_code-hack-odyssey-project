from typing import List, Dict, Any
from sqlalchemy.orm import Session
from ..models import DisruptionEvent
from ..schemas import CityConditionsSchema, DisruptionEventSchema

class DisruptionService:
    @staticmethod
    def get_city_conditions(db: Session, zone: str = "Peelamedu") -> Dict[str, Any]:
        active_disruptions = db.query(DisruptionEvent).filter(DisruptionEvent.is_active == True).count()
        return {
            "rain_chance": 68,
            "rainfall_rate": "68 mm/hr",
            "temp_celsius": 31,
            "aqi": 112,
            "aqi_status": "Moderate Air Quality",
            "active_disruptions_count": max(1, active_disruptions),
            "traffic_status": "Heavy Congestion near Junctions",
            "weather_summary": "Intense monsoon shower across Peelamedu-Avinashi Road corridor. High waterlogging risk along underpasses."
        }

    @staticmethod
    def get_active_disruptions(db: Session) -> List[DisruptionEvent]:
        return db.query(DisruptionEvent).filter(DisruptionEvent.is_active == True).all()

    @staticmethod
    def trigger_disruption_simulation(
        db: Session,
        event_type: str = "HEAVY_RAIN",
        zone: str = "Peelamedu",
        metric: str = "72 mm/hr"
    ) -> DisruptionEvent:
        event = DisruptionEvent(
            event_type=event_type,
            severity=0.85,
            city="Coimbatore",
            zone=zone,
            center_lat=11.0267,
            center_lng=77.0118,
            radius_km=4.5,
            trigger_metric=metric,
            trigger_threshold="50 mm/hr",
            source_count=4,
            verification_status="CONFIRMED",
            is_active=True
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        return event

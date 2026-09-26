from typing import Dict, Any, List
from sqlalchemy.orm import Session
from ..models import Facility, FacilityReport, BreakSession, User

class AdminService:
    @staticmethod
    def get_overview_stats(db: Session) -> Dict[str, Any]:
        total_facilities = db.query(Facility).count()
        verified_facilities = db.query(Facility).filter(Facility.verification_status == "VERIFIED").count()
        pending_submissions = db.query(Facility).filter(Facility.verification_status == "PENDING").count()
        total_reports = db.query(FacilityReport).count()
        pending_reports = db.query(FacilityReport).filter(FacilityReport.status == "PENDING").count()
        total_breaks = db.query(BreakSession).count()
        total_users = db.query(User).count()

        # Service gap analysis based on database records
        facilities = db.query(Facility).all()
        zones = {}
        for f in facilities:
            z = f.zone or "Central"
            if z not in zones:
                zones[z] = {"total": 0, "washrooms": 0, "water": 0, "charging": 0, "rest": 0, "shade": 0}
            zones[z]["total"] += 1
            if f.has_washroom: zones[z]["washrooms"] += 1
            if f.has_water: zones[z]["water"] += 1
            if f.has_charging: zones[z]["charging"] += 1
            if f.has_rest: zones[z]["rest"] += 1
            if f.has_shade: zones[z]["shade"] += 1

        service_gaps = []
        for zone_name, counts in zones.items():
            gaps = []
            if counts["washrooms"] == 0 or (counts["washrooms"] / counts["total"]) < 0.4:
                gaps.append("Washroom deficit")
            if counts["charging"] == 0 or (counts["charging"] / counts["total"]) < 0.3:
                gaps.append("Charging infrastructure deficit")
            if counts["shade"] == 0:
                gaps.append("No shaded shelter points")
            
            gap_severity = "HIGH" if len(gaps) >= 2 else ("MODERATE" if len(gaps) == 1 else "BALANCED")
            service_gaps.append({
                "zone": zone_name,
                "total_points": counts["total"],
                "identified_gaps": gaps if gaps else ["Basic coverage adequate"],
                "severity": gap_severity
            })

        return {
            "total_facilities": total_facilities,
            "verified_facilities": verified_facilities,
            "pending_submissions": pending_submissions,
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "total_break_sessions": total_breaks,
            "total_users": total_users,
            "service_gaps": service_gaps
        }

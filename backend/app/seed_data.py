import datetime
from sqlalchemy.orm import Session
from .models import (
    User, Facility, FacilityReport, FacilityVerification,
    Bookmark, BreakSession, SupportResource, PartnerOffer, ActivityLog
)
from .auth import hash_password

def seed_database(db: Session):
    # Check if already seeded
    if db.query(User).first():
        return

    # 1. Create Default Users (Worker and Admin)
    worker = User(
        name="Aadhi",
        email="aadhi@restora.app",
        phone="+91 98421 77310",
        hashed_password=hash_password("Worker@123"),
        role="worker",
        worker_category="delivery_rider",
        preferred_language="en",
        work_area="Peelamedu, Coimbatore",
        hourly_rate_estimate=180.0
    )
    admin = User(
        name="Admin Restora",
        email="admin@restora.app",
        phone="+91 98421 00001",
        hashed_password=hash_password("Admin@123"),
        role="admin",
        worker_category="other",
        preferred_language="en",
        work_area="Coimbatore Central",
        hourly_rate_estimate=0.0
    )
    worker2 = User(
        name="Suresh Kumar",
        email="suresh@restora.app",
        phone="+91 98421 88920",
        hashed_password=hash_password("Worker@123"),
        role="worker",
        worker_category="cab_driver",
        preferred_language="ta",
        work_area="Gandhipuram - Peelamedu",
        hourly_rate_estimate=220.0
    )
    db.add_all([worker, admin, worker2])
    db.commit()

    # 2. Rest Facilities
    facilities = [
        Facility(
            name="PSG Tech Community Rest Point",
            category="REST_POINT",
            address="Avinashi Road, Near PSG Tech Gate 2, Peelamedu",
            zone="Peelamedu",
            city="Coimbatore",
            lat=11.0285,
            lng=77.0135,
            is_open=True,
            operating_hours="06:00 - 23:30",
            access_type="PUBLIC",
            pricing_info="Free to all workers",
            accessibility_info="Ground level, wide entryway, ramp available",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=True,
            has_shade=True,
            has_parking=True,
            has_food=False,
            has_medical=True,
            verification_status="VERIFIED",
            verification_count=34,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=25),
            notes="Dedicated gig-worker shelter. Filtered cold RO water, clean restrooms, 12 fast USB-C phone charging ports, wall fans, and shaded bike parking."
        ),
        Facility(
            name="Peelamedu Metro EV & Rider Oasis",
            category="CHARGING",
            address="Fun Republic Mall Link Road, Peelamedu",
            zone="Peelamedu",
            city="Coimbatore",
            lat=11.0242,
            lng=77.0092,
            is_open=True,
            operating_hours="24 Hours Open",
            access_type="PUBLIC",
            pricing_info="Free seating & water, standard EV rate",
            accessibility_info="Paved road, ground level parking",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=True,
            has_shade=True,
            has_parking=True,
            has_food=True,
            has_medical=False,
            verification_status="VERIFIED",
            verification_count=52,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=45),
            notes="Fast 2-Wheeler EV charging swap station + rider rest zone. Cold water dispenser, tea stall next door, shaded benches."
        ),
        Facility(
            name="Nava India Express Sanitized Washroom & RO",
            category="WASHROOM",
            address="Nava India Junction, Behind HP Petrol Pump, Peelamedu",
            zone="Peelamedu",
            city="Coimbatore",
            lat=11.0210,
            lng=77.0045,
            is_open=True,
            operating_hours="05:30 - 23:00",
            access_type="PUBLIC",
            pricing_info="Free corporation facility",
            accessibility_info="Step-free entrance",
            has_rest=False,
            has_washroom=True,
            has_water=True,
            has_charging=False,
            has_shade=True,
            has_parking=True,
            has_food=False,
            has_medical=False,
            verification_status="VERIFIED",
            verification_count=26,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
            notes="Sanitized corporation washroom for delivery riders and drivers. Clean water refill tap situated outside."
        ),
        Facility(
            name="Amma Unavagam & Shaded Break Hub",
            category="FOOD",
            address="Peelamedu Corporation Ground, Masakalipalayam Rd",
            zone="Peelamedu",
            city="Coimbatore",
            lat=11.0298,
            lng=77.0021,
            is_open=True,
            operating_hours="07:00 - 10:00, 12:00 - 15:30",
            access_type="PUBLIC",
            pricing_info="Subsidized meals: Idli ₹1, Rice ₹5",
            accessibility_info="Ground floor hall with tree shade",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=False,
            has_shade=True,
            has_parking=True,
            has_food=True,
            has_medical=False,
            verification_status="VERIFIED",
            verification_count=41,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=3),
            notes="Hot hygienic meals: Sambar rice ₹5, Curd rice ₹3, Idli ₹1. Tree shade, drinking water, and safe 2W parking."
        ),
        Facility(
            name="Sri Murugan 24/7 Puncture, Tyre Air & Repair",
            category="REST_POINT",
            address="Avinashi Main Rd, Near Hope College Flyover",
            zone="Hope College",
            city="Coimbatore",
            lat=11.0345,
            lng=77.0215,
            is_open=True,
            operating_hours="24 Hours Open",
            access_type="PUBLIC",
            pricing_info="Free air check; ₹70 tubeless puncture",
            accessibility_info="Roadside workshop with ramp approach",
            has_rest=False,
            has_washroom=False,
            has_water=True,
            has_charging=True,
            has_shade=True,
            has_parking=True,
            has_food=False,
            has_medical=True,
            verification_status="RECENTLY_REPORTED",
            verification_count=19,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5),
            notes="Reliable 2-wheeler mechanic. Tubeless puncture repair, tyre air top-up, battery jump, quick phone charging socket."
        ),
        Facility(
            name="Codissia Trade Center Driver Rest Shade",
            category="SHADED_AREA",
            address="Codissia Road, GV Fair Grounds, Peelamedu",
            zone="Peelamedu",
            city="Coimbatore",
            lat=11.0335,
            lng=77.0295,
            is_open=True,
            operating_hours="06:00 - 22:00",
            access_type="PUBLIC",
            pricing_info="Free",
            accessibility_info="Spacious open parking",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=False,
            has_shade=True,
            has_parking=True,
            has_food=False,
            has_medical=False,
            verification_status="VERIFIED",
            verification_count=15,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=6),
            notes="Spacious tree shade ideal for cab drivers and riders waiting between peak orders. Restrooms open during exhibition days."
        ),
        Facility(
            name="Sanjeevani First-Aid & Worker Wellness Point",
            category="MEDICAL",
            address="Airport Road Junction, Near Codissia, Peelamedu",
            zone="Peelamedu",
            city="Coimbatore",
            lat=11.0320,
            lng=77.0280,
            is_open=True,
            operating_hours="07:00 - 23:00",
            access_type="PUBLIC",
            pricing_info="Free first aid; medications at MRP",
            accessibility_info="Step-free pharmacy entrance",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=True,
            has_shade=True,
            has_parking=True,
            has_food=False,
            has_medical=True,
            verification_status="VERIFIED",
            verification_count=18,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1),
            notes="Emergency first-aid dressing for fall/scrape injuries, oral rehydration salts (ORS) for heat exhaustion, cool water refill, BP check."
        )
    ]
    db.add_all(facilities)
    db.commit()

    # 3. Community Reports
    reports = [
        FacilityReport(
            facility_id=facilities[0].id,
            user_id=worker.id,
            user_name=worker.name,
            report_type="OPEN",
            description="Verified open and fully functional. Filtered cold RO water is working well and phone charging sockets are active.",
            status="APPROVED",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=25)
        ),
        FacilityReport(
            facility_id=facilities[1].id,
            user_id=worker2.id,
            user_name=worker2.name,
            report_type="CHARGER_BROKEN",
            description="One of the USB charging ports on the right wall has a loose connection. The remaining 10 ports and EV swap station work fine.",
            status="PENDING",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=50)
        ),
        FacilityReport(
            facility_id=facilities[2].id,
            user_id=worker.id,
            user_name=worker.name,
            report_type="OPEN",
            description="Corporation sanitation staff completed cleaning at 11:00 AM. Washrooms are clean and water tap is flowing.",
            status="APPROVED",
            created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
        )
    ]
    db.add_all(reports)
    db.commit()

    # 4. Bookmarks
    bookmarks = [
        Bookmark(user_id=worker.id, facility_id=facilities[0].id),
        Bookmark(user_id=worker.id, facility_id=facilities[1].id)
    ]
    db.add_all(bookmarks)
    db.commit()

    # 5. Break Sessions
    breaks = [
        BreakSession(
            user_id=worker.id,
            facility_id=facilities[0].id,
            planned_duration_minutes=20,
            actual_duration_minutes=22,
            start_time=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
            end_time=datetime.datetime.utcnow() - datetime.timedelta(hours=1, minutes=38),
            status="COMPLETED",
            notes="Took 20 min break, drank cold water, charged phone from 24% to 68%."
        ),
        BreakSession(
            user_id=worker.id,
            facility_id=facilities[3].id,
            planned_duration_minutes=30,
            actual_duration_minutes=28,
            start_time=datetime.datetime.utcnow() - datetime.timedelta(days=1, hours=3),
            end_time=datetime.datetime.utcnow() - datetime.timedelta(days=1, hours=2, minutes=32),
            status="COMPLETED",
            notes="Lunch pause at Amma Unavagam, resting under tree shade."
        )
    ]
    db.add_all(breaks)
    db.commit()

    # 6. Support Resources
    resources = [
        SupportResource(
            title="Tamil Nadu Gig Workers Welfare Board",
            category="WELFARE_BOARD",
            description="State board providing accidental insurance assistance, social security registration, and education assistance for registered delivery and cab workers.",
            contact_number="044-24321456",
            address="DMS Complex, Teynampet, Chennai (State Board Office)",
            link_url="https://tnuwwb.tn.gov.in/",
            is_verified=True
        ),
        SupportResource(
            title="National Emergency Dispatch & Police Response (112)",
            category="EMERGENCY_CONTACT",
            description="24x7 toll-free unified emergency response for police, fire, and distress situations while on the road.",
            contact_number="112",
            address="All India toll-free 24/7",
            link_url=None,
            is_verified=True
        ),
        SupportResource(
            title="Free Government Ambulance Emergency (108)",
            category="EMERGENCY_CONTACT",
            description="Immediate emergency medical transport and emergency paramedic response for road accidents or acute medical crises.",
            contact_number="108",
            address="Tamil Nadu 24/7 Emergency Medical Service",
            link_url=None,
            is_verified=True
        ),
        SupportResource(
            title="Heatstroke & Hydration Guidelines for Gig Workers",
            category="HEALTH_GUIDELINE",
            description="Summer heatwave advisory: Drink at least 500ml water every 90 minutes. Rest in shade when temperature exceeds 38°C. Recognize dizziness, nausea, or heavy fatigue early.",
            contact_number=None,
            address="National Disaster Management Authority (NDMA)",
            link_url="https://ndma.gov.in/",
            is_verified=True
        )
    ]
    db.add_all(resources)
    db.commit()

    # 7. Partner Offers
    offers = [
        PartnerOffer(
            title="Discounted Cutting Chai & Biscuits",
            partner_name="Murugan Tea Stall (Opp. PSG Tech)",
            facility_id=facilities[0].id,
            offer_type="DISCOUNT_BEVERAGE",
            description="Hot fresh tea for ₹10 with 2 Marie biscuits for any gig worker wearing partner delivery t-shirt or carrying delivery bag.",
            terms="Show delivery rider app or active shift screen. Valid 07:00 to 22:00 daily.",
            valid_until="31 Dec 2026",
            is_active=True
        ),
        PartnerOffer(
            title="Free Phone Fast-Charging & Filter Refills",
            partner_name="Kazam / Ather Grid Hub Peelamedu",
            facility_id=facilities[1].id,
            offer_type="FREE_CHARGING",
            description="Free 45-minute high-speed phone charging lockboxes and cold water bottle refills for all gig riders.",
            terms="Free access; no purchase required. 24x7 available.",
            valid_until="Ongoing 2026",
            is_active=True
        ),
        PartnerOffer(
            title="Subsidized Nutritious Meals (₹5)",
            partner_name="Peelamedu Corporation Amma Unavagam",
            facility_id=facilities[3].id,
            offer_type="MEAL_SUBSIDY",
            description="Affordable, hygienic government meals: ₹1 Idli, ₹5 Sambar/Lemon/Curd rice, free clean drinking water.",
            terms="Open to all members of the public and transport workers. Morning & afternoon meal timings.",
            valid_until="Ongoing 2026",
            is_active=True
        )
    ]
    db.add_all(offers)
    db.commit()

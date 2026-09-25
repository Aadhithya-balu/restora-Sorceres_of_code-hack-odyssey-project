import datetime
import random
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
        ),
        Facility(
            name="Koyambedu Bus Terminus Rest Area",
            category="REST_POINT",
            address="CMBT, Koyambedu, Chennai",
            zone="Koyambedu",
            city="Chennai",
            lat=13.0674,
            lng=80.1952,
            is_open=True,
            operating_hours="24 Hours Open",
            access_type="PUBLIC",
            pricing_info="Free to all workers",
            accessibility_info="Ground level, wide entryway",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=True,
            has_shade=True,
            has_parking=True,
            has_food=True,
            has_medical=False,
            verification_status="VERIFIED",
            verification_count=120,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=10),
            notes="Massive bus terminus with dedicated resting spots for gig workers. Plenty of food stalls and washrooms."
        ),
        Facility(
            name="OMR IT Expressway Rider Hub",
            category="SHADED_AREA",
            address="Rajiv Gandhi Salai, Thoraipakkam, Chennai",
            zone="Thoraipakkam",
            city="Chennai",
            lat=12.9696,
            lng=80.2443,
            is_open=True,
            operating_hours="06:00 - 23:00",
            access_type="PUBLIC",
            pricing_info="Free",
            accessibility_info="Along the service road",
            has_rest=True,
            has_washroom=False,
            has_water=True,
            has_charging=False,
            has_shade=True,
            has_parking=True,
            has_food=True,
            has_medical=False,
            verification_status="VERIFIED",
            verification_count=85,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1),
            notes="Shaded parking near IT parks. Popular waiting spot for food delivery riders."
        ),
        Facility(
            name="Mattuthavani Integrated Bus Stand Rest Zone",
            category="REST_POINT",
            address="M.G.R Bus Stand, Mattuthavani, Madurai",
            zone="Mattuthavani",
            city="Madurai",
            lat=9.9416,
            lng=78.1472,
            is_open=True,
            operating_hours="24 Hours Open",
            access_type="PUBLIC",
            pricing_info="Free corporation facility",
            accessibility_info="Ramp accessible",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=True,
            has_shade=True,
            has_parking=True,
            has_food=True,
            has_medical=True,
            verification_status="VERIFIED",
            verification_count=45,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
            notes="Spacious rest zone inside the bus stand. Clean drinking water and 24/7 food availability."
        ),
        Facility(
            name="Trichy Central Bus Stand EV & Rest Point",
            category="CHARGING",
            address="Cantonment, Tiruchirappalli",
            zone="Cantonment",
            city="Tiruchirappalli",
            lat=10.8050,
            lng=78.6856,
            is_open=True,
            operating_hours="05:00 - 23:30",
            access_type="PUBLIC",
            pricing_info="Free rest area, Standard EV rates",
            accessibility_info="Easily accessible from main road",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=True,
            has_shade=True,
            has_parking=True,
            has_food=True,
            has_medical=False,
            verification_status="VERIFIED",
            verification_count=60,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=45),
            notes="Ideal for cab drivers and EV riders. Washrooms available at the bus terminus nearby."
        ),
        Facility(
            name="Salem New Bus Stand Driver Oasis",
            category="REST_POINT",
            address="Meyyanur, Salem",
            zone="Meyyanur",
            city="Salem",
            lat=11.6669,
            lng=78.1362,
            is_open=True,
            operating_hours="24 Hours Open",
            access_type="PUBLIC",
            pricing_info="Free",
            accessibility_info="Ground level",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=False,
            has_shade=True,
            has_parking=True,
            has_food=True,
            has_medical=False,
            verification_status="VERIFIED",
            verification_count=35,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=3),
            notes="Large resting area for drivers. Lots of shade and 24/7 tea stalls."
        ),
        Facility(
            name="Erode BS Washroom & RO Point",
            category="WASHROOM",
            address="Central Bus Stand, Erode",
            zone="Central",
            city="Erode",
            lat=11.3364,
            lng=77.7161,
            is_open=True,
            operating_hours="06:00 - 22:00",
            access_type="PUBLIC",
            pricing_info="Free",
            accessibility_info="Public facility",
            has_rest=False,
            has_washroom=True,
            has_water=True,
            has_charging=False,
            has_shade=True,
            has_parking=True,
            has_food=False,
            has_medical=False,
            verification_status="RECENTLY_REPORTED",
            verification_count=20,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1),
            notes="Clean drinking water and washroom facility. Suitable for quick stops."
        ),
        Facility(
            name="Tiruppur Old Bus Stand Food & Shade",
            category="FOOD",
            address="Old Bus Stand, Tiruppur",
            zone="Town Centre",
            city="Tiruppur",
            lat=11.1085,
            lng=77.3411,
            is_open=True,
            operating_hours="07:00 - 22:00",
            access_type="PUBLIC",
            pricing_info="Subsidized food",
            accessibility_info="Crowded area, limited large vehicle parking",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=True,
            has_shade=True,
            has_parking=True,
            has_food=True,
            has_medical=False,
            verification_status="VERIFIED",
            verification_count=50,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=30),
            notes="Very useful for inner-city delivery boys. Amma Unavagam and mobile charging spots available."
        ),
        Facility(
            name="Vannarpettai Junction Rest Area",
            category="REST_POINT",
            address="Vannarpettai, Tirunelveli",
            zone="Vannarpettai",
            city="Tirunelveli",
            lat=8.7188,
            lng=77.7471,
            is_open=True,
            operating_hours="05:00 - 23:00",
            access_type="PUBLIC",
            pricing_info="Free",
            accessibility_info="Tree shade along the highway",
            has_rest=True,
            has_washroom=False,
            has_water=True,
            has_charging=False,
            has_shade=True,
            has_parking=True,
            has_food=True,
            has_medical=True,
            verification_status="VERIFIED",
            verification_count=22,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=4),
            notes="A great place to wait for rides. Cool breeze and plenty of tree shade."
        ),
        Facility(
            name="Kanyakumari Beach Road Waiting Spot",
            category="SHADED_AREA",
            address="Beach Road, Kanyakumari",
            zone="Beach",
            city="Kanyakumari",
            lat=8.0833,
            lng=77.5445,
            is_open=True,
            operating_hours="06:00 - 20:00",
            access_type="PUBLIC",
            pricing_info="Free",
            accessibility_info="Open public space",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=False,
            has_shade=True,
            has_parking=True,
            has_food=True,
            has_medical=False,
            verification_status="VERIFIED",
            verification_count=65,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=15),
            notes="Nice waiting area for auto and cab drivers. Public amenities are well maintained."
        ),
        Facility(
            name="Vellore Fort Roundana Rest & Medical Point",
            category="MEDICAL",
            address="Roundana, Vellore",
            zone="Fort Area",
            city="Vellore",
            lat=12.9350,
            lng=79.1350,
            is_open=True,
            operating_hours="24 Hours Open",
            access_type="PUBLIC",
            pricing_info="Free First-Aid",
            accessibility_info="Easy access from main road",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=True,
            has_shade=True,
            has_parking=True,
            has_food=False,
            has_medical=True,
            verification_status="VERIFIED",
            verification_count=28,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
            notes="Medical assistance available 24/7. First-aid, ORS available along with mobile charging stations."
        ),
        Facility(
            name="Thanjavur Old Bus Stand Rider Oasis",
            category="REST_POINT",
            address="Old Bus Stand, Thanjavur",
            zone="Old Town",
            city="Thanjavur",
            lat=10.7870,
            lng=79.1378,
            is_open=True,
            operating_hours="06:00 - 23:00",
            access_type="PUBLIC",
            pricing_info="Free",
            accessibility_info="Public area",
            has_rest=True,
            has_washroom=True,
            has_water=True,
            has_charging=True,
            has_shade=True,
            has_parking=True,
            has_food=True,
            has_medical=False,
            verification_status="RECENTLY_REPORTED",
            verification_count=15,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=55),
            notes="Historical town rest point for delivery agents. Shade, charging, and drinking water."
        ),
        Facility(
            name="Karur Bypass EV Swap Station",
            category="CHARGING",
            address="Bypass Road, Karur",
            zone="Bypass",
            city="Karur",
            lat=10.9601,
            lng=78.0766,
            is_open=True,
            operating_hours="24 Hours Open",
            access_type="PUBLIC",
            pricing_info="Standard EV swap rate",
            accessibility_info="Highway side",
            has_rest=False,
            has_washroom=True,
            has_water=True,
            has_charging=True,
            has_shade=True,
            has_parking=True,
            has_food=False,
            has_medical=False,
            verification_status="VERIFIED",
            verification_count=12,
            last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5),
            notes="Quick EV swapping and charging station for gig vehicles. Cold water available."
        )
    ]

    # --- NEW PROCEDURAL GENERATION (40+ per district) ---
    district_coords = {
        "Chennai": (13.0827, 80.2707),
        "Coimbatore": (11.0168, 76.9558),
        "Madurai": (9.9252, 78.1198),
        "Tiruchirappalli": (10.7905, 78.7047),
        "Salem": (11.6643, 78.1460),
        "Tirunelveli": (8.7139, 77.7567),
        "Tiruppur": (11.1085, 77.3411),
        "Vellore": (12.9165, 79.1325),
        "Erode": (11.3410, 77.7172),
        "Thoothukudi": (8.7642, 78.1348),
        "Dindigul": (10.3673, 77.9803),
        "Thanjavur": (10.7870, 79.1378),
        "Ranipet": (12.9272, 79.3330),
        "Kanyakumari": (8.0883, 77.5385),
        "Kancheepuram": (12.8342, 79.7036),
        "Chengalpattu": (12.6819, 79.9888),
        "Tiruvallur": (13.1436, 79.9119),
        "Cuddalore": (11.7480, 79.7714),
        "Tiruvannamalai": (12.2253, 79.0747),
        "Viluppuram": (11.9401, 79.4861),
        "Krishnagiri": (12.5186, 78.2137),
        "Dharmapuri": (12.1211, 78.1582),
        "Pudukkottai": (10.3797, 78.8205),
        "Nagapattinam": (10.7656, 79.8424),
        "Namakkal": (11.2189, 78.1673),
        "Karur": (10.9601, 78.0766),
        "Nilgiris": (11.4916, 76.7337),
        "Perambalur": (11.2342, 78.8817),
        "Ariyalur": (11.1401, 79.0786),
        "Ramanathapuram": (9.3639, 78.8321),
        "Sivaganga": (9.8433, 78.4809),
        "Tenkasi": (8.9594, 77.3161),
        "Tirupathur": (12.4939, 78.5661),
        "Tiruvarur": (10.7719, 79.6366),
        "Kallakurichi": (11.7383, 78.9639),
        "Mayiladuthurai": (11.1026, 79.6521),
        "Virudhunagar": (9.5872, 77.9573),
        "Theni": (10.0104, 77.4768)
    }
    
    prefixes = ["Sri", "New", "Royal", "City", "Metro", "Express", "Golden", "National", "Highway", "Public", "Community", "Driver", "Rider", "Gig Worker", "Local", "Central", "Urban"]
    suffixes = ["Rest Point", "Oasis", "Shade", "EV Hub", "Washroom", "Unavagam", "Tea Stall", "Plaza", "Junction", "Relief Center", "First-Aid", "Refresh", "Lounge", "Shelter", "Stop"]
    categories = ["REST_POINT", "SHADED_AREA", "CHARGING", "WASHROOM", "FOOD", "MEDICAL"]
    street_suffixes = ["Main Road", "Bypass", "High Road", "Expressway", "Cross Street", "Nagar", "Salai", "Junction", "Bus Stand Road", "Market Street"]
    
    for district, (lat_center, lng_center) in district_coords.items():
        for _ in range(45):  # 45 per district
            cat = random.choice(categories)
            name = f"{random.choice(prefixes)} {district} {random.choice(suffixes)}"
            address = f"Near {random.choice(['Bus Stand', 'Railway Station', 'Market', 'Hospital', 'Mall', 'College', 'Park'])}, {random.choice(street_suffixes)}, {district}"
            
            # Add slight jitter to lat/lng for realistic spread within district (~15km radius)
            lat_jitter = random.uniform(-0.15, 0.15)
            lng_jitter = random.uniform(-0.15, 0.15)
            lat = round(lat_center + lat_jitter, 4)
            lng = round(lng_center + lng_jitter, 4)

            has_rest = cat in ["REST_POINT", "SHADED_AREA"] or random.random() > 0.5
            has_washroom = cat == "WASHROOM" or random.random() > 0.5
            has_water = True
            has_charging = cat == "CHARGING" or random.random() > 0.7
            has_shade = True
            has_parking = True
            has_food = cat == "FOOD" or random.random() > 0.8
            has_medical = cat == "MEDICAL" or random.random() > 0.9

            f = Facility(
                name=name,
                category=cat,
                address=address,
                zone=district + " Zone " + str(random.randint(1, 5)),
                city=district,
                lat=lat,
                lng=lng,
                is_open=True,
                operating_hours=random.choice(["24 Hours Open", "06:00 - 23:00", "07:00 - 22:00", "05:30 - 21:00"]),
                access_type="PUBLIC",
                pricing_info=random.choice(["Free", "Free to all workers", "Standard EV rates", "Subsidized food", "Minimal maintenance fee"]),
                accessibility_info="Public area, ground level, easy access",
                has_rest=has_rest,
                has_washroom=has_washroom,
                has_water=has_water,
                has_charging=has_charging,
                has_shade=has_shade,
                has_parking=has_parking,
                has_food=has_food,
                has_medical=has_medical,
                verification_status=random.choice(["VERIFIED", "RECENTLY_REPORTED"]),
                verification_count=random.randint(5, 150),
                last_reported_at=datetime.datetime.utcnow() - datetime.timedelta(hours=random.randint(1, 72)),
                notes=f"Reliable facility in {district}. " + random.choice(["Great place for resting.", "Clean water and shade available.", "Busy during peak hours.", "Well maintained public spot.", "Good parking space for 2-wheelers."])
            )
            facilities.append(f)

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

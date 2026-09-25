import os
import sys
import random
import datetime

# Setup path so we can import from backend.app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from backend.app.database import SessionLocal
from backend.app.models import Facility

db = SessionLocal()

districts = {
    "Chennai": (13.0827, 80.2707),
    "Coimbatore": (11.0168, 76.9558),
    "Madurai": (9.9252, 78.1198),
    "Tiruchirappalli": (10.7905, 78.7047),
    "Salem": (11.6643, 78.1460),
    "Tirunelveli": (8.7139, 77.7567),
    "Erode": (11.3410, 77.7172),
    "Tiruppur": (11.1085, 77.3411),
    "Vellore": (12.9165, 79.1325),
    "Thanjavur": (10.7870, 79.1378),
    "Thoothukudi": (8.7642, 78.1348),
    "Dindigul": (10.3673, 77.9803),
    "Kanyakumari": (8.1833, 77.4119),
    "Cuddalore": (11.7480, 79.7714),
    "Kanchipuram": (12.8342, 79.7036),
    "Tiruvallur": (13.1417, 79.9071),
    "Chengalpattu": (12.6841, 79.9836),
    "Viluppuram": (11.9401, 79.4861),
    "Tiruvannamalai": (12.2253, 79.0747),
    "Krishnagiri": (12.5186, 78.2137),
    "Dharmapuri": (12.1277, 78.1582),
    "Namakkal": (11.2189, 78.1674),
    "Karur": (10.9504, 78.0833),
    "Pudukkottai": (10.3797, 78.8205),
    "Sivaganga": (9.8433, 78.4809),
    "Virudhunagar": (9.5680, 77.9624),
    "Ramanathapuram": (9.3639, 78.8320),
    "Tenkasi": (8.9592, 77.3142),
    "Nilgiris": (11.4064, 76.6932),
    "Ariyalur": (11.1400, 79.0786),
    "Perambalur": (11.2342, 78.8821),
    "Nagapattinam": (10.7656, 79.8424),
    "Tiruvarur": (10.7713, 79.6366),
    "Kallakurichi": (11.7384, 78.9639),
    "Ranipet": (12.9272, 79.3330),
    "Tirupattur": (12.4930, 78.5661),
    "Mayiladuthurai": (11.1026, 79.6521),
    "Chengalpattu": (12.6953, 79.9754)
}

facility_types = [
    ("REST_POINT", "Rest Area", "Shaded area with seating, basic amenities"),
    ("CHARGING", "EV Station", "EV swap and fast charging slots"),
    ("WASHROOM", "Public Washroom", "Clean corporation/public washrooms"),
    ("FOOD", "Amma Unavagam / Canteen", "Subsidized food and hydration"),
    ("MEDICAL", "First-Aid Point", "Medical kit, ORS, and basic pharmacy"),
    ("SHADED_AREA", "Tree Shade / Waiting Area", "Open ground with tree cover")
]

street_names = ["Main Road", "Bypass Road", "Market Street", "Railway Station Road", "Bus Stand Road", "Fort Road", "Temple Street", "Agraharam", "Cross Cut Road", "NH Highway"]
adjectives = ["Central", "Town", "Old", "New", "North", "South", "East", "West"]

facilities_to_add = []

for district, (lat_center, lng_center) in districts.items():
    # 45 points per district
    for i in range(45):
        lat = lat_center + random.uniform(-0.15, 0.15)
        lng = lng_center + random.uniform(-0.15, 0.15)
        
        f_type, f_name_suffix, f_notes = random.choice(facility_types)
        f_name = f"{random.choice(adjectives)} {district} {f_name_suffix} {i+1}"
        address = f"{random.choice(street_names)}, {district}"
        
        facility = Facility(
            name=f_name,
            category=f_type,
            address=address,
            zone=f"{district} Zone {random.randint(1,4)}",
            city=district,
            lat=lat,
            lng=lng,
            is_open=True,
            operating_hours="24 Hours Open" if random.random() > 0.3 else "06:00 - 22:00",
            access_type="PUBLIC",
            pricing_info="Free" if f_type != "FOOD" else "Subsidized Food",
            accessibility_info="Ground level accessible",
            has_rest=f_type in ["REST_POINT", "SHADED_AREA", "FOOD", "CHARGING"],
            has_washroom=f_type in ["REST_POINT", "WASHROOM"],
            has_water=True, # water everywhere
            has_charging=f_type in ["REST_POINT", "CHARGING"],
            has_shade=True,
            has_parking=True,
            has_food=f_type == "FOOD",
            has_medical=f_type == "MEDICAL",
            verification_status="VERIFIED" if random.random() > 0.2 else "RECENTLY_REPORTED",
            verification_count=random.randint(5, 150),
            last_reported_at=datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=random.randint(1, 48)),
            notes=f_notes
        )
        facilities_to_add.append(facility)

print(f"Adding {len(facilities_to_add)} facilities to the database...")

chunk_size = 200
for i in range(0, len(facilities_to_add), chunk_size):
    chunk = facilities_to_add[i:i+chunk_size]
    db.add_all(chunk)
    db.commit()

print("Successfully injected all data.")
db.close()

-- ==============================================================================
-- RESTORA — GIG-WORKER REST-POINT NETWORK
-- Supabase / PostgreSQL Schema & Initial Seed Data
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Navigate to "SQL Editor" -> "New Query"
-- 3. Paste this entire script and click "Run"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. TABLES DDL
-- ------------------------------------------------------------------------------

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(30) DEFAULT 'worker', -- 'worker' or 'admin'
    worker_category VARCHAR(50) DEFAULT 'delivery_rider', -- 'delivery_rider', 'cab_driver', 'courier_worker', 'logistics_worker', 'other'
    preferred_language VARCHAR(20) DEFAULT 'en', -- 'ta', 'en', 'hi', 'te', 'ml'
    work_area VARCHAR(120) DEFAULT 'Peelamedu, Coimbatore',
    hourly_rate_estimate DOUBLE PRECISION DEFAULT 180.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rest Facilities Table
CREATE TABLE IF NOT EXISTS facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    category VARCHAR(50) DEFAULT 'REST_POINT', -- 'REST_POINT', 'PETROL_PUMP', 'PUBLIC_REST_POINT', 'PARTNER_CAFE', 'TRANSIT_STATION', 'EV_CHARGING_HUB'
    address VARCHAR(255) NOT NULL,
    zone VARCHAR(100) DEFAULT 'Peelamedu',
    city VARCHAR(100) DEFAULT 'Coimbatore',
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    
    is_open BOOLEAN DEFAULT TRUE,
    operating_hours VARCHAR(100) DEFAULT '06:00 - 23:00',
    access_type VARCHAR(50) DEFAULT 'PUBLIC', -- 'PUBLIC', 'PRIVATE', 'PERMISSION_REQUIRED', 'RESTRICTED', 'UNKNOWN'
    pricing_info VARCHAR(100) DEFAULT 'Free to use',
    accessibility_info VARCHAR(150) DEFAULT 'Ground level, 2W accessible',

    -- Amenities Checklist
    has_rest BOOLEAN DEFAULT FALSE,
    has_washroom BOOLEAN DEFAULT FALSE,
    has_water BOOLEAN DEFAULT FALSE,
    has_charging BOOLEAN DEFAULT FALSE,
    has_shade BOOLEAN DEFAULT FALSE,
    has_parking BOOLEAN DEFAULT FALSE,
    has_food BOOLEAN DEFAULT FALSE,
    has_medical BOOLEAN DEFAULT FALSE,

    -- Verification & Status
    verification_status VARCHAR(50) DEFAULT 'VERIFIED', -- 'VERIFIED', 'RECENTLY_REPORTED', 'UNVERIFIED', 'ACCESS_UNKNOWN'
    verification_count INTEGER DEFAULT 1,
    last_reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crowdsourced Condition Reports Table
CREATE TABLE IF NOT EXISTS facility_reports (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(120) DEFAULT 'Anonymous Worker',
    report_type VARCHAR(60) NOT NULL, -- 'WATER_OUT_OF_ORDER', 'WASHROOM_DIRTY_LOCKED', 'CHARGING_NOT_WORKING', 'FACILITY_CLOSED', 'ACCESS_DENIED', 'SAFETY_CONCERN', 'INCORRECT_HOURS', 'OTHER'
    description TEXT NOT NULL,
    image_url VARCHAR(255),
    status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'FLAGGED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    review_notes VARCHAR(255)
);

-- One-Click Facility Verifications Table
CREATE TABLE IF NOT EXISTS facility_verifications (
    id SERIAL PRIMARY KEY,
    facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    washroom_ok BOOLEAN DEFAULT TRUE,
    water_ok BOOLEAN DEFAULT TRUE,
    charging_ok BOOLEAN DEFAULT TRUE,
    rest_ok BOOLEAN DEFAULT TRUE,
    notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Bookmarks Table
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id INTEGER NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, facility_id)
);

-- Voluntary Rest Break Sessions Table
CREATE TABLE IF NOT EXISTS break_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    facility_id INTEGER REFERENCES facilities(id) ON DELETE SET NULL,
    planned_duration_minutes INTEGER DEFAULT 20,
    actual_duration_minutes INTEGER,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(30) DEFAULT 'COMPLETED', -- 'PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
    notes VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Resources Table (Welfare boards, emergency lines, clinics)
CREATE TABLE IF NOT EXISTS support_resources (
    id SERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    category VARCHAR(60) DEFAULT 'WELFARE_BOARD', -- 'WELFARE_BOARD', 'EMERGENCY_CONTACT', 'CLINIC_PARTNER', 'HEALTH_GUIDELINE'
    description TEXT NOT NULL,
    contact_number VARCHAR(50),
    address VARCHAR(255),
    link_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner Offers & Subsidies Table
CREATE TABLE IF NOT EXISTS partner_offers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    partner_name VARCHAR(150) NOT NULL,
    facility_id INTEGER REFERENCES facilities(id) ON DELETE SET NULL,
    offer_type VARCHAR(60) DEFAULT 'DISCOUNT_BEVERAGE', -- 'DISCOUNT_BEVERAGE', 'FREE_CHARGING', 'REST_PARTNERSHIP', 'MEAL_SUBSIDY'
    description TEXT NOT NULL,
    terms VARCHAR(255) NOT NULL,
    valid_until VARCHAR(50) DEFAULT 'Ongoing 2026',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity Logs Table
CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    time_str VARCHAR(20) NOT NULL,
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'REST',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR HIGH-PERFORMANCE DISCOVERY & ROUTING
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_facilities_coords ON facilities (lat, lng);
CREATE INDEX IF NOT EXISTS idx_facilities_category ON facilities (category);
CREATE INDEX IF NOT EXISTS idx_facilities_open ON facilities (is_open);
CREATE INDEX IF NOT EXISTS idx_facilities_verification ON facilities (verification_status);
CREATE INDEX IF NOT EXISTS idx_facility_reports_fac ON facility_reports (facility_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks (user_id);
CREATE INDEX IF NOT EXISTS idx_break_sessions_user ON break_sessions (user_id);

-- ------------------------------------------------------------------------------
-- 4. SEED DATA
-- ------------------------------------------------------------------------------

-- Seed Users (Passwords hashed using PBKDF2-HMAC-SHA256)
-- Aadhi: Worker@123
-- Admin: Admin@123
-- Suresh: Worker@123
INSERT INTO users (id, name, email, phone, hashed_password, role, worker_category, preferred_language, work_area, hourly_rate_estimate, created_at)
VALUES 
(1, 'Aadhi', 'aadhi@restora.app', '+91 98421 77310', 'BtCrBvU2ad6CvMRl3hbmmg==$mJZmfwkzkFKGILIcRs/WKCH/Pao+vDGSpPGRw7EcPDI=', 'worker', 'delivery_rider', 'en', 'Peelamedu, Coimbatore', 180.0, NOW()),
(2, 'Admin Restora', 'admin@restora.app', '+91 98421 00001', '+DUudDCAXNjvE+kq2Stpqg==$lIttMokQPV6sL65SPDBNeblPNXHti2mCIqBT0b6zo2g=', 'admin', 'other', 'en', 'Coimbatore Central', 0.0, NOW()),
(3, 'Suresh Kumar', 'suresh@restora.app', '+91 98421 88920', 'mvmHpbVr+XZjny7o78oIdA==$2apTbPJNlpitGOejKoA+mba8O2vUd02hJn+TCzr3RFY=', 'worker', 'cab_driver', 'ta', 'Gandhipuram - Peelamedu', 220.0, NOW())
ON CONFLICT (email) DO NOTHING;

-- Reset sequence for users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Seed Facilities in Peelamedu / Coimbatore Corridors
INSERT INTO facilities (
    id, name, category, address, zone, city, lat, lng,
    is_open, operating_hours, access_type, pricing_info, accessibility_info,
    has_rest, has_washroom, has_water, has_charging, has_shade, has_parking, has_food, has_medical,
    verification_status, verification_count, last_reported_at, notes, created_by_id, created_at
) VALUES 
(
    1,
    'PSG Tech Community Rest Point',
    'REST_POINT',
    'Avinashi Road, Near PSG Tech Gate 2, Peelamedu',
    'Peelamedu',
    'Coimbatore',
    11.0285,
    77.0135,
    TRUE,
    '06:00 - 23:30',
    'PUBLIC',
    'Free to all workers',
    'Ground level, wide entryway, ramp available',
    TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE,
    'VERIFIED',
    34,
    NOW() - INTERVAL '25 minutes',
    'Dedicated gig-worker shelter. Filtered cold RO water, clean restrooms, 12 fast USB-C phone charging ports, wall fans, and shaded bike parking.',
    2,
    NOW()
),
(
    2,
    'Peelamedu Metro EV & Rider Oasis',
    'EV_CHARGING_HUB',
    'Opposite Fun Republic Mall, Avinashi Road, Peelamedu',
    'Peelamedu',
    'Coimbatore',
    11.0242,
    77.0098,
    TRUE,
    '24 Hours',
    'PUBLIC',
    'Free rest; EV swap at partner rate',
    'Wide concrete ramp, 24/7 lit facility',
    TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE,
    'VERIFIED',
    51,
    NOW() - INTERVAL '10 minutes',
    '24/7 EV 2W battery swap dock + 8 phone chargers, RO chilled water, air-conditioned worker pause room, clean washrooms, and puncture repair kit.',
    2,
    NOW()
),
(
    3,
    'HP Petrol Pump — Peelamedu Jn',
    'PETROL_PUMP',
    'Avinashi Road, Near Hope College Bus Stop, Peelamedu',
    'Peelamedu',
    'Coimbatore',
    11.0312,
    77.0165,
    TRUE,
    '24 Hours',
    'PUBLIC',
    'Free to use',
    'Drive-in bay, level asphalt, well-lit',
    TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE,
    'VERIFIED',
    28,
    NOW() - INTERVAL '1 hour',
    'Open 24/7. Corporation water cooler operational. Clean washroom behind convenience store. 4 mobile charging points inside customer lounge.',
    2,
    NOW()
),
(
    4,
    'Amma Unavagam — Hope College Hub',
    'PUBLIC_REST_POINT',
    'Near Peelamedu Police Station, Hope College, Avinashi Rd',
    'Peelamedu',
    'Coimbatore',
    11.0331,
    77.0182,
    TRUE,
    '07:00 - 19:30',
    'PUBLIC',
    'Meals at Rs 1-5; water & rest free',
    'Ground level, paved walkway, sheltered veranda',
    TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, FALSE,
    'VERIFIED',
    42,
    NOW() - INTERVAL '4 hours',
    'Nutritious subsidized meals (Rs 1 idli, Rs 5 variety rice). Shaded veranda seating for up to 30 delivery partners. Free RO drinking water dispenser.',
    2,
    NOW()
),
(
    5,
    'TIDEL Park Delivery Hub Rest Area',
    'REST_POINT',
    'Civil Aerodrome Post, Near TIDEL Park Phase 1, Peelamedu',
    'Peelamedu',
    'Coimbatore',
    11.0298,
    77.0285,
    TRUE,
    '08:00 - 23:00',
    'PUBLIC',
    'Free entry for all delivery partners',
    'Paved ramp, security-manned gate, covered bay',
    TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE,
    'VERIFIED',
    19,
    NOW() - INTERVAL '2 hours',
    'Dedicated logistics driver pavilion built by district admin. 16 charging points, RO dispenser, shaded two-wheeler parking lot for 80 bikes.',
    2,
    NOW()
),
(
    6,
    'Chai Point & Rider Pitstop — Nava India',
    'PARTNER_CAFE',
    'Avinashi Road, Near Nava India Signal, Peelamedu West',
    'Peelamedu',
    'Coimbatore',
    11.0189,
    76.9942,
    TRUE,
    '06:30 - 01:00',
    'PERMISSION_REQUIRED',
    'Free rest & water; 20% discount on chai',
    'Ground level, sheltered outdoor seating benches',
    TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE,
    'VERIFIED',
    14,
    NOW() - INTERVAL '3 hours',
    'Partner tea vendor welcoming gig workers. Clean restroom available with delivery bag or uniform. Free filtered water bottle refills.',
    2,
    NOW()
),
(
    7,
    'Peelamedu Railway Crossing Shade Spot',
    'REST_POINT',
    'Near Peelamedu Railway Station Approach, Peelamedu East',
    'Peelamedu',
    'Coimbatore',
    11.0365,
    77.0092,
    TRUE,
    '06:00 - 22:00',
    'PUBLIC',
    'Free',
    'Ground level, tree-lined quiet area',
    TRUE, FALSE, TRUE, FALSE, TRUE, TRUE, FALSE, FALSE,
    'RECENTLY_REPORTED',
    6,
    NOW() - INTERVAL '1 day',
    'Large banyan tree shade canopy with granite benches. Hand-pump clean water nearby. Note: No restroom on-site.',
    2,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for facilities
SELECT setval('facilities_id_seq', (SELECT MAX(id) FROM facilities));

-- Seed Support Resources
INSERT INTO support_resources (id, title, category, description, contact_number, address, link_url, is_verified, created_at)
VALUES 
(
    1,
    'Tamil Nadu Gig Workers Welfare Board',
    'WELFARE_BOARD',
    'State government registration portal for non-formal delivery, cab, and logistics personnel. Eligible for accidental insurance up to Rs 5,00,000, medical assistance, and children educational assistance.',
    '044-24330055',
    'Labour Welfare Department, Collectorate Complex, Coimbatore',
    'https://labour.tn.gov.in',
    TRUE,
    NOW()
),
(
    2,
    '108 Emergency Ambulance & Heatstroke Hotline',
    'EMERGENCY_CONTACT',
    '24/7 dedicated state medical response dispatch. Instant emergency ambulance dispatch for road accidents, severe dehydration, or chest pain.',
    '108',
    'State Emergency Response Service, Tamil Nadu',
    'https://108.tn.gov.in',
    TRUE,
    NOW()
),
(
    3,
    'Peelamedu Community Health Center (CHC)',
    'CLINIC_PARTNER',
    'Government primary health center offering free outpatient checkups, emergency first-aid dressings, ORS electrolyte sachets, and tetanus toxoid (TT) injections for road accident injuries.',
    '0422-2571234',
    'Near Peelamedu Bus Stand, Avinashi Road, Coimbatore',
    'https://health.tn.gov.in',
    TRUE,
    NOW()
),
(
    4,
    'Summer Hydration & Heatstroke Protocol',
    'HEALTH_GUIDELINE',
    'Recommended protocol for riders: Consume 500ml water every 90 minutes. Take 15-minute rest breaks in shade when outdoor temperature exceeds 37 deg C. Restora breaks are private and do not affect platform dispatch.',
    NULL,
    'National Institute of Occupational Health Guidelines',
    'https://mohfw.gov.in',
    TRUE,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for support resources
SELECT setval('support_resources_id_seq', (SELECT MAX(id) FROM support_resources));

-- Seed Partner Offers
INSERT INTO partner_offers (id, title, partner_name, facility_id, offer_type, description, terms, valid_until, is_active, created_at)
VALUES 
(
    1,
    'Rs 10 Chilled Lemon Tea / Hot Masala Chai',
    'Chai Point Nava India',
    6,
    'DISCOUNT_BEVERAGE',
    'Special 40% discount on fresh tea and lime soda for all food and parcel delivery workers carrying courier bags.',
    'Show your active partner app (Zomato/Swiggy/Zepto/Uber) at counter',
    'Valid through Dec 2026',
    TRUE,
    NOW()
),
(
    2,
    'Free 30-Min Fast Phone Charge & Water Refill',
    'Peelamedu Metro EV Hub',
    2,
    'FREE_CHARGING',
    'Complimentary high-speed charging dock access and cold electrolyte water refill in air-conditioned lounge.',
    'Open to all verified delivery and transport workers',
    'Ongoing 2026',
    TRUE,
    NOW()
),
(
    3,
    'Rs 5 Fresh Nutritious Lunch Rice Pack',
    'Amma Unavagam Hope College',
    4,
    'MEAL_SUBSIDY',
    'Subsidized hygienic hot meals: Sambar rice (Rs 5), Curd rice (Rs 3), Lemon rice (Rs 5). Clean drinking water included.',
    'Available daily 11:30 AM to 03:00 PM',
    'Permanent government program',
    TRUE,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence for partner offers
SELECT setval('partner_offers_id_seq', (SELECT MAX(id) FROM partner_offers));

-- Seed Community Reports
INSERT INTO facility_reports (id, facility_id, user_id, user_name, report_type, description, image_url, status, created_at, reviewed_by_id, review_notes)
VALUES 
(
    1,
    3,
    1,
    'Aadhi',
    'WATER_OUT_OF_ORDER',
    'Cold water dispenser tap was dripping slow around 2 PM. Pump staff notified and they refilled the 20L can.',
    NULL,
    'APPROVED',
    NOW() - INTERVAL '2 days',
    2,
    'Verified by Restora administrator; water dispenser restored'
),
(
    2,
    7,
    3,
    'Suresh Kumar',
    'WASHROOM_DIRTY_LOCKED',
    'No washroom facility available near the railway crossing benches. Best to use HP pump 500m away.',
    NULL,
    'APPROVED',
    NOW() - INTERVAL '1 day',
    2,
    'Updated facility details to reflect no on-site washroom'
)
ON CONFLICT (id) DO NOTHING;

SELECT setval('facility_reports_id_seq', (SELECT MAX(id) FROM facility_reports));

-- Seed Break Sessions
INSERT INTO break_sessions (id, user_id, facility_id, planned_duration_minutes, actual_duration_minutes, start_time, end_time, status, notes, created_at)
VALUES 
(
    1,
    1,
    1,
    15,
    15,
    NOW() - INTERVAL '3 hours',
    NOW() - INTERVAL '2 hours 45 minutes',
    'COMPLETED',
    'Hydrated and charged phone from 24% to 65% after 5 deliveries.',
    NOW() - INTERVAL '3 hours'
),
(
    2,
    1,
    2,
    20,
    20,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '23 hours 40 minutes',
    'COMPLETED',
    'Swapped EV battery and took afternoon shade break.',
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

SELECT setval('break_sessions_id_seq', (SELECT MAX(id) FROM break_sessions));

-- Seed Bookmarks
INSERT INTO bookmarks (user_id, facility_id, created_at)
VALUES 
(1, 1, NOW()),
(1, 2, NOW())
ON CONFLICT (user_id, facility_id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES (OPTIONAL FOR FRONTEND DIRECT ACCESS)
-- ------------------------------------------------------------------------------
-- If using FastAPI backend as proxy: RLS can remain default (FastAPI connects as postgres superuser/service role).
-- If connecting directly from Supabase JS client in frontend, enable RLS:
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public facilities are viewable by everyone" ON facilities FOR SELECT USING (true);

ALTER TABLE support_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public support resources viewable by everyone" ON support_resources FOR SELECT USING (true);

ALTER TABLE partner_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public partner offers viewable by everyone" ON partner_offers FOR SELECT USING (true);

-- Done!

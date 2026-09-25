# Restora — Gig-Worker Rest-Point Network

> **Dignified Rest, Hydration & Safety for India's Gig Workforce**  
> *A production-structured full-stack platform connecting food delivery riders, cab drivers, and logistics field workers to verified rest facilities across urban corridors.*

---

## 1. Project Overview & Problem Statement

Millions of platform gig workers (Zomato, Swiggy, Zepto, Blinkit, Rapido, Uber delivery partners and cab drivers) power India's urban logistics. Every day, they face severe operational challenges:
* **Exhausting 10–14 Hour Shifts:** Long hours under intense sun (38°C–44°C) with no access to shade.
* **Denial of Washroom Access:** Commercial buildings and upscale restaurants frequently prohibit delivery workers from using their restrooms.
* **Unreliable Drinking Water:** Public dispensers are often broken, dry, or locked behind restricted gates.
* **Battery & EV Anxiety:** Rapid phone battery drain and low scooter charge with no corridor charging infrastructure.
* **Fatigue & Road Accidents:** The pressure to maintain continuous delivery runs leads to extreme fatigue, dehydration, and increased accident risk.

**Restora** solves this by establishing a community-verified, rest-aware urban infrastructure platform where gig workers can discover, evaluate, report, and navigate to verified rest points with clean washrooms, free drinking water, device/EV charging, shade, and parking.

---

## 2. System Architecture

Restora is architected as a robust full-stack web application:

```
                            RESTORA ECOSYSTEM
                                    │
    ┌───────────────────────────────┴───────────────────────────────┐
    ▼                                                               ▼
FRONTEND (Vite + React + TS)                             BACKEND (FastAPI + SQLite)
 • Mobile & Desktop Responsive Layout                    • SQLite Database (`restora.db`)
 • Interactive Road Corridor Canvas Map                  • PBKDF2 Password Hashing & HS256 JWT
 • Multi-Criteria Amenity & Category Filters             • Haversine & Vector Detour Service
 • Detour-Aware Route Planning                           • Explainable Multi-Factor Scoring
 • Voluntary Break Planner & Impact Estimator            • Crowdsourced Report Moderation Engine
 • Community Moderation & Service Gap Analytics          • Static Web Asset Serving from Root `/`
```

### Persistence & Database (`restora.db`)
* Real SQLite relational database storing `User`, `Facility`, `FacilityReport`, `FacilityVerification`, `Bookmark`, `BreakSession`, `SupportResource`, `PartnerOffer`, and `ActivityLog`.
* Seeded with 7 detailed rest points along the Avinashi Road and Peelamedu arterial corridor in Coimbatore, Tamil Nadu.

---

## 3. The 7 Core Modules

### Module A — Worker Authentication & Profile
* JWT-based authentication with role-based access control (`worker` vs `admin`).
* Profile attributes tailored to field work:
  * Worker Category: Delivery Rider, Cab Driver, Courier Worker, Logistics Worker, Other Field Worker.
  * Preferred Language: Tamil (தமிழ்), English, Hindi (हिंदी), Telugu (తెలుగు), Malayalam (മലയാളം).
  * Work Area: e.g. Peelamedu, Hope College, Gandhipuram, Coimbatore.
  * Hourly Rate Estimate: Used for illustrative personal break downtime calculations.

### Module B — Rest-Point Discovery
* Multi-criteria search and filter engine:
  * Filter by category: Petrol Pumps, Public Rest Points, Verified Partner Cafes, Transit Terminals, EV Hubs.
  * Filter by amenities: Drinking Water, Washroom, Charging Point, Seating Benches, Canopy Shade, Bike Parking, First Aid, Food.
  * Filter by access policy: Public, Private / Partner, Permission Required.
  * Verification state badges: `VERIFIED`, `RECENTLY_REPORTED`, `UNVERIFIED`.
  * Real-time distance calculation from worker's GPS coordinates.

### Module C — Intelligent Rest-Point Recommendation
* Algorithmic recommendation engine considering proximity, amenity coverage, verified operational status, and recency of reports.
* **Explainable Rationale:** Every recommendation returns an explicit, human-readable reason (e.g., *"Recommended (94.7/100) because it is 397m away, matches your requested Water and Washroom, and has verified status"*). No black-box or fake ML scores.

### Module D — Rest-Aware Route Planning
* Designed for delivery riders traveling between pickup and delivery destinations:
  * Calculates straight-line distance, corridor bounding projection, and detour kilometers.
  * Allows workers to set custom detour tolerance (0.5 km to 3.0 km).
  * Recommends optimal rest stops along the corridor with matched amenities.
  * **Algorithmic Honesty:** Clarifies that detour kilometers are calculated geometrically based on the route projection vector.

### Module E — Crowdsourced Facility Reporting & Moderation
* Workers can submit condition updates in seconds:
  * Issue types: Water Out of Order, Washroom Locked/Dirty, Charging Broken, Facility Closed, Access Denied to Workers, Safety Hazard.
  * Photo proof URL and description.
* **Admin Moderation:** Reports are reviewed (`APPROVED`, `REJECTED`, `FLAGGED`). Approving a report automatically updates the facility's live status.

### Module F — Income Protection & Break Downtime Support
* **Voluntary Break Session Tracker:**
  * Workers can plan and log 10, 15, 20, 30, or 45-minute rest breaks.
  * Active break timer with one-tap completion.
* **Illustrative Personal Income Impact Estimator:**
  * Calculates theoretical opportunity cost based on personal hourly earnings.
  * **Ethical Safeguards:** Explicitly emphasizes that rest breaks are voluntary personal health choices. Restora never transmits break durations to platform dispatch algorithms or penalizes workers. Taking shade breaks prevents heatstroke and reduces accident risk.

### Module G — Admin Management Dashboard & Service Gaps
* System metrics: Total rest points, verified count, pending reports, total breaks logged, active users.
* Facility CRUD: Create new facilities, edit details, or remove decommissioned points.
* Crowdsourced report moderation queue with notes.
* **Service Gap Analytics:** Visualizes urban zones with high delivery density but missing shade, public washrooms, or EV charging.

---

## 4. Quick Demo Accounts

Pre-seeded credentials for immediate evaluation:

| Role | Name | Email | Password | Primary Work Area |
| :--- | :--- | :--- | :--- | :--- |
| **Delivery Rider** | Aadhi Narayanan | `aadhi@restora.app` | `Worker@123` | Peelamedu, Coimbatore |
| **Cab Driver** | Suresh Kumar | `suresh@restora.app` | `Worker@123` | Coimbatore Central |
| **Platform Admin** | Restora Admin | `admin@restora.app` | `Admin@123` | Platform Operations |

---

## 5. Running the Application

### Option 1: Full-Stack Dev Server with Live HMR (Recommended)
Launches both the FastAPI backend and Vite frontend concurrently:

```bash
npm run dev:all
```
*or directly:*
```bash
python dev_all.py
```

* **Frontend Live Dev (HMR):** [http://localhost:5173](http://localhost:5173)
* **Backend API & Web UI:** [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc API Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Option 2: Unified Production-Mode Server
Launches the FastAPI backend serving both REST APIs and the production-built React web bundle on a single port:

```bash
python run_dev.py
```
* **Full-Stack App:** [http://localhost:8000](http://localhost:8000)

### Option 3: Running Services Individually
```bash
# Backend only:
npm run dev:backend    # or: python run_dev.py

# Frontend only:
npm run dev:frontend   # or: cd frontend && npm run dev
```

---

## 6. Testing & Verification

### Running the Backend Automated Test Suite
```bash
python -m pytest backend/tests/test_api.py -v
```
*Executes all 9 comprehensive test suites: Authentication, Facility CRUD, Intelligent Recommendations, Route Planning, Reporting & Moderation, Breaks & Income Estimator, Bookmarks, Support Resources, and Admin Overview.*

### Running E2E Full-Stack Verification
```bash
python verify_fullstack.py
```
*Verifies static HTML serving, API status, database persistence, recommendation engine, route corridors, and income estimator safeguards.*

---

## 7. REST API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/status` | System health and module inventory | No |
| `POST` | `/api/auth/register` | Register new worker with category & area | No |
| `POST` | `/api/auth/login` | Sign in and obtain JWT token | No |
| `GET` | `/api/auth/me` | Current authenticated worker profile | Yes |
| `PATCH` | `/api/auth/profile` | Update profile settings | Yes |
| `GET` | `/api/facilities` | List & filter facilities by service/category | No |
| `GET` | `/api/facilities/{id}` | Facility details with distance & verifications | No |
| `POST` | `/api/facilities` | Create new rest facility | Admin |
| `PATCH` | `/api/facilities/{id}` | Update rest facility details | Admin |
| `DELETE`| `/api/facilities/{id}` | Delete rest facility | Admin |
| `POST` | `/api/facilities/verify` | One-click community facility verification | Yes |
| `POST` | `/api/recommendations/intelligent` | Multi-factor scored rest-point recommendations | No |
| `POST` | `/api/routes/plan` | Corridor detour-aware route planner | No |
| `POST` | `/api/reports` | Submit crowdsourced condition report | Yes |
| `GET` | `/api/reports` | List reports (filter by facility or status) | No |
| `POST` | `/api/reports/{id}/moderate` | Moderate report (Approve / Reject) | Admin |
| `POST` | `/api/breaks` | Log planned or active break session | Yes |
| `GET` | `/api/breaks` | Worker break session history | Yes |
| `PATCH` | `/api/breaks/{id}` | Complete or update break status | Yes |
| `POST` | `/api/breaks/estimate-impact` | Illustrative personal income impact estimator | No |
| `POST` | `/api/bookmarks/{id}` | Toggle facility bookmark | Yes |
| `GET` | `/api/bookmarks` | List worker's bookmarked rest facilities | Yes |
| `GET` | `/api/support-resources` | Welfare boards, clinics & emergency helplines | No |
| `GET` | `/api/partner-offers` | Subsidized meals, tea & charging offers | No |
| `GET` | `/api/admin/overview` | Platform metrics & corridor service gaps | Admin |

---

## 8. License & Ethical Disclaimer

Restora is developed to uphold the safety, health, and constitutional dignity of gig delivery workers and drivers.
* Break durations and income estimates are personal tools for workers and **do not constitute platform performance metrics or wage guarantees**.
* Restora never shares worker resting durations or location history with gig platform dispatch algorithms.

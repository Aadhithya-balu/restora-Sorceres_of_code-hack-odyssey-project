import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_status():
    res = client.get("/api/status")
    assert res.status_code == 200
    data = res.json()
    assert data["platform"] == "Restora"
    assert "Gig-Worker Rest-Point Network" in data["official_title"]

def test_authentication_and_profile():
    import time
    unique_email = f"worker_{time.time_ns()}@restora.app"
    reg_payload = {
        "name": "Karthik Raja",
        "email": unique_email,
        "phone": "+91 98421 99999",
        "password": "Password@123",
        "worker_category": "delivery_rider",
        "preferred_language": "en",
        "work_area": "Peelamedu, Coimbatore"
    }
    res_reg = client.post("/api/auth/register", json=reg_payload)
    assert res_reg.status_code == 200
    reg_data = res_reg.json()
    assert "access_token" in reg_data
    token = reg_data["access_token"]
    assert reg_data["user"]["name"] == "Karthik Raja"

    # 2. Login
    res_login = client.post("/api/auth/login", json={
        "email": unique_email,
        "password": "Password@123"
    })
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()

    # 3. Get profile (/me)
    headers = {"Authorization": f"Bearer {token}"}
    res_me = client.get("/api/auth/me", headers=headers)
    assert res_me.status_code == 200
    assert res_me.json()["email"] == unique_email

    # 4. Update profile
    res_up = client.patch("/api/auth/profile", json={"preferred_language": "ta"}, headers=headers)
    assert res_up.status_code == 200
    assert res_up.json()["preferred_language"] == "ta"

def test_facility_discovery_and_crud():
    # 1. Login as default admin
    res_adm = client.post("/api/auth/login", json={"email": "admin@restora.app", "password": "Admin@123"})
    admin_token = res_adm.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 2. Login as worker
    res_w = client.post("/api/auth/login", json={"email": "aadhi@restora.app", "password": "Worker@123"})
    worker_token = res_w.json()["access_token"]
    worker_headers = {"Authorization": f"Bearer {worker_token}"}

    # 3. List facilities
    res_facs = client.get("/api/facilities")
    assert res_facs.status_code == 200
    facs = res_facs.json()
    assert len(facs) >= 5

    # 4. Filter by service
    res_water = client.get("/api/facilities?service=WATER")
    assert res_water.status_code == 200
    for f in res_water.json():
        assert f["has_water"] is True

    # 5. Create new facility
    new_fac_payload = {
        "name": "Peelamedu North Rider Station",
        "category": "REST_POINT",
        "address": "Avinashi Road, Near PSG IM, Peelamedu",
        "zone": "Peelamedu",
        "city": "Coimbatore",
        "lat": 11.0295,
        "lng": 77.0150,
        "is_open": True,
        "operating_hours": "06:00 - 23:00",
        "access_type": "PUBLIC",
        "pricing_info": "Free",
        "has_rest": True,
        "has_washroom": True,
        "has_water": True,
        "has_charging": True
    }
    res_create = client.post("/api/facilities", json=new_fac_payload, headers=worker_headers)
    assert res_create.status_code == 201
    created_id = res_create.json()["id"]

    # 6. Update facility
    res_patch = client.patch(f"/api/facilities/{created_id}", json={"pricing_info": "Free community spot"}, headers=worker_headers)
    assert res_patch.status_code == 200
    assert res_patch.json()["pricing_info"] == "Free community spot"

    # 7. Verify facility
    res_verif = client.post("/api/facilities/verify", json={
        "facility_id": created_id,
        "washroom_ok": True,
        "water_ok": True,
        "charging_ok": True,
        "rest_ok": True,
        "notes": "Verified working fine"
    }, headers=worker_headers)
    assert res_verif.status_code == 200

    # 8. Delete facility (admin only)
    res_del = client.delete(f"/api/facilities/{created_id}", headers=admin_headers)
    assert res_del.status_code == 200

def test_intelligent_recommendation():
    payload = {
        "lat": 11.0267,
        "lng": 77.0118,
        "need_water": True,
        "need_washroom": True,
        "need_charging": True,
        "max_distance_meters": 3000
    }
    res = client.post("/api/recommendations/intelligent", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_found"] > 0
    top = data["recommendations"][0]
    assert top["score"] > 0
    assert "Recommended" in top["explanation"]

def test_route_planning():
    payload = {
        "origin_name": "Gandhipuram Central Bus Stand",
        "origin_lat": 11.0168,
        "origin_lng": 76.9656,
        "destination_name": "Codissia Trade Center",
        "destination_lat": 11.0335,
        "destination_lng": 77.0295,
        "required_services": ["Water", "Washroom"],
        "max_detour_km": 2.0
    }
    res = client.post("/api/routes/plan", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["total_route_distance_km"] > 0
    assert data["nearby_facilities_count"] > 0
    assert len(data["facilities"]) > 0
    assert "corridor" in data["disclaimer"].lower()

def test_crowdsourced_reporting_and_moderation():
    # Login worker & admin
    res_w = client.post("/api/auth/login", json={"email": "aadhi@restora.app", "password": "Worker@123"})
    w_headers = {"Authorization": f"Bearer {res_w.json()['access_token']}"}

    res_a = client.post("/api/auth/login", json={"email": "admin@restora.app", "password": "Admin@123"})
    a_headers = {"Authorization": f"Bearer {res_a.json()['access_token']}"}

    # 1. Submit report
    rep_payload = {
        "facility_id": 1,
        "report_type": "CLEANLINESS_CONCERN",
        "description": "Floor washroom needs water top-up and cleaning"
    }
    res_rep = client.post("/api/reports", json=rep_payload, headers=w_headers)
    assert res_rep.status_code == 201
    rep_id = res_rep.json()["id"]

    # 2. Get reports
    res_list = client.get("/api/reports?facility_id=1")
    assert res_list.status_code == 200
    assert any(r["id"] == rep_id for r in res_list.json())

    # 3. Moderate report (admin only)
    mod_payload = {
        "status": "APPROVED",
        "review_notes": "Noted by field staff and cleaned"
    }
    res_mod = client.post(f"/api/reports/{rep_id}/moderate", json=mod_payload, headers=a_headers)
    assert res_mod.status_code == 200
    assert res_mod.json()["status"] == "APPROVED"

def test_break_planning_and_income_estimator():
    res_w = client.post("/api/auth/login", json={"email": "aadhi@restora.app", "password": "Worker@123"})
    w_headers = {"Authorization": f"Bearer {res_w.json()['access_token']}"}

    # 1. Create break session
    res_brk = client.post("/api/breaks", json={
        "facility_id": 1,
        "planned_duration_minutes": 20,
        "notes": "Afternoon hydration break"
    }, headers=w_headers)
    assert res_brk.status_code == 201
    brk_id = res_brk.json()["id"]

    # 2. List breaks
    res_list = client.get("/api/breaks", headers=w_headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) > 0

    # 3. Update break session (mark completed)
    res_patch = client.patch(f"/api/breaks/{brk_id}", json={
        "status": "COMPLETED",
        "actual_duration_minutes": 18
    }, headers=w_headers)
    assert res_patch.status_code == 200

    # 4. Income impact estimator
    res_est = client.post("/api/breaks/estimate-impact", json={
        "hourly_rate_estimate": 180.0,
        "planned_break_minutes": 20
    })
    assert res_est.status_code == 200
    est_data = res_est.json()
    assert est_data["estimated_opportunity_amount"] == 60.0
    assert "illustrative" in est_data["disclaimer"].lower()

def test_bookmarks():
    res_w = client.post("/api/auth/login", json={"email": "aadhi@restora.app", "password": "Worker@123"})
    w_headers = {"Authorization": f"Bearer {res_w.json()['access_token']}"}

    # Toggle bookmark on facility 3
    res_bm = client.post("/api/bookmarks/3", headers=w_headers)
    assert res_bm.status_code == 200
    assert "bookmarked" in res_bm.json()

    # List bookmarks
    res_list = client.get("/api/bookmarks", headers=w_headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) > 0

def test_support_resources_and_admin_overview():
    res_a = client.post("/api/auth/login", json={"email": "admin@restora.app", "password": "Admin@123"})
    a_headers = {"Authorization": f"Bearer {res_a.json()['access_token']}"}

    # 1. Get support resources
    res_res = client.get("/api/support-resources")
    assert res_res.status_code == 200
    assert len(res_res.json()) >= 3

    # 2. Get partner offers
    res_off = client.get("/api/partner-offers")
    assert res_off.status_code == 200
    assert len(res_off.json()) >= 2

    # 3. Admin overview stats
    res_ov = client.get("/api/admin/overview", headers=a_headers)
    assert res_ov.status_code == 200
    ov_data = res_ov.json()
    assert ov_data["total_facilities"] >= 5
    assert len(ov_data["service_gaps"]) > 0

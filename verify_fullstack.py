"""
Quick E2E verification script for Restora
Tests that FastAPI serves the React web application bundle and all REST API endpoints.
"""
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_fullstack_flow():
    print("[1] Testing static web app serving from root '/'...")
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert "<title>" in res_root.text or "Restora" in res_root.text or "html" in res_root.text
    print("    => Root HTML served successfully!")

    print("[2] Testing API status '/api/status'...")
    res_status = client.get("/api/status")
    assert res_status.status_code == 200
    data = res_status.json()
    assert data["platform"] == "Restora"
    assert "Restora — Gig-Worker Rest-Point Network" in data["official_title"]
    print(f"    => Status operational: {data['platform']} ({len(data['modules'])} modules)")

    print("[3] Testing facilities retrieval '/api/facilities'...")
    res_facs = client.get("/api/facilities?lat=11.0267&lng=77.0118")
    assert res_facs.status_code == 200
    facs = res_facs.json()
    assert len(facs) >= 7
    print(f"    => Retrieved {len(facs)} rest-points in Peelamedu!")

    print("[4] Testing intelligent recommendations '/api/recommendations/intelligent'...")
    res_rec = client.post("/api/recommendations/intelligent", json={
        "lat": 11.0267,
        "lng": 77.0118,
        "need_water": True,
        "need_washroom": True
    })
    assert res_rec.status_code == 200
    recs = res_rec.json()["recommendations"]
    assert len(recs) > 0
    print(f"    => Recommendation engine returned {len(recs)} scored candidates!")
    print(f"       Top candidate: {recs[0]['facility']['name']} (Explanation: {recs[0]['explanation']})")

    print("[5] Testing route planning corridor analysis '/api/routes/plan'...")
    res_route = client.post("/api/routes/plan", json={
        "origin_name": "Gandhipuram",
        "origin_lat": 11.0168,
        "origin_lng": 76.9676,
        "destination_name": "TIDEL Park",
        "destination_lat": 11.0289,
        "destination_lng": 77.0274,
        "max_detour_km": 1.5,
        "required_services": ["water"]
    })
    assert res_route.status_code == 200
    route_data = res_route.json()
    assert len(route_data["facilities"]) > 0
    print(f"    => Route corridor matched {len(route_data['facilities'])} rest facilities!")
    print(f"       Detour estimate for stop 1: {route_data['facilities'][0]['estimated_corridor_detour_km']:.2f} km")

    print("[6] Testing personal income impact estimator '/api/breaks/estimate-impact'...")
    res_impact = client.post("/api/breaks/estimate-impact", json={
        "hourly_rate_estimate": 120,
        "planned_break_minutes": 20
    })
    assert res_impact.status_code == 200
    impact = res_impact.json()
    assert impact["estimated_opportunity_amount"] == 40
    assert "disclaimer" in impact
    print(f"    => Income impact estimated: INR {impact['estimated_opportunity_amount']} with ethical safeguards!")

    print("\nALL RESTORA E2E INTEGRATION CHECKS PASSED PERFECTLY!\n")

if __name__ == "__main__":
    test_fullstack_flow()

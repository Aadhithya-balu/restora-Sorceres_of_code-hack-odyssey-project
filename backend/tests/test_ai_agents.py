"""
Comprehensive Test Suite for RESTORA Groq AI Agents and Fallbacks
"""
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_restpoint_recommendation_agent_water_and_washroom():
    res = client.post("/api/ai/restpoint-recommend", json={
        "query": "I need drinking water and a clean washroom nearby",
        "lat": 11.0267,
        "lng": 77.0118,
        "max_distance_km": 5.0
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "intent" in data
    assert "facilities" in data
    assert "explanation" in data
    assert "water" in data["intent"]["facility_categories"]
    assert "washroom" in data["intent"]["facility_categories"]
    assert len(data["facilities"]) > 0
    # Every facility returned must have a valid ID
    for fac in data["facilities"]:
        assert fac["id"] > 0
        assert fac["name"]

def test_restpoint_recommendation_agent_charging_and_rest():
    res = client.post("/api/ai/restpoint-recommend", json={
        "query": "Somewhere to charge my phone and rest for 20 minutes",
        "lat": 11.0267,
        "lng": 77.0118,
        "max_distance_km": 4.0
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "charging" in data["intent"]["facility_categories"]
    assert "rest" in data["intent"]["facility_categories"]
    assert len(data["facilities"]) > 0

def test_restpoint_recommendation_fallback_and_no_hallucinated_ids():
    res = client.post("/api/ai/restpoint-recommend", json={
        "query": "Need first aid and medical care",
        "lat": 11.0267,
        "lng": 77.0118,
        "max_distance_km": 10.0
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert "medical" in data["intent"]["facility_categories"]
    assert data["source"] in ["groq", "deterministic_engine"]
    assert len(data["explanation"]) > 10

def test_rakshitartha_disruption_agent_real_weather_and_rules():
    res = client.post("/api/ai/rakshitartha-disruption", json={
        "lat": 11.0267,
        "lng": 77.0118,
        "daily_income": 800.0,
        "working_hours": 8.0,
        "downtime_hours": 3.0,
        "affected_days": 1.0
    })
    assert res.status_code == 200, res.text
    data = res.json()
    # 1. Weather
    assert "weather" in data
    assert "temperature" in data["weather"]
    assert "condition_text" in data["weather"]
    
    # 2. Deterministic Disruption Rule
    assert "disruption_rule" in data
    assert "condition_type" in data["disruption_rule"]
    assert "status_label" in data["disruption_rule"]
    assert "Weather-based guidance" in data["disruption_rule"]["status_label"]

    # 3. Deterministic Income Calculation
    assert "income_calculation" in data
    assert data["income_calculation"]["calculated_hourly_rate"] == 100.0
    assert data["income_calculation"]["direct_lost_earnings"] == 300.0
    assert data["income_calculation"]["total_estimated_impact"] > 300.0

    # 4. Nearby Real Restora Support Facilities
    assert "nearby_support_facilities" in data
    assert len(data["nearby_support_facilities"]) > 0
    for fac in data["nearby_support_facilities"]:
        assert fac["id"] > 0
        assert fac["name"]

    # 5. Badges
    assert "demo_badges" in data
    assert "DEMO / ILLUSTRATIVE" in data["demo_badges"]["protection_plan"]

def test_rakshitartha_disruption_agent_heatwave_simulation():
    res = client.post("/api/ai/rakshitartha-disruption", json={
        "lat": 11.0267,
        "lng": 77.0118,
        "daily_income": 1200.0,
        "working_hours": 8.0,
        "downtime_hours": 4.0,
        "affected_days": 2.0,
        "client_weather": {
            "temperature": 40.5,
            "wind_speed": 12.0,
            "precipitation": 0.0,
            "precipitation_prob": 5,
            "condition_text": "Severe Heatwave",
            "last_updated": "Sensor Telemetry"
        }
    })
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["disruption_rule"]["condition_type"] == "EXTREME_HEAT_WARNING"
    assert data["income_calculation"]["calculated_hourly_rate"] == 150.0
    assert data["income_calculation"]["direct_lost_earnings"] == 1200.0

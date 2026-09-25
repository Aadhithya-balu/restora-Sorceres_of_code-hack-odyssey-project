import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import engine, Base, SessionLocal
from .seed_data import seed_database
from .routers import (
    auth, facilities, recommendations, routes, reports, breaks, support, admin
)

# Initialize database schema
Base.metadata.create_all(bind=engine)

# Seed initial data
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title="Restora API — Gig-Worker Rest-Point Network",
    description="Full-stack API providing rest-point discovery, crowdsourced reporting, intelligent recommendations, route planning, break scheduling, and worker support.",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register REST API routers
app.include_router(auth.router)
app.include_router(facilities.router)
app.include_router(recommendations.router)
app.include_router(routes.router)
app.include_router(reports.router)
app.include_router(breaks.router)
app.include_router(support.router)
app.include_router(admin.router)

@app.get("/api/status")
def get_status():
    return {
        "platform": "Restora",
        "official_title": "Restora — Gig-Worker Rest-Point Network",
        "tagline": "Discover, evaluate, and contribute to worker rest facilities across the city.",
        "status": "OPERATIONAL",
        "modules": [
            "Module A: Worker Authentication and Profile",
            "Module B: Rest-Point Discovery",
            "Module C: Intelligent Rest-Point Recommendation",
            "Module D: Rest-Aware Route Planning",
            "Module E: Crowdsourced Facility Reporting & Moderation",
            "Module F: Income Protection & Break Downtime Support",
            "Module G: Admin Management Dashboard"
        ],
        "version": "1.0.0"
    }

# Mount static frontend build if dist folder exists in frontend
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

"""
Restora Dev Server Runner
Launches the FastAPI backend and serves both the REST API and the built Restora full-stack web UI.
"""
import sys
import os
import uvicorn

if __name__ == "__main__":
    print("=" * 70)
    print("  RESTORA — GIG-WORKER REST-POINT NETWORK")
    print("  Dignified Rest, Hydration & Safety for India's Gig Workforce")
    print("=" * 70)
    print("  Full-Stack Web App:        http://localhost:8000")
    print("  Interactive Swagger Docs:  http://localhost:8000/docs")
    print("  ReDoc Documentation:       http://localhost:8000/redoc")
    print("-" * 70)
    print("  Demo Worker (Rider):       aadhi@restora.app  / Worker@123")
    print("  Demo Worker (Cab Driver):  suresh@restora.app / Worker@123")
    print("  Platform Administrator:    admin@restora.app  / Admin@123")
    print("=" * 70)
    
    # Run uvicorn server
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

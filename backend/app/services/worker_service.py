from sqlalchemy.orm import Session
from ..models import WorkerProfile, ActivityLog

class WorkerService:
    @staticmethod
    def get_profile(db: Session, worker_id: int = 1) -> WorkerProfile:
        return db.query(WorkerProfile).filter(WorkerProfile.id == worker_id).first()

    @staticmethod
    def toggle_shift(db: Session, worker_id: int = 1) -> dict:
        worker = db.query(WorkerProfile).filter(WorkerProfile.id == worker_id).first()
        if not worker:
            raise ValueError("Worker not found")
        
        if worker.shift_status == "WORKING":
            worker.shift_status = "PAUSED"
        elif worker.shift_status == "PAUSED":
            worker.shift_status = "WORKING"
        else:
            worker.shift_status = "WORKING"
        
        db.commit()
        return {"shift_status": worker.shift_status}

    @staticmethod
    def toggle_emergency(db: Session, worker_id: int = 1) -> dict:
        worker = db.query(WorkerProfile).filter(WorkerProfile.id == worker_id).first()
        if not worker:
            raise ValueError("Worker not found")
        
        worker.is_emergency_active = not worker.is_emergency_active
        db.commit()
        return {"is_emergency_active": worker.is_emergency_active}

    @staticmethod
    def get_activities(db: Session, worker_id: int = 1):
        return db.query(ActivityLog).filter(ActivityLog.worker_id == worker_id).order_by(ActivityLog.id.desc()).all()

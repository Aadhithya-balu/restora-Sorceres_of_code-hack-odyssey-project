from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import AssistantQuery, AssistantResponse
from ..services.assistant_service import AssistantService

router = APIRouter(prefix="/api/assistant", tags=["Worker Assistant"])

@router.post("/chat", response_model=AssistantResponse)
def chat_with_assistant(query: AssistantQuery, db: Session = Depends(get_db)):
    return AssistantService.answer_query(db, query=query.message, worker_id=1)

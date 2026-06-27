from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.schemas.tutor import ChatMessageCreate, ChatMessageResponse
from app.services.tutor_service import TutorService
from app.models.user import User
from app.core.security_hardening import check_prompt_injection, sanitize_input_text

router = APIRouter(prefix="/tutor", tags=["tutor"])

@router.get("/history", response_model=list[ChatMessageResponse])
def get_chat_history(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tutor_service = TutorService(db)
    return tutor_service.get_history(current_user.id)

@router.post("/chat")
def chat_with_tutor(chat_msg: ChatMessageCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # 1. Prompt Injection Protection
    if check_prompt_injection(chat_msg.message):
        raise HTTPException(
            status_code=400,
            detail="Potential prompt injection or jailbreak attempt detected."
        )
    
    # 2. XSS Input Sanitization
    chat_msg.message = sanitize_input_text(chat_msg.message)
    
    tutor_service = TutorService(db)
    return StreamingResponse(
        tutor_service.stream_chat_response(current_user, chat_msg),
        media_type="text/event-stream"
    )

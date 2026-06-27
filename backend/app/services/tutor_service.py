from sqlalchemy.orm import Session
from typing import Generator
from app.models.user import User
from app.models.memory import ChatMemory
from app.schemas.tutor import ChatMessageCreate
import json

class TutorService:
    def __init__(self, db: Session):
        self.db = db

    def get_history(self, user_id: int, limit: int = 20) -> list[ChatMemory]:
        return self.db.query(ChatMemory).filter(ChatMemory.user_id == user_id).order_by(ChatMemory.timestamp.asc()).limit(limit).all()

    def stream_chat_response(self, user: User, chat_msg: ChatMessageCreate) -> Generator[str, None, None]:
        # 1. Save user query in memory
        user_memory = ChatMemory(user_id=user.id, role="user", content=chat_msg.message)
        self.db.add(user_memory)
        self.db.commit()

        # 2. Get past chat history
        history = self.get_history(user.id, limit=10)
        formatted_history = [{"role": h.role, "content": h.content} for h in history]

        # 3. Retrieve lesson context if provided
        lesson_context = ""
        if chat_msg.lesson_id:
            from app.repositories.roadmap_repository import RoadmapRepository
            roadmap_repo = RoadmapRepository(self.db)
            lesson = roadmap_repo.get_lesson(chat_msg.lesson_id)
            if lesson:
                lesson_context = f"Active Lesson: {lesson.title} - Description: {lesson.description}"

        # 4. Stream response from TutorAgent (use per-user API key if available)
        assistant_reply_accumulated = []
        try:
            from app.agents.tutor_agent.agent import TutorAgent
            tutor = TutorAgent(api_key=user.gemini_api_key or None)
            
            # Request streaming chunks
            for chunk in tutor.chat_stream(
                message=chat_msg.message,
                history=formatted_history,
                user_goal=user.goal or "General Learning",
                user_level=user.skill_level or "Beginner",
                lesson_context=lesson_context
            ):
                assistant_reply_accumulated.append(chunk)
                # SSE Event Format
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"
                
        except Exception as e:
            fallback_err = f"Sorry, I encountered an issue: {str(e)}. Please try again."
            assistant_reply_accumulated.append(fallback_err)
            yield f"data: {json.dumps({'chunk': fallback_err})}\n\n"

        # 5. Save accumulated response in memory
        final_reply = "".join(assistant_reply_accumulated)
        assistant_memory = ChatMemory(user_id=user.id, role="assistant", content=final_reply)
        self.db.add(assistant_memory)
        self.db.commit()
        yield "data: [DONE]\n\n"

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class ChatMessageCreate(BaseModel):
    message: str = Field(..., description="Message content sent by user")
    lesson_id: Optional[int] = Field(None, description="Optional ID of active lesson the user is on")

class ChatMessageResponse(BaseModel):
    id: int
    user_id: int
    role: str # 'user' or 'assistant'
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True

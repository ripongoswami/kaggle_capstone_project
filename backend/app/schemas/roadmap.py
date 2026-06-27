from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class LessonBase(BaseModel):
    title: str
    description: Optional[str] = None
    milestone_title: str
    difficulty: str
    estimated_time: int
    status: str
    order: int
    revision_needed: bool = False

class LessonCreate(LessonBase):
    pass

class LessonResponse(LessonBase):
    id: int
    roadmap_id: int
    study_notes: Optional[str] = None

    class Config:
        from_attributes = True


class MilestoneResponse(BaseModel):
    title: str
    lessons: List[LessonResponse]

    class Config:
        from_attributes = True

class RoadmapResponse(BaseModel):
    id: int
    user_id: int
    title: str
    progress: float
    streak: int
    created_at: datetime
    milestones: List[MilestoneResponse] = []

    class Config:
        from_attributes = True

class RoadmapCreateRequest(BaseModel):
    goal: str = Field(..., description="The objective the user wants to learn")
    skill_level: str = Field("Beginner", description="Beginner, Intermediate, or Advanced")
    daily_study_time: int = Field(60, description="Available study time per day in minutes")
    target_date: Optional[str] = Field(None, description="The target end date for learning")

from pydantic import BaseModel
from typing import List, Optional

class AgentRoadmapLesson(BaseModel):
    title: str
    description: str
    estimated_time: int

class AgentRoadmapMilestone(BaseModel):
    title: str
    lessons: List[AgentRoadmapLesson]

class AgentRoadmapData(BaseModel):
    title: str
    milestones: List[AgentRoadmapMilestone]

class AgentQuizQuestion(BaseModel):
    question_id: int
    type: str # MCQ, TF, SA
    question: str
    options: Optional[List[str]] = None
    correct_option_idx: Optional[int] = None

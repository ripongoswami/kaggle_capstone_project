from pydantic import BaseModel, Field
from typing import List, Optional

class QuizQuestion(BaseModel):
    question_id: int
    type: str # 'MCQ', 'TF', 'SA' (Short Answer)
    question: str
    options: Optional[List[str]] = None # Only for MCQ
    correct_option_idx: Optional[int] = None # Only for MCQ/TF internally, hidden from student

class QuizResponseSchema(BaseModel):
    quiz_id: int
    lesson_id: int
    title: str
    questions: List[QuizQuestion]

class StudentAnswerSubmission(BaseModel):
    question_id: int
    selected_option_idx: Optional[int] = None # For MCQ/TF
    short_answer_text: Optional[str] = "" # For Short Answer

class QuizSubmissionRequest(BaseModel):
    quiz_id: int
    answers: List[StudentAnswerSubmission]

class QuizEvaluationResponse(BaseModel):
    score: float
    passed: bool
    weak_topics: List[str]
    adjustments_made: bool
    explanation: Optional[str] = None

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.schemas.quiz import QuizResponseSchema, QuizSubmissionRequest, QuizEvaluationResponse
from app.services.quiz_service import QuizService
from app.models.user import User
import json

router = APIRouter(prefix="/quiz", tags=["quiz"])

@router.get("/generate/{lesson_id}", response_model=QuizResponseSchema)
def generate_quiz(lesson_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quiz_service = QuizService(db)
    quiz = quiz_service.get_or_generate_quiz(current_user.id, lesson_id)
    
    questions_list = json.loads(quiz.questions)
    # Filter out correct option keys before returning questions to student
    student_questions = []
    for q in questions_list:
        student_q = {
            "question_id": q.get("question_id"),
            "type": q.get("type"),
            "question": q.get("question"),
            "options": q.get("options")
        }
        student_questions.append(student_q)

    return QuizResponseSchema(
        quiz_id=quiz.id,
        lesson_id=quiz.lesson_id,
        title=quiz.title,
        questions=student_questions
    )

@router.post("/submit", response_model=QuizEvaluationResponse)
def submit_quiz(submission: QuizSubmissionRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quiz_service = QuizService(db)
    return quiz_service.submit_quiz(current_user.id, submission)

@router.get("/generate-extra/{lesson_id}", response_model=QuizResponseSchema)
def generate_extra_quiz(lesson_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    quiz_service = QuizService(db)
    try:
        quiz = quiz_service.get_or_create_extra_quiz(
            user_id=current_user.id,
            lesson_id=lesson_id,
            gemini_key=current_user.gemini_api_key
        )
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
    
    questions_list = json.loads(quiz.questions)
    student_questions = []
    for q in questions_list:
        student_q = {
            "question_id": q.get("question_id"),
            "type": q.get("type"),
            "question": q.get("question"),
            "options": q.get("options")
        }
        student_questions.append(student_q)

    return QuizResponseSchema(
        quiz_id=quiz.id,
        lesson_id=quiz.lesson_id,
        title=quiz.title,
        questions=student_questions
    )
    

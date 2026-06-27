from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.repositories.roadmap_repository import RoadmapRepository
from app.repositories.quiz_repository import QuizRepository

router = APIRouter(prefix="/analytics", tags=["analytics"])

@router.get("/summary")
def get_analytics_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    roadmap_repo = RoadmapRepository(db)
    quiz_repo = QuizRepository(db)

    roadmap = roadmap_repo.get_by_user_id(current_user.id)
    attempts = quiz_repo.get_attempts_by_user(current_user.id)

    # 1. Fetch completed count and total count
    progress = 0.0
    streak = 0
    total_lessons = 0
    completed_lessons = 0
    lessons = []
    
    career_readiness = 0.0
    missing_skills = []
    target_roles = []
    certifications = []
    current_lesson_notes = None
    quizzes_ready = 0
    resources = []

    if roadmap:
        progress = roadmap.progress
        streak = roadmap.streak
        lessons = roadmap_repo.get_lessons_by_roadmap(roadmap.id)
        total_lessons = len(lessons)
        completed_lessons = sum(1 for l in lessons if l.status == "Completed")
        
        import json
        career_readiness = roadmap.career_readiness or 0.0
        try:
            missing_skills = json.loads(roadmap.missing_skills) if roadmap.missing_skills else []
        except Exception:
            missing_skills = []
        try:
            target_roles = json.loads(roadmap.target_roles) if roadmap.target_roles else []
        except Exception:
            target_roles = []
        try:
            certifications = json.loads(roadmap.certifications) if roadmap.certifications else []
        except Exception:
            certifications = []
        
        # Find current lesson study notes
        current_lesson = next((l for l in lessons if l.status == "Current"), None)
        if current_lesson and current_lesson.study_notes:
            current_lesson_notes = current_lesson.study_notes

        # Count lessons that have a quiz ready (have quiz_questions)
        quizzes_ready = sum(1 for l in lessons if l.quiz_questions and l.status != "Completed")

        # Extract resources from all lessons
        all_resources = []
        for l in lessons:
            if l.resources:
                try:
                    lesson_resources = json.loads(l.resources)
                    if isinstance(lesson_resources, list):
                        all_resources.extend(lesson_resources)
                except Exception:
                    pass
        resources = all_resources[:6]  # Return up to 6

    # 2. Fetch quiz averages
    avg_score = 0.0
    if attempts:
        avg_score = round(sum(a.score for a in attempts) / len(attempts), 1)

    # 3. Simulate study hours (based on completed lessons * estimated time)
    study_hours = 0.0
    if lessons:
        completed = [l for l in lessons if l.status == "Completed"]
        total_minutes = sum(l.estimated_time for l in completed)
        study_hours = round(total_minutes / 60.0, 1)

    # 4. Generate chart data (activity log)
    activity_chart = [
        {"day": "Mon", "hours": 0.5},
        {"day": "Tue", "hours": 1.2},
        {"day": "Wed", "hours": 0.8},
        {"day": "Thu", "hours": study_hours if study_hours > 0 else 1.5},
        {"day": "Fri", "hours": 0.0},
        {"day": "Sat", "hours": 0.0},
        {"day": "Sun", "hours": 0.0}
    ]

    return {
        "progress": progress,
        "streak": streak if streak > 0 else 1,
        "total_lessons": total_lessons,
        "completed_lessons": completed_lessons,
        "quiz_average": avg_score,
        "study_hours": study_hours if study_hours > 0 else 2.5,
        "current_level": current_user.skill_level or "Beginner",
        "activity_chart": activity_chart,
        "goal": current_user.goal or "General Learning",
        "target_date": current_user.target_date,
        "career_readiness": career_readiness,
        "missing_skills": missing_skills,
        "target_roles": target_roles,
        "certifications": certifications,
        "current_lesson_notes": current_lesson_notes,
        "quizzes_ready": quizzes_ready if quizzes_ready > 0 else 3,
        "resources": resources,
    }

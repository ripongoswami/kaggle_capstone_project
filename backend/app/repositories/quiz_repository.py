from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.quiz import Quiz, QuizAttempt
import json

class QuizRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_quiz_by_id(self, quiz_id: int) -> Optional[Quiz]:
        return self.db.query(Quiz).filter(Quiz.id == quiz_id).first()

    def get_quiz_by_lesson(self, lesson_id: int) -> Optional[Quiz]:
        return self.db.query(Quiz).filter(Quiz.lesson_id == lesson_id).filter(~Quiz.title.like("Extra Quiz:%")).first()

    def get_extra_quiz_by_lesson(self, lesson_id: int) -> Optional[Quiz]:
        return self.db.query(Quiz).filter(Quiz.lesson_id == lesson_id).filter(Quiz.title.like("Extra Quiz:%")).first()

    def create_quiz(self, lesson_id: int, title: str, questions_data: List[dict]) -> Quiz:
        # Delete existing quiz for this lesson to prevent duplication
        existing = self.get_quiz_by_lesson(lesson_id)
        if existing:
            self.db.delete(existing)
            self.db.commit()

        quiz = Quiz(
            lesson_id=lesson_id,
            title=title,
            questions=json.dumps(questions_data)
        )
        self.db.add(quiz)
        self.db.commit()
        self.db.refresh(quiz)
        return quiz

    def create_extra_quiz(self, lesson_id: int, title: str, questions_data: List[dict]) -> Quiz:
        existing = self.get_extra_quiz_by_lesson(lesson_id)
        if existing:
            self.db.delete(existing)
            self.db.commit()

        quiz = Quiz(
            lesson_id=lesson_id,
            title=title,
            questions=json.dumps(questions_data)
        )
        self.db.add(quiz)
        self.db.commit()
        self.db.refresh(quiz)
        return quiz

    def create_attempt(self, user_id: int, quiz_id: int, score: float, answers_data: List[dict], weak_topics: List[str]) -> QuizAttempt:
        attempt = QuizAttempt(
            user_id=user_id,
            quiz_id=quiz_id,
            score=score,
            answers=json.dumps(answers_data),
            weak_topics=json.dumps(weak_topics)
        )
        self.db.add(attempt)
        self.db.commit()
        self.db.refresh(attempt)
        return attempt

    def get_attempts_by_user(self, user_id: int) -> List[QuizAttempt]:
        return self.db.query(QuizAttempt).filter(QuizAttempt.user_id == user_id).order_by(QuizAttempt.timestamp.desc()).all()

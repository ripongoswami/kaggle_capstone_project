from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.roadmap import Roadmap
from app.models.lesson import Lesson

class RoadmapRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: int) -> Optional[Roadmap]:
        return self.db.query(Roadmap).filter(Roadmap.user_id == user_id).first()

    def get_roadmap_by_id(self, roadmap_id: int) -> Optional[Roadmap]:
        return self.db.query(Roadmap).filter(Roadmap.id == roadmap_id).first()

    def create_roadmap(self, user_id: int, title: str, career_readiness: float = 0.0, missing_skills: str = None, target_roles: str = None, certifications: str = None) -> Roadmap:
        # Delete existing roadmaps first if they exist (since each user has one main active learning roadmap)
        existing = self.get_by_user_id(user_id)
        if existing:
            self.db.delete(existing)
            self.db.commit()

        roadmap = Roadmap(
            user_id=user_id, 
            title=title, 
            progress=0.0, 
            streak=0,
            career_readiness=career_readiness,
            missing_skills=missing_skills,
            target_roles=target_roles,
            certifications=certifications
        )
        self.db.add(roadmap)
        self.db.commit()
        self.db.refresh(roadmap)
        return roadmap

    def create_lessons(self, lessons_list: List[Lesson]) -> List[Lesson]:
        self.db.bulk_save_objects(lessons_list)
        self.db.commit()
        return lessons_list

    def get_lesson(self, lesson_id: int) -> Optional[Lesson]:
        return self.db.query(Lesson).filter(Lesson.id == lesson_id).first()

    def get_lessons_by_roadmap(self, roadmap_id: int) -> List[Lesson]:
        return self.db.query(Lesson).filter(Lesson.roadmap_id == roadmap_id).order_by(Lesson.order.asc()).all()

    def update_lesson_status(self, lesson_id: int, status: str) -> Optional[Lesson]:
        lesson = self.get_lesson(lesson_id)
        if not lesson:
            return None
        lesson.status = status
        self.db.add(lesson)
        self.db.commit()
        self.db.refresh(lesson)
        self.update_roadmap_progress(lesson.roadmap_id)
        return lesson

    def update_roadmap_progress(self, roadmap_id: int) -> Optional[Roadmap]:
        roadmap = self.get_roadmap_by_id(roadmap_id)
        if not roadmap:
            return None
        lessons = self.get_lessons_by_roadmap(roadmap_id)
        if not lessons:
            roadmap.progress = 0.0
        else:
            completed = sum(1 for l in lessons if l.status == "Completed")
            roadmap.progress = round((completed / len(lessons)) * 100.0, 1)
        self.db.add(roadmap)
        self.db.commit()
        self.db.refresh(roadmap)
        return roadmap

    def get_next_lesson(self, roadmap_id: int, current_order: int) -> Optional[Lesson]:
        """Return the very next lesson after current_order in the roadmap (any status)."""
        return (
            self.db.query(Lesson)
            .filter(Lesson.roadmap_id == roadmap_id, Lesson.order > current_order)
            .order_by(Lesson.order.asc())
            .first()
        )

    def add_lessons_at_order(self, roadmap_id: int, after_order: int, new_lessons: List[Lesson]):
        # Shift orders of current lessons that occur after 'after_order'
        lessons_to_shift = self.db.query(Lesson).filter(
            Lesson.roadmap_id == roadmap_id,
            Lesson.order > after_order
        ).all()
        
        shift_amount = len(new_lessons)
        for l in lessons_to_shift:
            l.order += shift_amount
            self.db.add(l)
            
        # Insert the new lessons
        for idx, lesson in enumerate(new_lessons):
            lesson.roadmap_id = roadmap_id
            lesson.order = after_order + idx + 1
            self.db.add(lesson)
            
        self.db.commit()

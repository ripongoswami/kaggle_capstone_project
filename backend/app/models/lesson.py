from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database.session import Base

class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    milestone_title = Column(String, nullable=False, default="Milestone 1")
    difficulty = Column(String, nullable=False, default="Beginner")
    estimated_time = Column(Integer, default=30) # in minutes
    status = Column(String, nullable=False, default="Locked") # Locked, Current, Completed
    order = Column(Integer, nullable=False, default=0)
    revision_needed = Column(Boolean, default=False)
    study_notes = Column(Text, nullable=True)
    resources = Column(Text, nullable=True)
    quiz_questions = Column(Text, nullable=True)

    # Relationships
    roadmap = relationship("Roadmap", back_populates="lessons")
    quizzes = relationship("Quiz", back_populates="lesson", cascade="all, delete-orphan")

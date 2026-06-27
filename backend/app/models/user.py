from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    goal = Column(String, nullable=True)
    skill_level = Column(String, nullable=True)
    daily_study_time = Column(Integer, default=60) # minutes
    target_date = Column(String, nullable=True)
    role = Column(String, default="student", nullable=True)
    gemini_api_key = Column(String, nullable=True)
    tavily_api_key = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    roadmaps = relationship("Roadmap", back_populates="user", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")
    memories = relationship("ChatMemory", back_populates="user", cascade="all, delete-orphan")

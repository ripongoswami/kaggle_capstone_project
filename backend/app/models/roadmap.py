from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.session import Base

class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    progress = Column(Float, default=0.0)
    streak = Column(Integer, default=0)
    career_readiness = Column(Float, default=0.0)
    missing_skills = Column(Text, nullable=True)
    target_roles = Column(Text, nullable=True)
    certifications = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="roadmaps")
    lessons = relationship("Lesson", back_populates="roadmap", cascade="all, delete-orphan")

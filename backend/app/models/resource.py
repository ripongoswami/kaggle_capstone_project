from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from app.database.session import Base

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=True) # Optional link to a specific lesson
    title = Column(String, nullable=False)
    type = Column(String, nullable=False) # 'YouTube', 'PDF', 'Article', 'Book'
    url = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    relevance_score = Column(Float, default=1.0)
    search_query = Column(String, nullable=True)
    intent = Column(String, nullable=True)
    author = Column(String, nullable=True)
    level = Column(String, nullable=True)
    duration = Column(String, nullable=True)
    source_domain = Column(String, nullable=True)

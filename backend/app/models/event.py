from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime, timezone
from app.database.session import Base

class EventLog(Base):
    __tablename__ = "event_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    event_type = Column(String, nullable=False)
    details = Column(Text, nullable=True) # JSON details
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

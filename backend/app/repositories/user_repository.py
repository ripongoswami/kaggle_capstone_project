from sqlalchemy.orm import Session
from typing import Optional
from app.models.user import User
from app.schemas.auth import UserCreate

class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, user_id: int) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

    def create(self, obj_in: UserCreate, hashed_password: str) -> User:
        db_obj = User(
            username=obj_in.username,
            email=obj_in.email,
            hashed_password=hashed_password,
            goal=obj_in.goal,
            skill_level=obj_in.skill_level,
            daily_study_time=obj_in.daily_study_time,
            target_date=obj_in.target_date
        )
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update_profile(self, user: User, goal: Optional[str] = None, skill_level: Optional[str] = None, daily_study_time: Optional[int] = None, target_date: Optional[str] = None, gemini_api_key: Optional[str] = None, tavily_api_key: Optional[str] = None) -> User:
        if goal is not None:
            user.goal = goal
        if skill_level is not None:
            user.skill_level = skill_level
        if daily_study_time is not None:
            user.daily_study_time = daily_study_time
        if target_date is not None:
            user.target_date = target_date
        if gemini_api_key is not None:
            user.gemini_api_key = gemini_api_key
        if tavily_api_key is not None:
            user.tavily_api_key = tavily_api_key
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

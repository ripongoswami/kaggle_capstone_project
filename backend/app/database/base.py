# Import all the models so that Base has them before being
# imported by Alembic or application startup.
from app.database.session import Base
from app.models.user import User
from app.models.roadmap import Roadmap
from app.models.lesson import Lesson
from app.models.quiz import Quiz, QuizAttempt
from app.models.resource import Resource
from app.models.memory import ChatMemory

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.logging import setup_logging
from app.database.session import engine, Base
from app.database.seed import seed_db
from app.database.session import SessionLocal
from app.api import auth, roadmap, tutor, quiz, resources, analytics, mcp
from app.middleware.security import RateLimitingMiddleware, SecurityHeadersMiddleware

# Setup system logs
setup_logging()

# Import models to register them with Base metadata
from app.models.user import User
from app.models.roadmap import Roadmap
from app.models.lesson import Lesson
from app.models.quiz import Quiz, QuizAttempt
from app.models.memory import ChatMemory
from app.models.resource import Resource
from app.models.event import EventLog

# Auto create SQLite tables on startup
Base.metadata.create_all(bind=engine)

def run_migrations():
    from sqlalchemy import text
    import logging
    logger = logging.getLogger("eduverse")
    
    has_gemini = False
    has_tavily = False
    has_search_query = False
    has_intent = False
    has_author = False
    has_level = False
    has_duration = False
    has_source_domain = False
    
    with engine.connect() as conn:
        try:
            conn.execute(text("SELECT gemini_api_key FROM users LIMIT 1"))
            has_gemini = True
        except Exception:
            pass
        try:
            conn.execute(text("SELECT tavily_api_key FROM users LIMIT 1"))
            has_tavily = True
        except Exception:
            pass
        try:
            conn.execute(text("SELECT search_query FROM resources LIMIT 1"))
            has_search_query = True
        except Exception:
            pass
        try:
            conn.execute(text("SELECT intent FROM resources LIMIT 1"))
            has_intent = True
        except Exception:
            pass
        try:
            conn.execute(text("SELECT author FROM resources LIMIT 1"))
            has_author = True
        except Exception:
            pass
        try:
            conn.execute(text("SELECT level FROM resources LIMIT 1"))
            has_level = True
        except Exception:
            pass
        try:
            conn.execute(text("SELECT duration FROM resources LIMIT 1"))
            has_duration = True
        except Exception:
            pass
        try:
            conn.execute(text("SELECT source_domain FROM resources LIMIT 1"))
            has_source_domain = True
        except Exception:
            pass
            
    if not has_gemini or not has_tavily:
        with engine.begin() as conn:
            if not has_gemini:
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN gemini_api_key VARCHAR"))
                    logger.info("Migrated: Added gemini_api_key column to users table.")
                except Exception as e:
                    logger.error(f"Error migrating gemini_api_key: {e}")
            if not has_tavily:
                try:
                    conn.execute(text("ALTER TABLE users ADD COLUMN tavily_api_key VARCHAR"))
                    logger.info("Migrated: Added tavily_api_key column to users table.")
                except Exception as e:
                    logger.error(f"Error migrating tavily_api_key: {e}")

    if not all([has_search_query, has_intent, has_author, has_level, has_duration, has_source_domain]):
        with engine.begin() as conn:
            if not has_search_query:
                try:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN search_query VARCHAR"))
                    logger.info("Migrated: Added search_query column to resources table.")
                except Exception as e:
                    logger.error(f"Error migrating search_query: {e}")
            if not has_intent:
                try:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN intent VARCHAR"))
                    logger.info("Migrated: Added intent column to resources table.")
                except Exception as e:
                    logger.error(f"Error migrating intent: {e}")
            if not has_author:
                try:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN author VARCHAR"))
                    logger.info("Migrated: Added author column to resources table.")
                except Exception as e:
                    logger.error(f"Error migrating author: {e}")
            if not has_level:
                try:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN level VARCHAR"))
                    logger.info("Migrated: Added level column to resources table.")
                except Exception as e:
                    logger.error(f"Error migrating level: {e}")
            if not has_duration:
                try:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN duration VARCHAR"))
                    logger.info("Migrated: Added duration column to resources table.")
                except Exception as e:
                    logger.error(f"Error migrating duration: {e}")
            if not has_source_domain:
                try:
                    conn.execute(text("ALTER TABLE resources ADD COLUMN source_domain VARCHAR"))
                    logger.info("Migrated: Added source_domain column to resources table.")
                except Exception as e:
                    logger.error(f"Error migrating source_domain: {e}")

run_migrations()

# Seed test records
db = SessionLocal()
try:
    seed_db(db)
finally:
    db.close()

app = FastAPI(
    title="EduVerse AI API",
    description="The Clean Architecture backend supporting adaptive multi-agent learning.",
    version="1.0.0"
)

# CORS configuration for Next.js frontend calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, set specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitingMiddleware, max_requests=100, window_seconds=60)

# Register routes
app.include_router(auth.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(tutor.router, prefix="/api")
app.include_router(quiz.router, prefix="/api")
app.include_router(resources.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(mcp.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "Welcome to the EduVerse AI platform API. Ready for learning."}

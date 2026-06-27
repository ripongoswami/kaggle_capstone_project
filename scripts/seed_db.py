import sys
import os

# Include backend path for importing app modules
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.database.session import SessionLocal
import app.database.base
from app.database.seed import seed_db

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_db(db)
    finally:
        db.close()

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.database.session import engine, Base
import app.database.base

def reset_database():
    print("Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    print("Re-creating all database schemas...")
    Base.metadata.create_all(bind=engine)
    print("Database reset successfully.")

if __name__ == "__main__":
    reset_database()

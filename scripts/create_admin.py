import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.database.session import SessionLocal
from app.models.user import User
from app.core.security import get_password_hash

def create_admin():
    db = SessionLocal()
    try:
        username = input("Enter admin username: ").strip()
        email = input("Enter admin email: ").strip()
        password = input("Enter admin password: ").strip()

        existing = db.query(User).filter((User.username == username) | (User.email == email)).first()
        if existing:
            print("Error: User with this username or email already exists.")
            return

        admin = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            goal="Administrator Portal",
            skill_level="Advanced",
            daily_study_time=120
        )
        db.add(admin)
        db.commit()
        print(f"Admin user '{username}' created successfully.")
    except Exception as e:
        print(f"Failed to create admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()

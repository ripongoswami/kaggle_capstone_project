"""One-shot script: look up ripjaws@gmail.com and reset password."""
import sys
from pathlib import Path

# Run from eduverse/backend/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.database.session import SessionLocal
import app.database.base  # noqa: F401 — register all ORM models
from app.models.user import User
from app.core.security import get_password_hash, verify_password

NEW_PASSWORD = "ripjaws123"
EMAIL = "ripjaws@gmail.com"


def main():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == EMAIL).first()
        if not user:
            # Try partial match
            user = db.query(User).filter(User.email.like("ripjaws%")).first()
        if not user:
            print(f"No user found matching {EMAIL!r}")
            matches = db.query(User.email, User.username, User.id).all()
            print("All users in DB:")
            for u in matches:
                print(f"  id={u.id} email={u.email} username={u.username}")
            return 1

        print("=== User Details ===")
        print(f"  id:              {user.id}")
        print(f"  username:        {user.username}")
        print(f"  email:           {user.email}")
        print(f"  goal:            {user.goal}")
        print(f"  skill_level:     {user.skill_level}")
        print(f"  daily_study_time:{user.daily_study_time}")
        print(f"  target_date:     {user.target_date}")

        user.hashed_password = get_password_hash(NEW_PASSWORD)
        db.add(user)
        db.commit()
        db.refresh(user)

        if verify_password(NEW_PASSWORD, user.hashed_password):
            print(f"\nPassword reset successful for {user.email}")
            print(f"New password: {NEW_PASSWORD}")
        else:
            print("\nWARNING: Password hash verification failed after reset.")
            return 1
        return 0
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())

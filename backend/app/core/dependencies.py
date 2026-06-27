from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.security import decode_access_token
from app.database.session import SessionLocal
# We will create user repository and models later
# For now, let's write a clean structure

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
        
    sub = decode_access_token(token)
    if sub is None:
        raise credentials_exception
    
    # We will import UserRepository later to avoid circular import issues
    from app.repositories.user_repository import UserRepository
    user_repo = UserRepository(db)
    user = user_repo.get_by_id(int(sub))
    if user is None:
        raise credentials_exception
    return user

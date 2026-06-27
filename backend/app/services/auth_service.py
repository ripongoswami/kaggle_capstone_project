from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.repositories.user_repository import UserRepository
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse
from app.core.security import verify_password, get_password_hash, create_access_token

class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.user_repo = UserRepository(db)

    def register(self, user_in: UserCreate) -> Token:
        # Check email uniqueness
        if self.user_repo.get_by_email(user_in.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists."
            )
        # Check username uniqueness
        if self.user_repo.get_by_username(user_in.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this username already exists."
            )
            
        hashed_password = get_password_hash(user_in.password)
        user = self.user_repo.create(user_in, hashed_password)
        
        access_token = create_access_token(subject=user.id)
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )

    def login(self, credentials: UserLogin) -> Token:
        # Try finding by email first
        user = self.user_repo.get_by_email(credentials.username)
        if not user:
            # Try username
            user = self.user_repo.get_by_username(credentials.username)
            
        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email/username or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        access_token = create_access_token(subject=user.id)
        return Token(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.model_validate(user)
        )

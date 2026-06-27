from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.schemas.auth import UserCreate, UserLogin, Token, UserResponse, UserUpdate, TestKeysRequest, AdminUserCreate, AdminUserUpdate, PasswordVerifyRequest, PasswordChangeRequest, ForgotPasswordRequest, ResetPasswordRequest
from app.services.auth_service import AuthService
from app.repositories.user_repository import UserRepository
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=Token, status_code=201)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.register(user_in)

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    return auth_service.login(credentials)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(user_in: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user_repo = UserRepository(db)
    
    # Detect changes to trigger roadmap regeneration
    goal_changed = user_in.goal is not None and user_in.goal != current_user.goal
    level_changed = user_in.skill_level is not None and user_in.skill_level != current_user.skill_level
    time_changed = user_in.daily_study_time is not None and user_in.daily_study_time != current_user.daily_study_time
    
    updated_user = user_repo.update_profile(
        user=current_user,
        goal=user_in.goal,
        skill_level=user_in.skill_level,
        daily_study_time=user_in.daily_study_time,
        target_date=user_in.target_date,
        gemini_api_key=user_in.gemini_api_key,
        tavily_api_key=user_in.tavily_api_key
    )
    
    if goal_changed or level_changed or time_changed:
        from app.services.roadmap_service import RoadmapService
        from app.schemas.roadmap import RoadmapCreateRequest
        import logging
        try:
            roadmap_service = RoadmapService(db)
            req = RoadmapCreateRequest(
                goal=updated_user.goal,
                skill_level=updated_user.skill_level,
                daily_study_time=updated_user.daily_study_time
            )
            roadmap_service.generate_roadmap(updated_user.id, req)
            logging.getLogger("eduverse").info(f"Automatically regenerated roadmap for user {updated_user.id} due to profile settings update.")
        except Exception as e:
            logging.getLogger("eduverse").error(f"Failed to auto-regenerate roadmap on profile settings update: {e}")
            
    return updated_user

@router.post("/verify-password")
def verify_user_password(
    req: PasswordVerifyRequest,
    current_user: User = Depends(get_current_user)
):
    from app.core.security import verify_password
    from fastapi import HTTPException
    
    is_valid = verify_password(req.password, current_user.hashed_password)
    if not is_valid:
        raise HTTPException(status_code=400, detail="Incorrect password verification.")
    return {"valid": True}

@router.post("/change-password")
def change_user_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.core.security import verify_password, get_password_hash
    from fastapi import HTTPException
    
    if not verify_password(req.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect old password.")
    
    current_user.hashed_password = get_password_hash(req.new_password)
    db.add(current_user)
    db.commit()
    return {"message": "Password changed successfully"}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    from app.core.security import create_access_token
    from datetime import timedelta
    import logging

    user_repo = UserRepository(db)
    user = user_repo.get_by_email(req.email)

    if not user:
        return {"message": "If that email is registered, a password reset link has been sent."}

    # Create a 15-minute reset token using the user's id as the subject
    reset_token = create_access_token(
        subject=str(user.id),
        expires_delta=timedelta(minutes=15)
    )

    # Mock Email Sending — prints to backend log
    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
    logging.getLogger("eduverse").info(f"MOCK EMAIL SENT to {req.email}: {reset_link}")

    return {"message": "If that email is registered, a password reset link has been sent."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    from app.core.security import get_password_hash, decode_access_token
    from fastapi import HTTPException

    user_id_str = decode_access_token(req.token)
    if not user_id_str:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token.")

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid reset token.")

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    user.hashed_password = get_password_hash(req.new_password)
    db.add(user)
    db.commit()
    return {"message": "Password has been successfully reset."}

@router.post("/test-keys")
def test_keys(req: TestKeysRequest, current_user: User = Depends(get_current_user)):
    from typing import Optional
    gemini_status = "Not Tested"
    tavily_status = "Not Tested"
    
    # 1. Test Gemini Key
    gemini_key = req.gemini_api_key or current_user.gemini_api_key
    if gemini_key:
        try:
            from google import genai
            client = genai.Client(api_key=gemini_key)
            client.models.generate_content(
                model="gemini-2.5-flash",
                contents="Ping"
            )
            gemini_status = "Valid"
        except Exception as e:
            gemini_status = f"Invalid: {str(e)}"
    else:
        gemini_status = "Not Provided"
        
    # 2. Test Tavily Key
    tavily_key = req.tavily_api_key or current_user.tavily_api_key
    if tavily_key:
        try:
            import requests
            resp = requests.post(
                "https://api.tavily.com/search",
                json={"api_key": tavily_key, "query": "test", "max_results": 1},
                timeout=5
            )
            if resp.status_code == 200:
                tavily_status = "Valid"
            else:
                tavily_status = f"Invalid (Status {resp.status_code})"
        except Exception as e:
            tavily_status = f"Invalid: {str(e)}"
    else:
        tavily_status = "Not Provided"
        
    return {
        "gemini": gemini_status,
        "tavily": tavily_status
    }

@router.get("/users", response_model=list[UserResponse])
def get_all_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from fastapi import HTTPException
    if current_user.email != "ripjaws@gmail.com":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Developer space only."
        )
    return db.query(User).all()

@router.post("/users", response_model=UserResponse, status_code=201)
def admin_create_user(
    user_in: AdminUserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from fastapi import HTTPException
    if current_user.email != "ripjaws@gmail.com":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Developer space only."
        )
    user_repo = UserRepository(db)
    if user_repo.get_by_email(user_in.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    if user_repo.get_by_username(user_in.username):
        raise HTTPException(status_code=400, detail="Username already taken")
        
    from app.core.security import get_password_hash
    hashed_pwd = get_password_hash(user_in.password)

    db_obj = User(
        username=user_in.username,
        email=user_in.email,
        hashed_password=hashed_pwd,
        goal=user_in.goal,
        skill_level=user_in.skill_level,
        daily_study_time=user_in.daily_study_time,
        target_date=user_in.target_date,
        gemini_api_key=user_in.gemini_api_key,
        tavily_api_key=user_in.tavily_api_key
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/users/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: int,
    user_in: AdminUserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from fastapi import HTTPException
    if current_user.email != "ripjaws@gmail.com":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Developer space only."
        )
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user_in.username is not None:
        dup = db.query(User).filter(User.username == user_in.username, User.id != user_id).first()
        if dup:
            raise HTTPException(status_code=400, detail="Username already taken")
        target_user.username = user_in.username
    if user_in.email is not None:
        dup = db.query(User).filter(User.email == user_in.email, User.id != user_id).first()
        if dup:
            raise HTTPException(status_code=400, detail="Email already registered")
        target_user.email = user_in.email
    if user_in.password is not None and user_in.password.strip() != "":
        from app.core.security import get_password_hash
        target_user.hashed_password = get_password_hash(user_in.password)
    if user_in.goal is not None:
        target_user.goal = user_in.goal
    if user_in.skill_level is not None:
        target_user.skill_level = user_in.skill_level
    if user_in.daily_study_time is not None:
        target_user.daily_study_time = user_in.daily_study_time
    if user_in.target_date is not None:
        target_user.target_date = user_in.target_date
    if user_in.gemini_api_key is not None:
        target_user.gemini_api_key = user_in.gemini_api_key
    if user_in.tavily_api_key is not None:
        target_user.tavily_api_key = user_in.tavily_api_key
        
    db.add(target_user)
    db.commit()
    db.refresh(target_user)
    return target_user

@router.delete("/users/{user_id}")
def admin_delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from fastapi import HTTPException
    if current_user.email != "ripjaws@gmail.com":
        raise HTTPException(
            status_code=403,
            detail="Access denied. Developer space only."
        )
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")
        
    db.delete(target_user)
    db.commit()
    return {"message": "User deleted successfully", "user_id": user_id}

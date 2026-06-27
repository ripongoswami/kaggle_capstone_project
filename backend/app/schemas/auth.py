from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr
    goal: Optional[str] = None
    skill_level: Optional[str] = "Beginner"
    daily_study_time: Optional[int] = 60
    target_date: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    goal: Optional[str] = None
    skill_level: Optional[str] = None
    daily_study_time: Optional[int] = None
    target_date: Optional[str] = None
    gemini_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None

class PasswordVerifyRequest(BaseModel):
    password: str

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserLogin(BaseModel):
    username: str # Can be email or username
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    goal: Optional[str]
    skill_level: Optional[str]
    daily_study_time: int
    target_date: Optional[str]
    role: Optional[str] = "student"
    gemini_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TestKeysRequest(BaseModel):
    gemini_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None

class AdminUserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    goal: Optional[str] = None
    skill_level: Optional[str] = "Beginner"
    daily_study_time: Optional[int] = 60
    target_date: Optional[str] = None
    gemini_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None

class AdminUserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    goal: Optional[str] = None
    skill_level: Optional[str] = None
    daily_study_time: Optional[int] = None
    target_date: Optional[str] = None
    gemini_api_key: Optional[str] = None
    tavily_api_key: Optional[str] = None

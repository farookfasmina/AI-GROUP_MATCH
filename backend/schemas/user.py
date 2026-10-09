from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    university: Optional[str] = None
    department: Optional[str] = None
    academic_year: Optional[str] = None


class UserCreate(UserBase):
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    university: Optional[str] = None
    department: Optional[str] = None
    academic_year: Optional[str] = None


class UserProfile(UserBase):
    id: int
    is_platform_admin: bool
    created_at: datetime
    consent_given: bool = False
    is_demo: bool = False
    profile_complete: bool = False

    class Config:
        from_attributes = True


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=8, max_length=128)


class VerifyEmailIn(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)


class ResendCodeIn(BaseModel):
    email: EmailStr
    purpose: str = Field(pattern="^(verify|reset)$")


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)

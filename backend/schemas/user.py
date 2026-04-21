from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    university: Optional[str] = None
    department: Optional[str] = None
    academic_year: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    university: Optional[str] = None
    department: Optional[str] = None
    academic_year: Optional[str] = None

class UserProfile(UserBase):
    id: int
    is_platform_admin: bool
    created_at: datetime

    # This allows Pydantic to read data directly from SQLAlchemy model attributes
    class Config:
        from_attributes = True

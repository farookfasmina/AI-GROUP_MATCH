from typing import List, Optional

from pydantic import BaseModel, Field


class StudyGroupCreate(BaseModel):
    name: str = Field(min_length=3, max_length=120)
    description: Optional[str] = Field(default=None, max_length=1000)
    subject: str = Field(min_length=2, max_length=120)


class RespondIn(BaseModel):
    accept: bool


class MatchRunIn(BaseModel):
    subjects: List[str] = Field(default_factory=list)
    min_size: int = Field(default=3, ge=3, le=6)
    max_size: int = Field(default=5, ge=3, le=8)


class SubjectIn(BaseModel):
    code: str = Field(min_length=2, max_length=20)
    name: str = Field(min_length=2, max_length=120)
    active: bool = True

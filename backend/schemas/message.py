from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class GroupMessageBase(BaseModel):
    content: str

class GroupMessageCreate(GroupMessageBase):
    pass

class GroupMessageResponse(GroupMessageBase):
    id: int
    group_id: int
    sender_id: int
    sender_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

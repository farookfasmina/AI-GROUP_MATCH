from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class GroupMessageBase(BaseModel):
    content: Optional[str] = None
    is_file: Optional[bool] = False
    file_url: Optional[str] = None
    file_name: Optional[str] = None

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

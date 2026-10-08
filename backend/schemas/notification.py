from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool
    type: str
    payload_id: Optional[int] = None
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

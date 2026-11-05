from typing import Optional, Any
from pydantic import BaseModel, ConfigDict


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    type: str
    title: str
    body: str
    link: Optional[str] = None
    read_at: Optional[Any] = None
    created_at: Any

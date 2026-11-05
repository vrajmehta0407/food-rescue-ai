from typing import Optional, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class HandoffEventCreate(BaseModel):
    event_type: str = Field(..., pattern="^(arrival|collected|delivered|completed|exception|cancelled)$")
    quantity_value: Optional[float] = None
    quantity_unit: Optional[str] = None
    occurred_at: Optional[datetime] = None
    notes: Optional[str] = None


class HandoffEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    match_id: str
    event_type: str
    quantity_value: Optional[float] = None
    quantity_unit: Optional[str] = None
    occurred_at: Any
    notes: Optional[str] = None
    actor_user_id: Optional[str] = None
    actor_user_name: Optional[str] = None

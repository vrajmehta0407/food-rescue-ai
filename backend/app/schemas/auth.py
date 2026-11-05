from typing import Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserBase(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    role: str = Field(..., pattern="^(donor|recipient|volunteer|admin)$")


class UserRegister(UserBase):
    password: str = Field(..., min_length=6, max_length=128)
    organization_name: Optional[str] = None
    organization_type: Optional[str] = None
    organization_address: Optional[str] = None
    organization_latitude: Optional[float] = None
    organization_longitude: Optional[float] = None
    service_radius_km: Optional[float] = 15.0
    capacity_value: Optional[float] = 100.0
    capacity_unit: Optional[str] = "kg"
    handling_capabilities: Optional[Dict[str, Any]] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    role: str
    organization_id: Optional[str] = None
    is_active: bool
    created_at: Any

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255)
    type: str = Field(..., min_length=2, max_length=50)
    address: str = Field(..., min_length=3, max_length=500)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius_km: Optional[float] = 15.0
    capacity_value: float = Field(default=100.0, ge=0.0)
    capacity_unit: str = "kg"
    handling_capabilities: Dict[str, Any] = Field(default_factory=dict)
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    service_radius_km: Optional[float] = None
    capacity_value: Optional[float] = None
    capacity_unit: Optional[str] = None
    handling_capabilities: Optional[Dict[str, Any]] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None


class OrganizationResponse(OrganizationBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    verification_status: str
    created_at: Any
    updated_at: Any


class OrganizationVerifyRequest(BaseModel):
    verification_status: str = Field(..., pattern="^(verified|rejected|suspended)$")
    reason: Optional[str] = None

from typing import Optional, List, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.organization import OrganizationResponse


class SurplusListingBase(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    food_category: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    quantity_value: float = Field(..., gt=0)
    quantity_unit: str = Field(default="portions", pattern="^(portions|kg|packs|crates)$")
    prepared_at: Optional[datetime] = None
    best_before_at: Optional[datetime] = None
    pickup_deadline_at: datetime
    storage_requirement: str = Field(default="ambient", pattern="^(ambient|refrigerated|frozen|hot_holding)$")
    allergens: List[str] = Field(default_factory=list)
    dietary_tags: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class SurplusListingCreate(SurplusListingBase):
    publish_immediately: bool = True


class SurplusListingUpdate(BaseModel):
    title: Optional[str] = None
    food_category: Optional[str] = None
    description: Optional[str] = None
    quantity_value: Optional[float] = Field(default=None, gt=0)
    quantity_unit: Optional[str] = None
    prepared_at: Optional[datetime] = None
    best_before_at: Optional[datetime] = None
    pickup_deadline_at: Optional[datetime] = None
    storage_requirement: Optional[str] = None
    allergens: Optional[List[str]] = None
    dietary_tags: Optional[List[str]] = None
    notes: Optional[str] = None


class SurplusListingBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    food_category: str
    quantity_value: float
    quantity_unit: str
    pickup_deadline_at: datetime
    storage_requirement: str
    status: str


class SurplusListingResponse(SurplusListingBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    donor_organization_id: str
    status: str
    created_at: Any
    updated_at: Any
    donor_organization: Optional[OrganizationResponse] = None

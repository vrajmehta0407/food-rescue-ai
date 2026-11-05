from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.surplus import SurplusListingBrief


class MatchRecommendationResponse(BaseModel):
    id: str
    listing_id: str
    recipient_organization_id: str
    recipient_organization_name: str
    recipient_organization_address: str
    eligibility_status: str
    score: float
    reason_codes: List[Dict[str, str]]
    model_version: str
    created_at: Any


class MatchScheduleRequest(BaseModel):
    pickup_window_start: datetime
    pickup_window_end: datetime
    assigned_volunteer_id: Optional[str] = None


class MatchAcceptRequest(BaseModel):
    recipient_organization_id: Optional[str] = None


class DonationMatchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    listing_id: str
    recipient_organization_id: str
    recipient_organization_name: Optional[str] = None
    donor_organization_name: Optional[str] = None
    status: str
    accepted_at: Optional[Any] = None
    pickup_window_start: Optional[Any] = None
    pickup_window_end: Optional[Any] = None
    assigned_volunteer_id: Optional[str] = None
    assigned_volunteer_name: Optional[str] = None
    listing: Optional[SurplusListingBrief] = None
    created_at: Any
    updated_at: Any

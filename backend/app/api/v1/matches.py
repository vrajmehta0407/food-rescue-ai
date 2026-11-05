from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.match import (
    MatchRecommendationResponse,
    DonationMatchResponse,
    MatchScheduleRequest,
    MatchAcceptRequest,
)
from app.core.exceptions import BadRequestError, NotFoundError
from app.services.matching_service import rank_recipients_for_listing
from app.services.pickup_service import (
    accept_match,
    schedule_match,
    get_user_matches,
)

router = APIRouter(prefix="/matches", tags=["Matches & Redistribution"])


def format_match_response(m) -> dict:
    return {
        "id": str(m.id),
        "listing_id": str(m.listing_id),
        "recipient_organization_id": str(m.recipient_organization_id) if m.recipient_organization_id else "",
        "recipient_organization_name": m.recipient_organization.name if m.recipient_organization else None,
        "donor_organization_name": m.listing.donor_organization.name if (m.listing and m.listing.donor_organization) else None,
        "status": m.status,
        "accepted_at": m.accepted_at,
        "pickup_window_start": m.pickup_window_start,
        "pickup_window_end": m.pickup_window_end,
        "assigned_volunteer_id": str(m.assigned_volunteer_id) if m.assigned_volunteer_id else None,
        "assigned_volunteer_name": m.assigned_volunteer.full_name if m.assigned_volunteer else None,
        "listing": {
            "id": str(m.listing.id),
            "title": m.listing.title,
            "food_category": m.listing.food_category,
            "quantity_value": m.listing.quantity_value,
            "quantity_unit": m.listing.quantity_unit,
            "pickup_deadline_at": m.listing.pickup_deadline_at,
            "storage_requirement": m.listing.storage_requirement,
            "status": m.listing.status,
        } if m.listing else None,
        "created_at": m.created_at,
        "updated_at": m.updated_at,
    }


@router.get("/recommendations/{listing_id}", response_model=List[MatchRecommendationResponse])
def get_recommendations_for_listing(listing_id: str, db: Session = Depends(get_db)):
    """Run the 2-tier explainable matching engine to generate ranked recipient recommendations."""
    return rank_recipients_for_listing(db=db, listing_id=listing_id)


@router.get("", response_model=List[DonationMatchResponse])
def list_my_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List matches relevant to the user's organization or volunteer duties."""
    matches = get_user_matches(db=db, current_user=current_user)
    return [format_match_response(m) for m in matches]


@router.post("/accept/{listing_id}", response_model=DonationMatchResponse)
def accept_donation_offer(
    listing_id: str,
    payload: Optional[MatchAcceptRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["donor", "recipient", "admin"]))
):
    """Verified recipient claims or donor/admin confirms reservation of an available surplus listing."""
    target_recipient_id = payload.recipient_organization_id if (payload and payload.recipient_organization_id) else None
    if not target_recipient_id and current_user.organization_id and current_user.role == "recipient":
        target_recipient_id = str(current_user.organization_id)
        
    if not target_recipient_id:
        raise BadRequestError("Recipient organization must be specified to confirm match.")

    match = accept_match(
        db=db,
        listing_id=listing_id,
        recipient_org_id=target_recipient_id,
        current_user=current_user
    )
    return format_match_response(match)


@router.post("/{match_id}/schedule", response_model=DonationMatchResponse)
def schedule_pickup_window(
    match_id: str,
    data: MatchScheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Set the agreed pickup window and assign an optional logistics volunteer."""
    match = schedule_match(db=db, match_id=match_id, schedule_data=data, current_user=current_user)
    return format_match_response(match)


@router.post("/{match_id}/assign-volunteer", response_model=DonationMatchResponse)
def assign_pickup_volunteer(
    match_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign the current user (volunteer) to coordinate this pickup."""
    match = db.query(DonationMatch).filter(DonationMatch.id == match_id).first()
    if not match:
        raise NotFoundError("Match not found.")
    match.assigned_volunteer_id = current_user.id
    db.commit()
    db.refresh(match)
    return format_match_response(match)


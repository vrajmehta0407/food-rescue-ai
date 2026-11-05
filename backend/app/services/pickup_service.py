from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.models.surplus import SurplusListing
from app.models.organization import Organization
from app.models.match import DonationMatch
from app.models.pickup import HandoffEvent
from app.models.user import User
from app.models.audit import AuditLog
from app.services.notification_service import create_notification
from app.schemas.match import MatchScheduleRequest
from app.schemas.pickup import HandoffEventCreate


def accept_match(db: Session, listing_id: str, recipient_org_id: str, current_user: User) -> DonationMatch:
    """Accept a surplus listing donation offer, reserving the food."""
    listing = db.query(SurplusListing).filter(SurplusListing.id == listing_id).first()
    if not listing:
        raise NotFoundError("Surplus listing not found.")

    if listing.status != "available":
        raise BadRequestError(f"Listing cannot be accepted; current status is '{listing.status}'.")

    # Verify recipient org exists and is verified
    recipient_org = db.query(Organization).filter(Organization.id == recipient_org_id).first()
    if not recipient_org:
        raise NotFoundError("Recipient organization not found.")
    if recipient_org.verification_status != "verified":
        raise ForbiddenError("Only verified recipient organizations can claim surplus listings.")

    # Create or update match
    now = datetime.now(timezone.utc)
    match = db.query(DonationMatch).filter(
        DonationMatch.listing_id == listing.id,
        DonationMatch.recipient_organization_id == recipient_org.id
    ).first()

    if not match:
        match = DonationMatch(
            listing_id=listing.id,
            recipient_organization_id=recipient_org.id,
            status="accepted",
            accepted_at=now
        )
        db.add(match)
    else:
        match.status = "accepted"
        match.accepted_at = now

    listing.status = "reserved"
    db.flush()

    # Initial handoff event
    event = HandoffEvent(
        match_id=match.id,
        event_type="accepted",
        quantity_value=listing.quantity_value,
        quantity_unit=listing.quantity_unit,
        occurred_at=now,
        notes=f"Accepted by {recipient_org.name}",
        actor_user_id=current_user.id
    )
    db.add(event)

    # Notify donor users
    donor_users = db.query(User).filter(User.organization_id == listing.donor_organization_id).all()
    for du in donor_users:
        create_notification(
            db=db,
            user_id=du.id,
            type="match_accepted",
            title="Surplus Claimed!",
            body=f"{recipient_org.name} has claimed '{listing.title}'. Please schedule pickup details.",
            link=f"/dashboard/donations/{listing.id}"
        )

    # Audit log
    audit = AuditLog(
        actor_user_id=current_user.id,
        entity_type="donation_match",
        entity_id=str(match.id),
        action="accept_match",
        metadata_json={"listing_id": str(listing.id), "recipient_id": str(recipient_org.id)}
    )
    db.add(audit)
    db.commit()
    db.refresh(match)
    return match


def schedule_match(
    db: Session,
    match_id: str,
    schedule_data: MatchScheduleRequest,
    current_user: User
) -> DonationMatch:
    """Set the agreed pickup window and optionally assign a logistics volunteer."""
    match = db.query(DonationMatch).filter(DonationMatch.id == match_id).first()
    if not match:
        raise NotFoundError("Donation match not found.")

    match.pickup_window_start = schedule_data.pickup_window_start
    match.pickup_window_end = schedule_data.pickup_window_end
    if schedule_data.assigned_volunteer_id:
        match.assigned_volunteer_id = schedule_data.assigned_volunteer_id
    
    match.status = "scheduled"
    match.listing.status = "pickup_scheduled"

    now = datetime.now(timezone.utc)
    event = HandoffEvent(
        match_id=match.id,
        event_type="scheduled",
        occurred_at=now,
        notes=f"Pickup window scheduled: {schedule_data.pickup_window_start.isoformat()} to {schedule_data.pickup_window_end.isoformat()}",
        actor_user_id=current_user.id
    )
    db.add(event)

    # Audit log
    audit = AuditLog(
        actor_user_id=current_user.id,
        entity_type="donation_match",
        entity_id=str(match.id),
        action="schedule_pickup",
        metadata_json={
            "start": schedule_data.pickup_window_start.isoformat(),
            "end": schedule_data.pickup_window_end.isoformat()
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(match)
    return match


def record_handoff_event(
    db: Session,
    match_id: str,
    event_data: HandoffEventCreate,
    current_user: User
) -> HandoffEvent:
    """Record an operational handoff step or exception."""
    match = db.query(DonationMatch).filter(DonationMatch.id == match_id).first()
    if not match:
        raise NotFoundError("Donation match not found.")

    occurred = event_data.occurred_at or datetime.now(timezone.utc)
    qty = event_data.quantity_value or match.listing.quantity_value
    unit = event_data.quantity_unit or match.listing.quantity_unit

    event = HandoffEvent(
        match_id=match.id,
        event_type=event_data.event_type,
        quantity_value=qty,
        quantity_unit=unit,
        occurred_at=occurred,
        notes=event_data.notes,
        actor_user_id=current_user.id
    )
    db.add(event)

    # Update state based on event
    if event_data.event_type == "collected":
        match.listing.status = "picked_up"
    elif event_data.event_type == "delivered":
        match.listing.status = "delivered"
    elif event_data.event_type == "completed":
        match.listing.status = "completed"
        match.status = "completed"
    elif event_data.event_type == "exception":
        match.notes = f"Exception: {event_data.notes}"

    audit = AuditLog(
        actor_user_id=current_user.id,
        entity_type="handoff_event",
        entity_id=str(event.id),
        action=f"handoff_{event_data.event_type}",
        metadata_json={"quantity": f"{qty} {unit}", "notes": event_data.notes}
    )
    db.add(audit)
    db.commit()
    db.refresh(event)
    return event


def get_user_matches(db: Session, current_user: User) -> List[DonationMatch]:
    """Retrieve all matches relevant to the current user's organization or volunteer duties."""
    query = db.query(DonationMatch)
    
    if current_user.role == "donor" and current_user.organization_id:
        query = query.join(SurplusListing).filter(
            SurplusListing.donor_organization_id == current_user.organization_id
        )
    elif current_user.role == "recipient" and current_user.organization_id:
        query = query.filter(
            DonationMatch.recipient_organization_id == current_user.organization_id
        )
    elif current_user.role == "volunteer":
        # Volunteer sees assigned pickups as well as any open unassigned requests
        query = query.filter(
            (DonationMatch.assigned_volunteer_id == current_user.id) |
            (DonationMatch.assigned_volunteer_id == None)
        )
    # Admin sees all matches

    return query.order_by(DonationMatch.updated_at.desc()).all()


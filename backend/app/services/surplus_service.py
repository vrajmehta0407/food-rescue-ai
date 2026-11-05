from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from app.core.exceptions import NotFoundError, ForbiddenError, BadRequestError
from app.models.surplus import SurplusListing
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.surplus import SurplusListingCreate, SurplusListingUpdate


def get_listings(
    db: Session,
    donor_org_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    food_category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[SurplusListing]:
    """Retrieve surplus listings with automatic deadline expiry evaluation and filtering."""
    now = datetime.now(timezone.utc)
    
    query = db.query(SurplusListing)
    if donor_org_id:
        query = query.filter(SurplusListing.donor_organization_id == donor_org_id)
    if status_filter:
        query = query.filter(SurplusListing.status == status_filter)
    if food_category:
        query = query.filter(SurplusListing.food_category == food_category)
        
    listings = query.order_by(SurplusListing.created_at.desc()).offset(offset).limit(limit).all()

    # Dynamic check for deadline expiration on available listings
    updated = False
    for item in listings:
        deadline = item.pickup_deadline_at
        if deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        if item.status == "available" and deadline < now:
            item.status = "expired"
            updated = True
            
    if updated:
        db.commit()

    return listings


def get_listing_by_id(db: Session, listing_id: str) -> SurplusListing:
    """Retrieve a single surplus listing by ID."""
    listing = db.query(SurplusListing).filter(SurplusListing.id == listing_id).first()
    if not listing:
        raise NotFoundError(f"Surplus listing with id {listing_id} not found.")

    # Check expiration
    now = datetime.now(timezone.utc)
    deadline = listing.pickup_deadline_at
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if listing.status == "available" and deadline < now:
        listing.status = "expired"
        db.commit()

    return listing


def create_listing(db: Session, data: SurplusListingCreate, current_user: User) -> SurplusListing:
    """Create a new surplus listing for the donor's organization."""
    if not current_user.organization_id:
        raise BadRequestError("You must belong to an organization to create a surplus listing.")
    if current_user.role not in ["donor", "admin"]:
        raise ForbiddenError("Only donor organizations can create surplus listings.")

    now = datetime.now(timezone.utc)
    deadline = data.pickup_deadline_at
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
        
    if deadline <= now:
        raise BadRequestError("Pickup deadline must be in the future.")

    initial_status = "available" if data.publish_immediately else "draft"

    listing = SurplusListing(
        donor_organization_id=current_user.organization_id,
        title=data.title.strip(),
        food_category=data.food_category,
        description=data.description,
        quantity_value=data.quantity_value,
        quantity_unit=data.quantity_unit,
        prepared_at=data.prepared_at,
        best_before_at=data.best_before_at,
        pickup_deadline_at=deadline,
        storage_requirement=data.storage_requirement,
        allergens=data.allergens,
        dietary_tags=data.dietary_tags,
        status=initial_status,
        notes=data.notes
    )
    db.add(listing)
    db.flush()

    audit = AuditLog(
        actor_user_id=current_user.id,
        entity_type="surplus_listing",
        entity_id=str(listing.id),
        action="create_listing",
        metadata_json={
            "title": listing.title,
            "status": listing.status,
            "quantity": f"{listing.quantity_value} {listing.quantity_unit}"
        }
    )
    db.add(audit)
    db.commit()
    db.refresh(listing)
    return listing


def update_listing(
    db: Session,
    listing_id: str,
    data: SurplusListingUpdate,
    current_user: User
) -> SurplusListing:
    """Update a surplus listing, enforcing ownership."""
    listing = get_listing_by_id(db, listing_id)
    
    if current_user.role != "admin" and listing.donor_organization_id != current_user.organization_id:
        raise ForbiddenError("You can only modify listings belonging to your organization.")

    if listing.status not in ["draft", "available"]:
        raise BadRequestError(f"Cannot edit listing in '{listing.status}' status.")

    update_data = data.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(listing, field, val)

    audit = AuditLog(
        actor_user_id=current_user.id,
        entity_type="surplus_listing",
        entity_id=str(listing.id),
        action="update_listing",
        metadata_json=update_data
    )
    db.add(audit)
    db.commit()
    db.refresh(listing)
    return listing


def publish_listing(db: Session, listing_id: str, current_user: User) -> SurplusListing:
    """Transition a draft listing to available."""
    listing = get_listing_by_id(db, listing_id)
    
    if current_user.role != "admin" and listing.donor_organization_id != current_user.organization_id:
        raise ForbiddenError("You do not have permission to publish this listing.")

    if listing.status != "draft":
        raise BadRequestError(f"Listing is already in '{listing.status}' state.")

    now = datetime.now(timezone.utc)
    deadline = listing.pickup_deadline_at
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if deadline <= now:
        raise BadRequestError("Cannot publish listing with an expired pickup deadline.")

    listing.status = "available"
    
    audit = AuditLog(
        actor_user_id=current_user.id,
        entity_type="surplus_listing",
        entity_id=str(listing.id),
        action="publish_listing",
        metadata_json={"previous_status": "draft", "new_status": "available"}
    )
    db.add(audit)
    db.commit()
    db.refresh(listing)
    return listing


def cancel_listing(db: Session, listing_id: str, current_user: User) -> SurplusListing:
    """Cancel an active or draft listing."""
    listing = get_listing_by_id(db, listing_id)
    
    if current_user.role != "admin" and listing.donor_organization_id != current_user.organization_id:
        raise ForbiddenError("You do not have permission to cancel this listing.")

    if listing.status in ["completed", "delivered", "picked_up"]:
        raise BadRequestError("Cannot cancel a listing that is already picked up or completed.")

    old_status = listing.status
    listing.status = "cancelled"

    audit = AuditLog(
        actor_user_id=current_user.id,
        entity_type="surplus_listing",
        entity_id=str(listing.id),
        action="cancel_listing",
        metadata_json={"previous_status": old_status, "new_status": "cancelled"}
    )
    db.add(audit)
    db.commit()
    db.refresh(listing)
    return listing


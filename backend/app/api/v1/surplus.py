from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user, require_role
from app.models.user import User
from app.schemas.surplus import SurplusListingCreate, SurplusListingUpdate, SurplusListingResponse
from app.services.surplus_service import (
    get_listings,
    get_listing_by_id,
    create_listing,
    update_listing,
    publish_listing,
    cancel_listing,
)

router = APIRouter(prefix="/surplus-listings", tags=["Surplus Listings"])


@router.get("", response_model=List[SurplusListingResponse])
def list_listings(
    donor_organization_id: Optional[str] = None,
    status: Optional[str] = None,
    food_category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """List surplus food items with optional filters."""
    return get_listings(
        db=db,
        donor_org_id=donor_organization_id,
        status_filter=status,
        food_category=food_category,
        limit=limit,
        offset=offset
    )


@router.post("", response_model=SurplusListingResponse)
def create_new_listing(
    data: SurplusListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["donor", "admin"]))
):
    """Create a new surplus listing for the donor organization."""
    return create_listing(db=db, data=data, current_user=current_user)


@router.get("/{id}", response_model=SurplusListingResponse)
def get_single_listing(id: str, db: Session = Depends(get_db)):
    """Retrieve details and status for a single surplus listing."""
    return get_listing_by_id(db=db, listing_id=id)


@router.patch("/{id}", response_model=SurplusListingResponse)
def edit_listing(
    id: str,
    data: SurplusListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["donor", "admin"]))
):
    """Update details of a draft or active listing."""
    return update_listing(db=db, listing_id=id, data=data, current_user=current_user)


@router.post("/{id}/publish", response_model=SurplusListingResponse)
def publish_draft_listing(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["donor", "admin"]))
):
    """Publish a draft listing to the active network."""
    return publish_listing(db=db, listing_id=id, current_user=current_user)


@router.post("/{id}/cancel", response_model=SurplusListingResponse)
def cancel_active_listing(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["donor", "admin"]))
):
    """Cancel a surplus listing."""
    return cancel_listing(db=db, listing_id=id, current_user=current_user)


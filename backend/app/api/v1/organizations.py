from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.exceptions import NotFoundError, ForbiddenError
from app.api.deps import get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.schemas.organization import OrganizationResponse, OrganizationUpdate

router = APIRouter(prefix="/organizations", tags=["Organizations"])


@router.get("", response_model=List[OrganizationResponse])
def list_organizations(
    type: Optional[str] = None,
    verification_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List organizations with optional type and verification filter."""
    query = db.query(Organization)
    if type:
        query = query.filter(Organization.type == type)
    if verification_status:
        query = query.filter(Organization.verification_status == verification_status)
    return query.all()


@router.get("/{id}", response_model=OrganizationResponse)
def get_organization(id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific organization."""
    org = db.query(Organization).filter(Organization.id == id).first()
    if not org:
        raise NotFoundError("Organization not found.")
    return org


@router.patch("/{id}", response_model=OrganizationResponse)
def update_organization(
    id: str,
    data: OrganizationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update organization details (only organization members or admin)."""
    org = db.query(Organization).filter(Organization.id == id).first()
    if not org:
        raise NotFoundError("Organization not found.")

    if current_user.role != "admin" and str(current_user.organization_id) != id:
        raise ForbiddenError("You cannot modify another organization's settings.")

    for field, val in data.model_dump(exclude_unset=True).items():
        if val is not None:
            setattr(org, field, val)

    db.commit()
    db.refresh(org)
    return org


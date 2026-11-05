from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, TokenResponse, UserResponse
from app.services.auth_service import register_user, authenticate_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account with role-specific organization profile."""
    return register_user(db, data)


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive an access token."""
    return authenticate_user(db, data)


@router.get("/me")
def get_current_profile(current_user: User = Depends(get_current_user)):
    """Return the profile of the currently authenticated user and their organization."""
    org_data = None
    if current_user.organization:
        org = current_user.organization
        org_data = {
            "id": str(org.id),
            "name": org.name,
            "type": org.type,
            "verification_status": org.verification_status,
            "address": org.address,
            "latitude": org.latitude,
            "longitude": org.longitude,
            "service_radius_km": org.service_radius_km,
            "capacity_value": org.capacity_value,
            "capacity_unit": org.capacity_unit,
            "handling_capabilities": org.handling_capabilities,
        }

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "organization_id": str(current_user.organization_id) if current_user.organization_id else None,
        "organization": org_data,
        "is_active": current_user.is_active,
    }


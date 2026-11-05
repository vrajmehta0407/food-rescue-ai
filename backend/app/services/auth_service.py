from typing import Dict, Any
from sqlalchemy.orm import Session
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.exceptions import ConflictError, UnauthorizedError, BadRequestError
from app.models.user import User
from app.models.organization import Organization
from app.models.audit import AuditLog
from app.schemas.auth import UserRegister, UserLogin


def register_user(db: Session, data: UserRegister) -> Dict[str, Any]:
    """Register a new user and conditionally create their associated organization."""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing_user:
        raise ConflictError(f"A user with email {data.email} already exists.")

    org_id = None
    # If donor or recipient, an organization is required or created
    if data.role in ["donor", "recipient"]:
        org_name = data.organization_name or f"{data.full_name}'s Organization"
        org_type = data.organization_type or ("restaurant" if data.role == "donor" else "community_kitchen")
        org_address = data.organization_address or "100 Community Way, City Center"
        
        # Donors start verified or pending depending on role; recipients start pending admin verification
        initial_status = "verified" if data.role == "donor" else "pending"

        capabilities = data.handling_capabilities or {
            "ambient": True,
            "refrigerated": True,
            "frozen": False,
            "hot_holding": False
        }

        org = Organization(
            name=org_name,
            type=org_type,
            verification_status=initial_status,
            address=org_address,
            latitude=data.organization_latitude or 37.7749,
            longitude=data.organization_longitude or -122.4194,
            service_radius_km=data.service_radius_km or 15.0,
            capacity_value=data.capacity_value or 100.0,
            capacity_unit=data.capacity_unit or "kg",
            handling_capabilities=capabilities,
            contact_email=data.email.lower().strip()
        )
        db.add(org)
        db.flush()
        org_id = org.id

    hashed_pw = get_password_hash(data.password)
    user = User(
        email=data.email.lower().strip(),
        password_hash=hashed_pw,
        full_name=data.full_name.strip(),
        role=data.role,
        organization_id=org_id,
        is_active=True
    )
    db.add(user)
    db.flush()

    # Audit log
    audit = AuditLog(
        actor_user_id=user.id,
        entity_type="user",
        entity_id=str(user.id),
        action="register",
        metadata_json={"role": data.role, "email": user.email, "org_id": str(org_id) if org_id else None}
    )
    db.add(audit)
    db.commit()
    db.refresh(user)

    # Issue token
    claims = {
        "role": user.role,
        "org_id": str(user.organization_id) if user.organization_id else None,
        "name": user.full_name
    }
    token = create_access_token(subject=str(user.id), claims=claims)

    org_data = None
    if user.organization:
        org_data = {
            "id": str(user.organization.id),
            "name": user.organization.name,
            "type": user.organization.type,
            "verification_status": user.organization.verification_status,
            "capacity_value": user.organization.capacity_value,
            "capacity_unit": user.organization.capacity_unit,
        }

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": str(user.organization_id) if user.organization_id else None,
            "organization": org_data,
            "is_active": user.is_active,
        }
    }


def authenticate_user(db: Session, data: UserLogin) -> Dict[str, Any]:
    """Authenticate credentials and generate an access token."""
    user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if not user:
        raise UnauthorizedError("Invalid email or password.")
    
    if not verify_password(data.password, user.password_hash):
        raise UnauthorizedError("Invalid email or password.")
        
    if not user.is_active:
        raise UnauthorizedError("User account is disabled.")

    claims = {
        "role": user.role,
        "org_id": str(user.organization_id) if user.organization_id else None,
        "name": user.full_name
    }
    token = create_access_token(subject=str(user.id), claims=claims)

    org_data = None
    if user.organization:
        org_data = {
            "id": str(user.organization.id),
            "name": user.organization.name,
            "type": user.organization.type,
            "verification_status": user.organization.verification_status,
            "capacity_value": user.organization.capacity_value,
            "capacity_unit": user.organization.capacity_unit,
        }

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "organization_id": str(user.organization_id) if user.organization_id else None,
            "organization": org_data,
            "is_active": user.is_active,
        }
    }


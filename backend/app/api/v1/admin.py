from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.api.deps import require_role
from app.models.user import User
from app.models.organization import Organization
from app.models.audit import AuditLog
from app.schemas.organization import OrganizationResponse, OrganizationVerifyRequest
from app.services.notification_service import create_notification

router = APIRouter(prefix="/admin", tags=["Platform Administration"])


@router.get("/organizations/pending", response_model=List[OrganizationResponse])
def get_pending_organizations(
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    """Retrieve queue of recipient and donor organizations awaiting administrator verification."""
    return db.query(Organization).filter(
        Organization.verification_status == "pending"
    ).order_by(Organization.created_at.asc()).all()


@router.post("/organizations/{id}/verify", response_model=OrganizationResponse)
def set_organization_verification(
    id: str,
    data: OrganizationVerifyRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    """Approve, reject, or suspend an organization with audit rationale."""
    org = db.query(Organization).filter(Organization.id == id).first()
    if not org:
        raise NotFoundError("Organization not found.")

    old_status = org.verification_status
    org.verification_status = data.verification_status
    
    # Audit log
    audit = AuditLog(
        actor_user_id=admin_user.id,
        entity_type="organization",
        entity_id=str(org.id),
        action=f"verify_{data.verification_status}",
        metadata_json={
            "previous_status": old_status,
            "new_status": data.verification_status,
            "reason": data.reason or "Administrator verified eligibility and documentation."
        }
    )
    db.add(audit)

    # Notify org users
    for member in org.users:
        create_notification(
            db=db,
            user_id=member.id,
            type="org_verified",
            title=f"Organization Status Updated: {data.verification_status.capitalize()}",
            body=f"Your organization '{org.name}' has been {data.verification_status} by platform administrators.",
            link="/dashboard"
        )

    db.commit()
    db.refresh(org)
    return org


@router.get("/audit-logs")
def get_recent_audit_logs(
    limit: int = 50,
    db: Session = Depends(get_db),
    admin_user: User = Depends(require_role(["admin"]))
):
    """Inspect immutable security and lifecycle audit logs."""
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": str(l.id),
            "actor_user_id": str(l.actor_user_id) if l.actor_user_id else None,
            "actor_user_name": l.actor_user.full_name if l.actor_user else "System",
            "entity_type": l.entity_type,
            "entity_id": l.entity_id,
            "action": l.action,
            "metadata": l.metadata_json,
            "created_at": l.created_at
        }
        for l in logs
    ]


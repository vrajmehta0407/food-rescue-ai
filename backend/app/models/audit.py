from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base, GUID, JSONType
from app.models.base import generate_uuid


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    actor_user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    entity_type = Column(String(50), nullable=False, index=True)  # organization, surplus_listing, donation_match, handoff_event
    entity_id = Column(String(50), nullable=False, index=True)
    action = Column(String(100), nullable=False)  # create, update, publish, cancel, verify, handoff
    metadata_json = Column(JSONType, default=dict, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    actor_user = relationship("User", foreign_keys=[actor_user_id])


from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base, GUID
from app.models.base import generate_uuid


class HandoffEvent(Base):
    __tablename__ = "handoff_events"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    match_id = Column(GUID, ForeignKey("donation_matches.id", ondelete="CASCADE"), nullable=False, index=True)
    
    event_type = Column(String(50), nullable=False, index=True)  # scheduled, arrival, collected, delivered, exception, cancelled
    quantity_value = Column(Float, nullable=True)
    quantity_unit = Column(String(50), nullable=True)
    
    occurred_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    notes = Column(Text, nullable=True)
    actor_user_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Relationships
    match = relationship("DonationMatch", back_populates="handoff_events")
    actor_user = relationship("User", foreign_keys=[actor_user_id])


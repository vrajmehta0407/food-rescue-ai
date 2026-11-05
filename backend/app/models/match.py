from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base, GUID, JSONType
from app.models.base import TimestampMixin, generate_uuid


class MatchRecommendation(Base):
    __tablename__ = "match_recommendations"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    listing_id = Column(GUID, ForeignKey("surplus_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_organization_id = Column(GUID, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    eligibility_status = Column(String(50), nullable=False, default="eligible")  # eligible, ineligible
    score = Column(Float, nullable=False, default=0.0)  # 0 to 100
    reason_codes = Column(JSONType, default=list, nullable=False)  # [{"code": "CAPACITY_FIT", "label": "Capacity matches listing"}]
    model_version = Column(String(50), default="rule-engine-v1.0", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    listing = relationship("SurplusListing", back_populates="recommendations")
    recipient_organization = relationship("Organization", back_populates="recommendations")


class DonationMatch(Base, TimestampMixin):
    __tablename__ = "donation_matches"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    listing_id = Column(GUID, ForeignKey("surplus_listings.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_organization_id = Column(GUID, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    status = Column(String(50), default="suggested", nullable=False, index=True)  # suggested, accepted, declined, scheduled, completed, cancelled
    accepted_at = Column(DateTime, nullable=True)
    
    pickup_window_start = Column(DateTime, nullable=True)
    pickup_window_end = Column(DateTime, nullable=True)
    
    assigned_volunteer_id = Column(GUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    # Relationships
    listing = relationship("SurplusListing", back_populates="matches")
    recipient_organization = relationship("Organization", back_populates="matches_as_recipient")
    assigned_volunteer = relationship("User", foreign_keys=[assigned_volunteer_id])
    handoff_events = relationship("HandoffEvent", back_populates="match", cascade="all, delete-orphan")


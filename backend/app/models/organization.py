from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base, GUID, JSONType
from app.models.base import TimestampMixin, generate_uuid


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(50), nullable=False, index=True)  # restaurant, bakery, grocery, ngo, shelter, kitchen
    verification_status = Column(String(50), default="pending", nullable=False, index=True)  # pending, verified, rejected, suspended
    
    address = Column(String(500), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    service_radius_km = Column(Float, default=15.0, nullable=True)
    
    capacity_value = Column(Float, default=100.0, nullable=False)
    capacity_unit = Column(String(20), default="kg", nullable=False)  # kg, portions, packs
    handling_capabilities = Column(JSONType, default=dict, nullable=False)  # {"ambient": True, "refrigerated": True, "frozen": False, "hot_holding": False}

    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)

    # Relationships
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    surplus_listings = relationship("SurplusListing", back_populates="donor_organization", cascade="all, delete-orphan")
    matches_as_recipient = relationship("DonationMatch", back_populates="recipient_organization", cascade="all, delete-orphan")
    recommendations = relationship("MatchRecommendation", back_populates="recipient_organization", cascade="all, delete-orphan")
    predictions = relationship("PredictionRecord", back_populates="organization", cascade="all, delete-orphan")


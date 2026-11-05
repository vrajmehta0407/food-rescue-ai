from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base, GUID, JSONType
from app.models.base import TimestampMixin, generate_uuid


class SurplusListing(Base, TimestampMixin):
    __tablename__ = "surplus_listings"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    donor_organization_id = Column(GUID, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    title = Column(String(255), nullable=False)
    food_category = Column(String(100), nullable=False, index=True)  # prepared_meals, produce, bakery, dairy, meat, packaged
    description = Column(Text, nullable=True)
    
    quantity_value = Column(Float, nullable=False)
    quantity_unit = Column(String(50), nullable=False, default="portions")  # portions, kg, packs, crates
    
    prepared_at = Column(DateTime, nullable=True)
    best_before_at = Column(DateTime, nullable=True)
    pickup_deadline_at = Column(DateTime, nullable=False, index=True)
    
    storage_requirement = Column(String(50), nullable=False, default="ambient")  # ambient, refrigerated, frozen, hot_holding
    allergens = Column(JSONType, default=list, nullable=False)  # ["dairy", "gluten", "nuts"]
    dietary_tags = Column(JSONType, default=list, nullable=False)  # ["vegetarian", "vegan", "halal"]
    
    status = Column(String(50), default="available", nullable=False, index=True)  # draft, available, reserved, pickup_scheduled, picked_up, delivered, completed, cancelled, expired, failed
    notes = Column(Text, nullable=True)

    # Relationships
    donor_organization = relationship("Organization", back_populates="surplus_listings")
    matches = relationship("DonationMatch", back_populates="listing", cascade="all, delete-orphan")
    recommendations = relationship("MatchRecommendation", back_populates="listing", cascade="all, delete-orphan")


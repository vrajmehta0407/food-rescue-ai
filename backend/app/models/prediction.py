from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base, GUID
from app.models.base import generate_uuid


class PredictionRecord(Base):
    __tablename__ = "prediction_records"

    id = Column(GUID, primary_key=True, default=generate_uuid)
    organization_id = Column(GUID, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    
    forecast_date = Column(Date, nullable=False, index=True)
    food_category = Column(String(100), nullable=True, index=True)
    
    predicted_quantity = Column(Float, nullable=False)
    lower_bound = Column(Float, nullable=True)
    upper_bound = Column(Float, nullable=True)
    
    model_version = Column(String(50), default="hist-gb-v1.0", nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="predictions")


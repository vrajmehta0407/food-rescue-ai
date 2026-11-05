import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, DateTime
from app.core.database import Base, GUID


class TimestampMixin:
    """Provides created_at and updated_at UTC timestamps."""
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )


def generate_uuid() -> str:
    return str(uuid.uuid4())


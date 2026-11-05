from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.analytics import AnalyticsSummaryResponse
from app.services.analytics_service import get_impact_analytics

router = APIRouter(prefix="/analytics", tags=["Impact Analytics"])


@router.get("/impact", response_model=AnalyticsSummaryResponse)
def get_platform_impact(
    donor_organization_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retrieve platform-wide or donor-specific impact metrics derived from real database records."""
    return get_impact_analytics(db=db, donor_org_id=donor_organization_id)


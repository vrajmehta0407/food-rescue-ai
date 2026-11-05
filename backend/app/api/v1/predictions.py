from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.prediction import ForecastResponse
from app.services.prediction_service import generate_forecast

router = APIRouter(prefix="/predictions", tags=["ML Surplus Predictions"])


@router.get("/forecast", response_model=ForecastResponse)
def get_surplus_forecast(
    organization_id: Optional[str] = None,
    days: int = Query(default=7, ge=1, le=30),
    food_category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve surplus forecast with uncertainty intervals and cold-start fallback."""
    target_org_id = organization_id or str(current_user.organization_id)
    return generate_forecast(
        db=db,
        org_id=target_org_id,
        days=days,
        food_category=food_category
    )


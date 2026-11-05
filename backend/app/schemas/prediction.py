from typing import Optional, List, Dict, Any
from datetime import date
from pydantic import BaseModel


class ForecastPoint(BaseModel):
    date: str
    day_name: str
    predicted_quantity: float
    lower_bound: float
    upper_bound: float
    confidence_level: float = 0.90
    factors: List[str] = []


class ForecastResponse(BaseModel):
    organization_id: str
    food_category: Optional[str] = "all"
    forecast_horizon_days: int
    is_cold_start: bool
    cold_start_disclaimer: Optional[str] = None
    baseline_model: str
    candidate_model: str
    model_version: str
    historical_points_available: int
    metrics_summary: Optional[Dict[str, Any]] = None
    forecast: List[ForecastPoint]


from typing import List, Dict, Any
from pydantic import BaseModel


class ImpactMetricResponse(BaseModel):
    total_listings: int
    active_listings: int
    total_rescued_kg: float
    total_meals_saved_estimate: int
    co2e_avoided_kg_estimate: float
    successful_rescue_rate_percent: float
    average_match_time_minutes: float
    expired_count: int
    cancelled_count: int
    completed_rescues_count: int


class CategoryBreakdownItem(BaseModel):
    category: str
    count: int
    quantity_kg: float
    percentage: float


class MonthlyRescueTrend(BaseModel):
    month: str
    rescued_kg: float
    meals_estimate: int


class AnalyticsSummaryResponse(BaseModel):
    metrics: ImpactMetricResponse
    categories: List[CategoryBreakdownItem]
    monthly_trends: List[MonthlyRescueTrend]
    methodology_notes: Dict[str, str]


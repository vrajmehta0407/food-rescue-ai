"""Deterministic Impact Calculator (architecture.md #3.6 & agents.md #5)."""

import json
from pathlib import Path
from pydantic import BaseModel, Field

from app.config import IMPACT_FACTORS_PATH


class ImpactCalculateRequest(BaseModel):
    category: str
    portions: int = Field(gt=0)
    kg_override: float | None = Field(default=None, gt=0)


class ImpactCalculateResponse(BaseModel):
    meals: int
    kg: float
    co2e_kg: float
    value_inr: float
    notice: str = "Sample data — verify before production use."


def load_impact_factors(path: Path = IMPACT_FACTORS_PATH) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def calculate_impact(req: ImpactCalculateRequest, factors_path: Path = IMPACT_FACTORS_PATH) -> ImpactCalculateResponse:
    """Compute meals, kg, CO2e avoided, and INR value using fixed deterministic factors."""
    factors = load_impact_factors(factors_path)
    cat = factors.get("categories", {}).get(req.category, {})

    kg_per_portion = float(cat.get("kg_per_portion", factors.get("default_kg_per_portion", 0.35)))
    co2e_per_kg = float(cat.get("co2e_kg_per_kg_food", 2.0))
    inr_per_portion = float(cat.get("inr_per_portion", factors.get("default_inr_per_meal", 45.0)))

    meals = int(req.portions)
    kg = round(float(req.kg_override) if req.kg_override is not None else meals * kg_per_portion, 2)
    co2e_kg = round(kg * co2e_per_kg, 2)
    value_inr = round(meals * inr_per_portion, 2)

    return ImpactCalculateResponse(
        meals=meals,
        kg=kg,
        co2e_kg=co2e_kg,
        value_inr=value_inr,
    )


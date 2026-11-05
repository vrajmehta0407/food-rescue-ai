import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.organization import Organization
from app.models.surplus import SurplusListing
from app.models.prediction import PredictionRecord
from app.schemas.prediction import ForecastResponse, ForecastPoint

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "ml", "artifacts")
MODEL_PATH = os.path.join(ARTIFACTS_DIR, "surplus_model.joblib")
METRICS_PATH = os.path.join(ARTIFACTS_DIR, "metrics.json")


def load_model_bundle() -> Optional[Dict[str, Any]]:
    """Load model bundle if present on disk."""
    if os.path.exists(MODEL_PATH):
        try:
            return joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Warning: could not load model artifact: {e}")
    return None


def load_metrics_summary() -> Optional[Dict[str, Any]]:
    """Load reproducible training metrics if available."""
    if os.path.exists(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return None


def generate_forecast(
    db: Session,
    org_id: str,
    days: int = 7,
    food_category: Optional[str] = None
) -> ForecastResponse:
    """Generate multi-day surplus forecast with confidence intervals and transparent cold-start fallback."""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    org_type = org.type if org else "restaurant"

    # Count historical listings by this organization
    historical_count = db.query(SurplusListing).filter(
        SurplusListing.donor_organization_id == org_id
    ).count()

    bundle = load_model_bundle()
    metrics = load_metrics_summary()

    # Rule-based / cold-start conditions
    is_cold_start = (historical_count < 5) or (bundle is None)
    
    # Base estimated daily surplus by organization type
    type_defaults = {
        "restaurant": 22.0,
        "bakery": 16.0,
        "grocery": 48.0,
        "caterer": 30.0,
        "hotel": 38.0,
        "campus_dining": 45.0,
    }
    base_kg = type_defaults.get(org_type, 20.0)

    # Compute baseline from past listings if available
    if historical_count > 0:
        recent_listings = db.query(SurplusListing).filter(
            SurplusListing.donor_organization_id == org_id
        ).order_by(SurplusListing.created_at.desc()).limit(14).all()
        if recent_listings:
            avg_past = sum(l.quantity_value for l in recent_listings) / len(recent_listings)
            base_kg = (base_kg * 0.3) + (avg_past * 0.7)

    forecast_points: List[ForecastPoint] = []
    now = datetime.now(timezone.utc)

    for i in range(1, days + 1):
        target_date = now + timedelta(days=i)
        dow = target_date.weekday()
        day_name = target_date.strftime("%A")
        date_str = target_date.strftime("%Y-%m-%d")

        is_weekend = dow in [4, 5, 6]  # Fri, Sat, Sun
        dow_factor = 1.35 if (is_weekend and org_type in ["restaurant", "caterer", "hotel"]) else 1.0

        factors = []
        if is_weekend:
            factors.append("Weekend service surge")
        if dow == 0:
            factors.append("Post-weekend inventory cycle")
        if dow in [1, 2, 3]:
            factors.append("Mid-week baseline consistency")

        if not is_cold_start and bundle:
            # Predict using trained regressor
            regressor = bundle["model"]
            feature_cols = bundle["feature_cols"]

            # Construct row
            row_dict = {
                "day_of_week": dow,
                "month": target_date.month,
                "is_weekend": 1 if is_weekend else 0,
                "rolling_7d_mean": base_kg,
            }
            # Add one-hot keys
            for col in feature_cols:
                if col.startswith("food_category_") and food_category and food_category in col:
                    row_dict[col] = 1
                elif col.startswith("donor_type_") and org_type in col:
                    row_dict[col] = 1
                elif col not in row_dict:
                    row_dict[col] = 0

            feature_vector = np.array([[row_dict.get(c, 0) for c in feature_cols]])
            raw_pred = float(regressor.predict(feature_vector)[0])
            pred_kg = max(5.0, round(raw_pred, 1))
            uncertainty = max(2.5, pred_kg * 0.18)
        else:
            # Deterministic rule-based forecast
            pred_kg = round(base_kg * dow_factor, 1)
            uncertainty = round(pred_kg * 0.28, 1)
            factors.append("Cold-start heuristic estimate")

        lower = max(1.0, round(pred_kg - uncertainty, 1))
        upper = round(pred_kg + uncertainty, 1)

        forecast_points.append(ForecastPoint(
            date=date_str,
            day_name=day_name,
            predicted_quantity=pred_kg,
            lower_bound=lower,
            upper_bound=upper,
            confidence_level=0.90,
            factors=factors
        ))

    disclaimer = (
        "Cold-start guidance: Forecast is calculated via operational baseline rules. "
        "As your organization publishes more listings over time, machine learning models "
        "will automatically calibrate personalized seasonal predictions."
        if is_cold_start else None
    )

    return ForecastResponse(
        organization_id=org_id,
        food_category=food_category or "all",
        forecast_horizon_days=days,
        is_cold_start=is_cold_start,
        cold_start_disclaimer=disclaimer,
        baseline_model="7-Day Seasonal Rolling Mean",
        candidate_model="HistGradientBoostingRegressor",
        model_version=bundle.get("model_version", "rule-based-v1.0") if bundle else "rule-based-v1.0",
        historical_points_available=historical_count,
        metrics_summary=metrics,
        forecast=forecast_points
    )


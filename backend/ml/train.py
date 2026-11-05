import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, root_mean_squared_error


def generate_synthetic_surplus_data(n_days: int = 180) -> pd.DataFrame:
    """Generate realistic daily surplus observations for training and evaluation.
    Features: day_of_week, month, is_weekend, food_category, donor_type, rolling_7d_mean.
    """
    np.random.seed(42)
    start_date = datetime.now(timezone.utc) - timedelta(days=n_days)
    
    records = []
    donor_profiles = [
        {"id": "donor-bistro", "type": "restaurant", "base_kg": 25.0, "category": "prepared_meals"},
        {"id": "donor-bakery", "type": "bakery", "base_kg": 18.0, "category": "bakery"},
        {"id": "donor-grocery", "type": "grocery", "base_kg": 50.0, "category": "produce"},
        {"id": "donor-caterer", "type": "caterer", "base_kg": 35.0, "category": "prepared_meals"},
    ]

    for d in range(n_days):
        current_date = start_date + timedelta(days=d)
        dow = current_date.weekday()
        month = current_date.month
        is_weekend = 1 if dow in [4, 5, 6] else 0  # Friday, Saturday, Sunday higher surplus

        for donor in donor_profiles:
            # Baseline surplus
            base = donor["base_kg"]
            
            # Weekend surge for restaurants/caterers; weekday steady for grocery
            dow_multiplier = 1.35 if (is_weekend and donor["type"] in ["restaurant", "caterer"]) else 1.0
            
            # Category seasonality
            cat_noise = np.random.normal(0, base * 0.15)
            seasonal_factor = 1.0 + 0.1 * np.sin(2 * np.pi * d / 365.0)

            # Simulated surplus quantity in kg
            surplus_kg = max(2.0, (base * dow_multiplier * seasonal_factor) + cat_noise)

            records.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "donor_id": donor["id"],
                "donor_type": donor["type"],
                "food_category": donor["category"],
                "day_of_week": dow,
                "month": month,
                "is_weekend": is_weekend,
                "surplus_kg": round(surplus_kg, 2),
            })

    df = pd.DataFrame(records)
    
    # Calculate rolling 7-day lagged average (avoiding target leakage by shifting)
    df["rolling_7d_mean"] = (
        df.groupby(["donor_id", "food_category"])["surplus_kg"]
        .shift(1)
        .rolling(window=7, min_periods=1)
        .mean()
        .bfill()
    )
    
    return df


def calculate_wape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    """Weighted Absolute Percentage Error (WAPE)."""
    total_actual = np.sum(y_true)
    if total_actual == 0:
        return 0.0
    return float(np.sum(np.abs(y_true - y_pred)) / total_actual * 100.0)


def train_and_evaluate():
    """Execute chronological train/test split, evaluate baseline vs candidate regressor, and save artifacts."""
    print("Generating synthetic surplus dataset...")
    df = generate_synthetic_surplus_data(n_days=180)

    # Chronological Split (Last 20% of dates for test set)
    unique_dates = sorted(df["date"].unique())
    split_idx = int(len(unique_dates) * 0.8)
    train_dates = set(unique_dates[:split_idx])
    test_dates = set(unique_dates[split_idx:])

    train_df = df[df["date"].isin(train_dates)].copy()
    test_df = df[df["date"].isin(test_dates)].copy()

    features = ["day_of_week", "month", "is_weekend", "rolling_7d_mean"]
    
    # One-hot encode category and donor_type
    train_encoded = pd.get_dummies(train_df, columns=["food_category", "donor_type"], drop_first=True)
    test_encoded = pd.get_dummies(test_df, columns=["food_category", "donor_type"], drop_first=True)
    
    # Align columns
    train_encoded, test_encoded = train_encoded.align(test_encoded, join="left", axis=1, fill_value=0)

    feature_cols = [c for c in train_encoded.columns if c not in ["date", "donor_id", "surplus_kg"]]

    X_train = train_encoded[feature_cols].values
    y_train = train_encoded["surplus_kg"].values
    X_test = test_encoded[feature_cols].values
    y_test = test_encoded["surplus_kg"].values

    # 1. Baseline Model: 7-day rolling mean
    baseline_pred = test_df["rolling_7d_mean"].values
    baseline_mae = float(mean_absolute_error(y_test, baseline_pred))
    baseline_rmse = float(root_mean_squared_error(y_test, baseline_pred))
    baseline_wape = calculate_wape(y_test, baseline_pred)

    print(f"--- Baseline Model (7-Day Rolling Naive) ---")
    print(f"MAE:  {baseline_mae:.2f} kg")
    print(f"RMSE: {baseline_rmse:.2f} kg")
    print(f"WAPE: {baseline_wape:.2f} %")

    # 2. Candidate Model: HistGradientBoostingRegressor
    regressor = HistGradientBoostingRegressor(
        max_iter=150,
        learning_rate=0.08,
        max_depth=5,
        random_state=42
    )
    regressor.fit(X_train, y_train)

    candidate_pred = regressor.predict(X_test)
    candidate_mae = float(mean_absolute_error(y_test, candidate_pred))
    candidate_rmse = float(root_mean_squared_error(y_test, candidate_pred))
    candidate_wape = calculate_wape(y_test, candidate_pred)

    print(f"--- Candidate Model (HistGradientBoostingRegressor) ---")
    print(f"MAE:  {candidate_mae:.2f} kg")
    print(f"RMSE: {candidate_rmse:.2f} kg")
    print(f"WAPE: {candidate_wape:.2f} %")

    # Relative improvement
    mae_improvement = ((baseline_mae - candidate_mae) / baseline_mae) * 100.0

    # Ensure output directories exist
    artifacts_dir = os.path.join(os.path.dirname(__file__), "artifacts")
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(artifacts_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)

    # Save synthetic dataset for transparency
    dataset_path = os.path.join(data_dir, "surplus_history.csv")
    df.to_csv(dataset_path, index=False)

    # Save candidate model bundle
    bundle = {
        "model": regressor,
        "feature_cols": feature_cols,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "model_version": "hist-gb-v1.0"
    }
    model_path = os.path.join(artifacts_dir, "surplus_model.joblib")
    joblib.dump(bundle, model_path)

    # Save metrics JSON
    metrics = {
        "model_version": "hist-gb-v1.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "split_method": "chronological (80/20 time-series)",
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "baseline": {
            "name": "7-Day Seasonal Rolling Mean",
            "mae_kg": round(baseline_mae, 2),
            "rmse_kg": round(baseline_rmse, 2),
            "wape_percent": round(baseline_wape, 2),
        },
        "candidate": {
            "name": "HistGradientBoostingRegressor",
            "mae_kg": round(candidate_mae, 2),
            "rmse_kg": round(candidate_rmse, 2),
            "wape_percent": round(candidate_wape, 2),
        },
        "mae_improvement_percent": round(mae_improvement, 2),
        "status": "candidate_outperforms_baseline" if candidate_mae <= baseline_mae else "baseline_preferred"
    }
    metrics_path = os.path.join(artifacts_dir, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Artifacts successfully saved to {artifacts_dir}")
    return metrics


if __name__ == "__main__":
    train_and_evaluate()


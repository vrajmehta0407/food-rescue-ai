from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.impact.calculator import ImpactCalculateRequest, calculate_impact
from app.matching.engine import MatchRankRequest, ReceiverCandidate, rank_receivers
from app.pii import redact_pii
from app.safety.engine import SafetyEvaluateRequest, evaluate_safety


NOW = datetime(2026, 11, 12, 12, 0, tzinfo=timezone.utc)


def test_safety_cooked_rice_approved():
    res = evaluate_safety(
        SafetyEvaluateRequest(
            category="cooked_rice_dish",
            prepared_at=NOW - timedelta(minutes=20),
            storage_method="ambient",
            packaging="sealed_containers",
            now=NOW,
        )
    )
    assert res.decision == "APPROVE"
    assert res.remaining_minutes == 100


def test_safety_cooked_rice_warning_in_last_30_min():
    res = evaluate_safety(
        SafetyEvaluateRequest(
            category="cooked_rice_dish",
            prepared_at=NOW - timedelta(minutes=90),
            storage_method="ambient",
            packaging="sealed_containers",
            now=NOW,
        )
    )
    # 120 - 90 = 30 min remaining -> APPROVE_WITH_WARNING
    assert res.decision == "APPROVE_WITH_WARNING"
    assert res.remaining_minutes == 30


def test_safety_cooked_rice_blocked_when_under_30_min():
    res = evaluate_safety(
        SafetyEvaluateRequest(
            category="cooked_rice_dish",
            prepared_at=NOW - timedelta(minutes=95),
            storage_method="ambient",
            packaging="sealed_containers",
            now=NOW,
        )
    )
    assert res.decision == "BLOCK"
    assert res.remaining_minutes == 25


def test_safety_raw_meat_always_blocked():
    res = evaluate_safety(
        SafetyEvaluateRequest(
            category="raw_meat_seafood",
            prepared_at=NOW - timedelta(minutes=5),
            storage_method="chilled",
            packaging="sealed_containers",
            now=NOW,
        )
    )
    assert res.decision == "BLOCK"


def test_safety_unknown_category_blocked():
    res = evaluate_safety(
        SafetyEvaluateRequest(
            category="mystery_item",
            prepared_at=NOW - timedelta(minutes=5),
            now=NOW,
        )
    )
    assert res.decision == "BLOCK"


def test_pii_redaction():
    raw = "Call +91 98765 43210 or email raj@spicehub.in at 42 CG Road, Navrangpura"
    masked = redact_pii(raw)
    assert "98765" not in masked
    assert "raj@spicehub.in" not in masked
    assert "42 CG Road" not in masked
    assert "[REDACTED_PHONE]" in masked
    assert "[REDACTED_EMAIL]" in masked
    assert "[REDACTED_ADDRESS]" in masked


def test_impact_calculator_deterministic():
    res = calculate_impact(ImpactCalculateRequest(category="cooked_rice_dish", portions=40))
    assert res.meals == 40
    assert res.kg == 14.0
    assert res.co2e_kg == 37.8
    assert res.value_inr == 1800.0
    assert "Sample data" in res.notice


def test_matching_filters_and_ranks():
    req = MatchRankRequest(
        listing_lat=23.0225,
        listing_lon=72.5714,
        portions=50,
        veg=False,
        safe_by=NOW + timedelta(minutes=90),
        candidates=[
            ReceiverCandidate(
                receiver_id="r1",
                org_name="Veg Only Shelter",
                lat=23.023,
                lon=72.572,
                daily_demand_portions=100,
                dietary_preference="veg_only",
            ),
            ReceiverCandidate(
                receiver_id="r2",
                org_name="Asha Community Kitchen",
                lat=23.030,
                lon=72.580,
                daily_demand_portions=80,
                max_single_pickup_portions=30,
                dietary_preference="any",
                hours_since_last_rescue=20,
            ),
            ReceiverCandidate(
                receiver_id="r3",
                org_name="Seva Night Shelter",
                lat=23.035,
                lon=72.585,
                daily_demand_portions=60,
                max_single_pickup_portions=30,
                dietary_preference="any",
                hours_since_last_rescue=10,
            ),
        ],
        now=NOW,
    )
    res = rank_receivers(req)
    assert len(res.matches) == 2
    assert res.matches[0].receiver_id == "r2"
    assert res.split_suggestion is not None
    assert res.split_suggestion.primary_portions == 30
    assert res.split_suggestion.secondary_portions == 20


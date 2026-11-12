from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.chat.assistant import ChatAskRequest, answer_helper_chat
from app.impact.calculator import ImpactCalculateRequest, calculate_impact
from app.logistics.router import (
    BatchRequest,
    ReassignRequest,
    batch_nearby_pickups,
    handle_volunteer_stall,
)
from app.matching.engine import MatchRankRequest, ReceiverCandidate, rank_receivers
from app.moderation.trust import ModerationInput, evaluate_trust_and_moderation
from app.safety.engine import SafetyEvaluateRequest, evaluate_safety


NOW = datetime(2026, 11, 12, 12, 0, tzinfo=timezone.utc)


def test_safety_10_golden_cases():
    # 1. Dairy sweets chilled (approved)
    r1 = evaluate_safety(
        SafetyEvaluateRequest(
            category="dairy_sweets",
            prepared_at=NOW - timedelta(hours=4),
            storage_method="chilled",
            packaging="sealed_containers",
            now=NOW,
        )
    )
    assert r1.decision == "APPROVE"

    # 2. Cut fruit beyond 2h ambient (blocked)
    r2 = evaluate_safety(
        SafetyEvaluateRequest(
            category="cut_fruit_salad",
            prepared_at=NOW - timedelta(hours=2, minutes=15),
            storage_method="ambient",
            packaging="sealed_containers",
            now=NOW,
        )
    )
    assert r2.decision == "BLOCK"

    # 3. Sealed packaged dry staples after 24h (approved)
    r3 = evaluate_safety(
        SafetyEvaluateRequest(
            category="packaged_dry_staples",
            prepared_at=NOW - timedelta(hours=24),
            storage_method="ambient",
            packaging="sealed_containers",
            now=NOW,
        )
    )
    assert r3.decision == "APPROVE"

    # 4. Breads & rotis open/unsealed triggers APPROVE_WITH_WARNING
    r4 = evaluate_safety(
        SafetyEvaluateRequest(
            category="breads_rotis",
            prepared_at=NOW - timedelta(hours=1),
            storage_method="ambient",
            packaging="open_unsealed",
            now=NOW,
        )
    )
    assert r4.decision == "APPROVE_WITH_WARNING"

    # 5. Unpasteurized dairy always blocked
    r5 = evaluate_safety(
        SafetyEvaluateRequest(
            category="unpasteurized_dairy",
            prepared_at=NOW - timedelta(minutes=5),
            storage_method="chilled",
            packaging="sealed_containers",
            now=NOW,
        )
    )
    assert r5.decision == "BLOCK"

    # 6. Future prepared_at timestamp blocked
    r6 = evaluate_safety(
        SafetyEvaluateRequest(
            category="cooked_curry_dal",
            prepared_at=NOW + timedelta(hours=2),
            now=NOW,
        )
    )
    assert r6.decision == "BLOCK"


def test_logistics_batching_and_stall_reassignment():
    # Batching two nearby Ahmedabad pickups within 2km
    batches = batch_nearby_pickups(
        BatchRequest(
            tasks=[
                {
                    "task_id": "t1",
                    "listing_id": "l1",
                    "lat": 23.0225,
                    "lon": 72.5714,
                    "safe_by": NOW + timedelta(minutes=90),
                    "portions": 30,
                },
                {
                    "task_id": "t2",
                    "listing_id": "l2",
                    "lat": 23.0285,
                    "lon": 72.5760,
                    "safe_by": NOW + timedelta(minutes=110),
                    "portions": 25,
                },
                {
                    "task_id": "t3",
                    "listing_id": "l3",
                    "lat": 23.1200,
                    "lon": 72.6500,
                    "safe_by": NOW + timedelta(minutes=95),
                    "portions": 40,
                },
            ]
        )
    )
    assert len(batches) == 2
    assert batches[0].task_ids == ["t1", "t2"]

    # Volunteer stall >= 10 min reassigns to nearest rider
    reassign_res = handle_volunteer_stall(
        ReassignRequest(
            task_id="t1",
            current_volunteer_id="v1",
            stalled_minutes=12,
            pickup_lat=23.0225,
            pickup_lon=72.5714,
            volunteers=[
                {
                    "volunteer_id": "v1",
                    "name": "Stalled Rider",
                    "lat": 23.022,
                    "lon": 72.571,
                    "available": True,
                },
                {
                    "volunteer_id": "v2",
                    "name": "Riya Shah",
                    "lat": 23.026,
                    "lon": 72.574,
                    "available": True,
                },
            ],
        )
    )
    assert reassign_res.assigned_volunteer_id == "v2"
    assert reassign_res.fallback_mode == "volunteer"

    # No volunteers available -> receiver_self_pickup fallback
    self_res = handle_volunteer_stall(
        ReassignRequest(
            task_id="t1",
            current_volunteer_id="v1",
            stalled_minutes=15,
            pickup_lat=23.0225,
            pickup_lon=72.5714,
            volunteers=[],
        )
    )
    assert self_res.fallback_mode == "receiver_self_pickup"


def test_moderation_never_auto_bans():
    res = evaluate_trust_and_moderation(
        ModerationInput(
            profile_id="usr-99",
            current_trust_score=3.5,
            recent_ratings=[1, 2],
            flags_count=2,
            no_shows_count=1,
            photo_mismatch_count=1,
            account_age_days=1,
            listings_last_24h=8,
        )
    )
    assert res.auto_banned is False
    assert res.escalate_to_admin is True
    assert res.throttled is True


def test_helper_chat_multilingual_and_guardrails():
    r_en = answer_helper_chat(
        ChatAskRequest(message="How long can sweets stay out?", language="en")
    )
    assert "get_safety_rule" in r_en.tools_used

    r_hi = answer_helper_chat(
        ChatAskRequest(message="मिठाई कितनी देर सुरक्षित रहती है?", language="hi")
    )
    assert "get_safety_rule" in r_hi.tools_used

    r_gu = answer_helper_chat(
        ChatAskRequest(message="બિરયાની કેટલો સમય સુરક્ષિત રહે?", language="gu")
    )
    assert "get_safety_rule" in r_gu.tools_used

    r_med = answer_helper_chat(
        ChatAskRequest(message="Someone got sick hospital food poison", language="en")
    )
    assert "medical" in r_med.reply.lower()


def test_orchestrator_flow_safety_impact_matching():
    safety = evaluate_safety(
        SafetyEvaluateRequest(
            category="cooked_rice_dish",
            prepared_at=NOW,
            storage_method="ambient",
            packaging="sealed_containers",
            now=NOW,
        )
    )
    assert safety.decision == "APPROVE"
    impact = calculate_impact(ImpactCalculateRequest(category="cooked_rice_dish", portions=40))
    assert impact.meals == 40
    matching = rank_receivers(
        MatchRankRequest(
            listing_lat=23.0225,
            listing_lon=72.5714,
            portions=40,
            veg=True,
            safe_by=safety.safe_by,
            candidates=[
                ReceiverCandidate(
                    receiver_id="ngo-1",
                    org_name="Seva Shelter",
                    lat=23.025,
                    lon=72.575,
                    daily_demand_portions=100,
                )
            ],
            now=NOW,
        )
    )
    assert len(matching.matches) == 1

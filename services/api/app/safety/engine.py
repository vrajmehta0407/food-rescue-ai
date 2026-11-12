"""Deterministic Food Safety Rules Engine (agents.md #2 & architecture.md #3.2)."""

from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

from app.config import SAFETY_RULES_PATH


SafetyDecision = Literal["APPROVE", "APPROVE_WITH_WARNING", "BLOCK"]
StorageMethod = Literal["ambient", "chilled"]
PackagingType = Literal["sealed_containers", "covered_trays", "open_unsealed"]


class SafetyEvaluateRequest(BaseModel):
    category: str
    prepared_at: datetime
    storage_method: StorageMethod = "ambient"
    packaging: PackagingType = "sealed_containers"
    now: datetime | None = None


class SafetyEvaluateResponse(BaseModel):
    decision: SafetyDecision
    safe_by: datetime
    remaining_minutes: int
    explanation: str
    rule_notes: str
    warning_thresholds_minutes: list[int] = Field(default_factory=lambda: [60, 30, 10])
    is_sample_rule: bool = True


def load_safety_rules(path: Path = SAFETY_RULES_PATH) -> dict:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def evaluate_safety(req: SafetyEvaluateRequest, rules_path: Path = SAFETY_RULES_PATH) -> SafetyEvaluateResponse:
    """Compute safe_by and deterministic food safety decision from rules table."""
    rules = load_safety_rules(rules_path)
    categories = rules.get("categories", {})
    packaging_multipliers = rules.get("packaging_multipliers", {})
    min_remaining = int(rules.get("minimum_remaining_minutes_to_approve", 30))

    now = req.now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    prepared_at = req.prepared_at
    if prepared_at.tzinfo is None:
        prepared_at = prepared_at.replace(tzinfo=timezone.utc)

    cat_rule = categories.get(req.category)
    if not cat_rule:
        return SafetyEvaluateResponse(
            decision="BLOCK",
            safe_by=now,
            remaining_minutes=0,
            explanation=f"Category '{req.category}' is not in the approved safety rules table and requires admin review.",
            rule_notes="Unknown category blocked by default.",
        )

    if cat_rule.get("blocked", False):
        return SafetyEvaluateResponse(
            decision="BLOCK",
            safe_by=prepared_at,
            remaining_minutes=0,
            explanation=cat_rule["notes"],
            rule_notes=cat_rule["notes"],
        )

    if prepared_at > now + timedelta(minutes=5):
        return SafetyEvaluateResponse(
            decision="BLOCK",
            safe_by=prepared_at,
            remaining_minutes=0,
            explanation="Prepared time cannot be in the future. Please verify when the food was cooked.",
            rule_notes=cat_rule["notes"],
        )

    base_hours = (
        float(cat_rule["max_hours_chilled"])
        if req.storage_method == "chilled"
        else float(cat_rule["max_hours_ambient"])
    )
    multiplier = float(packaging_multipliers.get(req.packaging, 1.0))

    # Chilled extension only applies in full when sealed if required
    if req.storage_method == "chilled" and cat_rule.get("requires_sealed_for_chilled") and req.packaging == "open_unsealed":
        effective_hours = float(cat_rule["max_hours_ambient"]) * multiplier
    else:
        effective_hours = base_hours * multiplier

    safe_by = prepared_at + timedelta(hours=effective_hours)
    remaining_minutes = int((safe_by - now).total_seconds() // 60)

    if remaining_minutes <= 0:
        return SafetyEvaluateResponse(
            decision="BLOCK",
            safe_by=safe_by,
            remaining_minutes=0,
            explanation=f"This item has passed its {effective_hours:.1f}h safety window. {cat_rule['notes']}",
            rule_notes=cat_rule["notes"],
        )

    if remaining_minutes < min_remaining:
        return SafetyEvaluateResponse(
            decision="BLOCK",
            safe_by=safe_by,
            remaining_minutes=remaining_minutes,
            explanation=f"Only {remaining_minutes} minutes remain before safe-by expiry (minimum {min_remaining} min required for pickup).",
            rule_notes=cat_rule["notes"],
        )

    warning_buffer = int(cat_rule.get("warning_buffer_minutes", 30))
    if remaining_minutes <= warning_buffer or req.packaging == "open_unsealed":
        return SafetyEvaluateResponse(
            decision="APPROVE_WITH_WARNING",
            safe_by=safe_by,
            remaining_minutes=remaining_minutes,
            explanation=f"Approved with urgency: {remaining_minutes} minutes left to deliver. {cat_rule['notes']}",
            rule_notes=cat_rule["notes"],
        )

    return SafetyEvaluateResponse(
        decision="APPROVE",
        safe_by=safe_by,
        remaining_minutes=remaining_minutes,
        explanation=f"Safe to rescue for {remaining_minutes} more minutes. {cat_rule['notes']}",
        rule_notes=cat_rule["notes"],
    )


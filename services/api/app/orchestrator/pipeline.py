"""Orchestrator Agent (agents.md #0): routes events, retries twice, rules-only fallback."""

import asyncio
from datetime import datetime
from pydantic import BaseModel

from app.impact.calculator import ImpactCalculateRequest, calculate_impact
from app.matching.engine import MatchRankRequest, MatchRankResponse, ReceiverCandidate, rank_receivers
from app.safety.engine import (
    PackagingType,
    SafetyEvaluateRequest,
    SafetyEvaluateResponse,
    StorageMethod,
    evaluate_safety,
)


class OrchestrateListingRequest(BaseModel):
    category: str
    portions: int
    veg: bool = True
    prepared_at: datetime
    storage_method: StorageMethod = "ambient"
    packaging: PackagingType = "sealed_containers"
    listing_lat: float = 23.0225
    listing_lon: float = 72.5714
    candidates: list[ReceiverCandidate] = []


class OrchestrateListingResponse(BaseModel):
    safety: SafetyEvaluateResponse
    impact_preview: dict
    matching: MatchRankResponse | None = None
    retries_used: int = 0
    mode: str = "full"


async def orchestrate_new_listing(req: OrchestrateListingRequest) -> OrchestrateListingResponse:
    """Run deterministic safety + impact preview, then match eligible receivers if approved."""
    safety = evaluate_safety(
        SafetyEvaluateRequest(
            category=req.category,
            prepared_at=req.prepared_at,
            storage_method=req.storage_method,
            packaging=req.packaging,
        )
    )
    impact = calculate_impact(
        ImpactCalculateRequest(category=req.category, portions=req.portions)
    ).model_dump()

    if safety.decision == "BLOCK":
        return OrchestrateListingResponse(
            safety=safety,
            impact_preview=impact,
            matching=None,
            mode="rules_blocked",
        )

    retries = 0
    matching: MatchRankResponse | None = None
    for attempt in range(3):
        try:
            matching = rank_receivers(
                MatchRankRequest(
                    listing_lat=req.listing_lat,
                    listing_lon=req.listing_lon,
                    portions=req.portions,
                    veg=req.veg,
                    safe_by=safety.safe_by,
                    candidates=req.candidates,
                )
            )
            break
        except Exception:
            retries = attempt + 1
            if attempt == 2:
                matching = None

    return OrchestrateListingResponse(
        safety=safety,
        impact_preview=impact,
        matching=matching,
        retries_used=retries,
    )

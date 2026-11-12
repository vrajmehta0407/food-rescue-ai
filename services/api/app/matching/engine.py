"""Matching Engine (architecture.md #4 & agents.md #3)."""

from datetime import datetime, timezone
import math
from pydantic import BaseModel, Field


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance between two WGS84 coordinates in kilometers."""
    r = 6371.0
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2) ** 2
    )
    return 2 * r * math.asin(math.sqrt(a))


class ReceiverCandidate(BaseModel):
    receiver_id: str
    org_name: str
    lat: float
    lon: float
    daily_demand_portions: int = Field(ge=0)
    rescued_today_portions: int = Field(ge=0, default=0)
    max_single_pickup_portions: int = Field(gt=0, default=100)
    dietary_preference: str = "any"  # 'any' | 'veg_only'
    is_open_now: bool = True
    hours_since_last_rescue: float = Field(ge=0.0, default=24.0)
    verified: bool = True


class MatchRankRequest(BaseModel):
    listing_lat: float
    listing_lon: float
    portions: int = Field(gt=0)
    veg: bool = True
    safe_by: datetime
    max_radius_km: float = 5.0
    buffer_minutes: int = 15
    candidates: list[ReceiverCandidate]
    now: datetime | None = None


class RankedMatch(BaseModel):
    receiver_id: str
    org_name: str
    rank: int
    score: float
    distance_km: float
    estimated_travel_minutes: float
    reasons: list[str]


class SplitSuggestion(BaseModel):
    primary_receiver_id: str
    primary_portions: int
    secondary_receiver_id: str
    secondary_portions: int
    reason: str


class MatchRankResponse(BaseModel):
    matches: list[RankedMatch]
    split_suggestion: SplitSuggestion | None = None
    radius_km_used: float


def rank_receivers(req: MatchRankRequest) -> MatchRankResponse:
    """Rank eligible receivers using the 6-factor weighted score from architecture.md."""
    now = req.now or datetime.now(timezone.utc)
    if now.tzinfo is None:
        now = now.replace(tzinfo=timezone.utc)

    safe_by = req.safe_by
    if safe_by.tzinfo is None:
        safe_by = safe_by.replace(tzinfo=timezone.utc)

    remaining_minutes = (safe_by - now).total_seconds() / 60.0
    scored: list[tuple[float, RankedMatch]] = []

    for cand in req.candidates:
        if not cand.verified or not cand.is_open_now:
            continue
        if cand.dietary_preference == "veg_only" and not req.veg:
            continue

        dist_km = haversine_km(req.listing_lat, req.listing_lon, cand.lat, cand.lon)
        if dist_km > req.max_radius_km:
            continue

        # Approximate urban Ahmedabad speed ~ 22 km/h + 5 min handoff
        travel_min = (dist_km / 22.0) * 60.0 + 5.0
        if travel_min > (remaining_minutes - req.buffer_minutes):
            continue

        proximity = max(0.0, 1.0 - (dist_km / req.max_radius_km))
        unmet_need = max(0, cand.daily_demand_portions - cand.rescued_today_portions)
        need = min(1.0, unmet_need / max(1, req.portions))
        capacity_fit = min(1.0, cand.max_single_pickup_portions / req.portions)
        dietary_fit = 1.0 if (cand.dietary_preference == "veg_only" and req.veg) or cand.dietary_preference == "any" else 0.0
        availability_hours = 1.0 if cand.is_open_now else 0.0
        fairness_penalty_inverse = min(1.0, cand.hours_since_last_rescue / 24.0)

        score = round(
            0.30 * proximity
            + 0.20 * need
            + 0.15 * capacity_fit
            + 0.15 * dietary_fit
            + 0.10 * availability_hours
            + 0.10 * fairness_penalty_inverse,
            4,
        )

        reasons = [
            f"{dist_km:.1f} km away (~{int(round(travel_min))} min travel)",
            f"Unmet daily need: {unmet_need} portions",
            f"Capacity {cand.max_single_pickup_portions} portions",
            f"Fairness boost ({cand.hours_since_last_rescue:.0f}h since last rescue)",
        ]

        scored.append(
            (
                score,
                RankedMatch(
                    receiver_id=cand.receiver_id,
                    org_name=cand.org_name,
                    rank=0,
                    score=score,
                    distance_km=round(dist_km, 2),
                    estimated_travel_minutes=round(travel_min, 1),
                    reasons=reasons,
                ),
            )
        )

    scored.sort(key=lambda item: item[0], reverse=True)
    ranked = [
        item[1].model_copy(update={"rank": idx + 1})
        for idx, item in enumerate(scored)
    ]

    # Suggest split across two receivers if no single receiver can hold full portions
    split: SplitSuggestion | None = None
    if len(ranked) >= 2:
        top_cands = {c.receiver_id: c for c in req.candidates}
        first = top_cands[ranked[0].receiver_id]
        if first.max_single_pickup_portions < req.portions:
            second = top_cands[ranked[1].receiver_id]
            p1 = first.max_single_pickup_portions
            p2 = min(req.portions - p1, second.max_single_pickup_portions)
            if p2 > 0:
                split = SplitSuggestion(
                    primary_receiver_id=first.receiver_id,
                    primary_portions=p1,
                    secondary_receiver_id=second.receiver_id,
                    secondary_portions=p2,
                    reason=f"Top receiver capacity is {p1}; split remaining {p2} portions with {second.org_name}.",
                )

    return MatchRankResponse(
        matches=ranked,
        split_suggestion=split,
        radius_km_used=req.max_radius_km,
    )


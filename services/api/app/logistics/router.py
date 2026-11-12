"""Logistics Agent: OSRM routing, 2 km pickup batching, stall reassignment (agents.md #4 & architecture.md #3.4)."""

from datetime import datetime, timedelta, timezone
import os
import httpx
from pydantic import BaseModel, Field

from app.matching.engine import haversine_km


OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org")


class Waypoint(BaseModel):
    lat: float
    lon: float
    label: str = ""


class RouteRequest(BaseModel):
    origin: Waypoint
    destination: Waypoint
    use_osrm: bool = False


class RouteResponse(BaseModel):
    distance_km: float
    duration_minutes: float
    eta_iso: str
    coordinates: list[list[float]]  # [[lon, lat], ...] for MapLibre GeoJSON
    source: str


class PickupTaskCandidate(BaseModel):
    task_id: str
    listing_id: str
    lat: float
    lon: float
    safe_by: datetime
    portions: int


class BatchRequest(BaseModel):
    tasks: list[PickupTaskCandidate]
    max_batch_distance_km: float = 2.0


class BatchGroup(BaseModel):
    batch_id: str
    task_ids: list[str]
    total_portions: int
    earliest_safe_by: datetime


class VolunteerCandidate(BaseModel):
    volunteer_id: str
    name: str
    lat: float
    lon: float
    available: bool = True


class ReassignRequest(BaseModel):
    task_id: str
    current_volunteer_id: str | None = None
    stalled_minutes: int = Field(ge=0)
    pickup_lat: float
    pickup_lon: float
    volunteers: list[VolunteerCandidate]


class ReassignResponse(BaseModel):
    reassigned: bool
    assigned_volunteer_id: str | None = None
    assigned_volunteer_name: str | None = None
    fallback_mode: str  # "volunteer" | "receiver_self_pickup" | "keep_current"
    reason: str


async def compute_route(req: RouteRequest) -> RouteResponse:
    """Compute road route via OSRM or deterministic Haversine geometry fallback."""
    now = datetime.now(timezone.utc)
    if req.use_osrm:
        url = (
            f"{OSRM_BASE_URL}/route/v1/driving/"
            f"{req.origin.lon},{req.origin.lat};{req.destination.lon},{req.destination.lat}"
            "?overview=full&geometries=geojson"
        )
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                r = await client.get(url)
                if r.status_code == 200:
                    data = r.json()
                    route = data["routes"][0]
                    dist_km = round(route["distance"] / 1000.0, 2)
                    dur_min = round(route["duration"] / 60.0, 1)
                    eta = (now + timedelta(minutes=dur_min)).isoformat()
                    return RouteResponse(
                        distance_km=dist_km,
                        duration_minutes=dur_min,
                        eta_iso=eta,
                        coordinates=route["geometry"]["coordinates"],
                        source="osrm",
                    )
        except Exception:
            pass

    dist_km = round(haversine_km(req.origin.lat, req.origin.lon, req.destination.lat, req.destination.lon), 2)
    # 1.25 road winding factor at 22 km/h Ahmedabad city average
    road_km = round(max(0.3, dist_km * 1.25), 2)
    dur_min = round((road_km / 22.0) * 60.0 + 3.0, 1)
    mid_lon = round((req.origin.lon + req.destination.lon) / 2 + 0.0025, 6)
    mid_lat = round((req.origin.lat + req.destination.lat) / 2 + 0.0018, 6)
    eta = (now + timedelta(minutes=dur_min)).isoformat()

    return RouteResponse(
        distance_km=road_km,
        duration_minutes=dur_min,
        eta_iso=eta,
        coordinates=[
            [req.origin.lon, req.origin.lat],
            [mid_lon, mid_lat],
            [req.destination.lon, req.destination.lat],
        ],
        source="haversine_urban",
    )


def batch_nearby_pickups(req: BatchRequest) -> list[BatchGroup]:
    """Batch pickup tasks within 2 km and compatible safe-by windows (<= 60 min apart)."""
    remaining = list(req.tasks)
    batches: list[BatchGroup] = []
    idx = 1

    while remaining:
        anchor = remaining.pop(0)
        group = [anchor]
        still_left: list[PickupTaskCandidate] = []
        for cand in remaining:
            dist = haversine_km(anchor.lat, anchor.lon, cand.lat, cand.lon)
            window_diff_min = abs((anchor.safe_by - cand.safe_by).total_seconds()) / 60.0
            if dist <= req.max_batch_distance_km and window_diff_min <= 60.0:
                group.append(cand)
            else:
                still_left.append(cand)
        remaining = still_left
        batches.append(
            BatchGroup(
                batch_id=f"batch-{idx}",
                task_ids=[t.task_id for t in group],
                total_portions=sum(t.portions for t in group),
                earliest_safe_by=min(t.safe_by for t in group),
            )
        )
        idx += 1

    return batches


def handle_volunteer_stall(req: ReassignRequest) -> ReassignResponse:
    """Reassign if volunteer stalls >= 10 minutes; fall back to receiver self-pickup if none available."""
    if req.stalled_minutes < 10 and req.current_volunteer_id:
        return ReassignResponse(
            reassigned=False,
            assigned_volunteer_id=req.current_volunteer_id,
            fallback_mode="keep_current",
            reason="Volunteer has not exceeded the 10-minute stall threshold.",
        )

    available = [
        v
        for v in req.volunteers
        if v.available and v.volunteer_id != req.current_volunteer_id
    ]
    if not available:
        return ReassignResponse(
            reassigned=True,
            assigned_volunteer_id=None,
            fallback_mode="receiver_self_pickup",
            reason="No alternate volunteers nearby; switched to receiver self-pickup fallback.",
        )

    nearest = min(
        available,
        key=lambda v: haversine_km(req.pickup_lat, req.pickup_lon, v.lat, v.lon),
    )
    return ReassignResponse(
        reassigned=True,
        assigned_volunteer_id=nearest.volunteer_id,
        assigned_volunteer_name=nearest.name,
        fallback_mode="volunteer",
        reason=f"Volunteer stalled for {req.stalled_minutes} min; reassigned to nearest rider {nearest.name}.",
    )


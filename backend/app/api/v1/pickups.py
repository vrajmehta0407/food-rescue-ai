from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.exceptions import NotFoundError
from app.api.deps import get_current_user
from app.models.user import User
from app.models.match import DonationMatch
from app.models.pickup import HandoffEvent
from app.schemas.pickup import HandoffEventCreate, HandoffEventResponse
from app.services.pickup_service import record_handoff_event

router = APIRouter(prefix="/pickups", tags=["Pickup & Handoff"])


@router.get("/{match_id}/events", response_model=List[HandoffEventResponse])
def get_match_handoff_timeline(match_id: str, db: Session = Depends(get_db)):
    """Retrieve full audit timeline of handoff and status events for a match."""
    match = db.query(DonationMatch).filter(DonationMatch.id == match_id).first()
    if not match:
        raise NotFoundError("Match not found.")

    events = db.query(HandoffEvent).filter(HandoffEvent.match_id == match_id).order_by(HandoffEvent.occurred_at.asc()).all()
    
    result = []
    for ev in events:
        result.append({
            "id": str(ev.id),
            "match_id": str(ev.match_id),
            "event_type": ev.event_type,
            "quantity_value": ev.quantity_value,
            "quantity_unit": ev.quantity_unit,
            "occurred_at": ev.occurred_at,
            "notes": ev.notes,
            "actor_user_id": str(ev.actor_user_id) if ev.actor_user_id else None,
            "actor_user_name": ev.actor_user.full_name if ev.actor_user else None,
        })
    return result


@router.post("/{match_id}/events", response_model=HandoffEventResponse)
def submit_handoff_step(
    match_id: str,
    data: HandoffEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record an operational handoff milestone (arrival, collected, delivered, exception)."""
    ev = record_handoff_event(
        db=db,
        match_id=match_id,
        event_data=data,
        current_user=current_user
    )
    return {
        "id": str(ev.id),
        "match_id": str(ev.match_id),
        "event_type": ev.event_type,
        "quantity_value": ev.quantity_value,
        "quantity_unit": ev.quantity_unit,
        "occurred_at": ev.occurred_at,
        "notes": ev.notes,
        "actor_user_id": str(ev.actor_user_id) if ev.actor_user_id else None,
        "actor_user_name": current_user.full_name,
    }


from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.exceptions import NotFoundError, ForbiddenError
from app.api.deps import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.notification import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["In-App Notifications"])


@router.get("", response_model=List[NotificationResponse])
def get_my_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieve persisted notifications for the authenticated user."""
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(50).all()


@router.post("/{id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a specific notification as read."""
    notif = db.query(Notification).filter(Notification.id == id).first()
    if not notif:
        raise NotFoundError("Notification not found.")
    if str(notif.user_id) != str(current_user.id):
        raise ForbiddenError("You cannot modify another user's notifications.")

    notif.read_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(notif)
    return notif


from typing import Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: str,
    type: str,
    title: str,
    body: str,
    link: Optional[str] = None
) -> Notification:
    """Create and persist an in-app notification."""
    notif = Notification(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        link=link
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif


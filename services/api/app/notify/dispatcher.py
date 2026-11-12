"""Notification dispatcher for Web Push & WhatsApp/SMS previews (architecture.md #3.5)."""

from pydantic import BaseModel


class NotificationPayload(BaseModel):
    channel: str  # web_push | whatsapp | sms
    recipient_role: str
    recipient_id: str
    title: str
    body: str
    deep_link: str


def build_match_notification(
    receiver_id: str,
    listing_id: str,
    title: str,
    portions: int,
    safe_minutes: int,
) -> NotificationPayload:
    return NotificationPayload(
        channel="web_push",
        recipient_role="receiver",
        recipient_id=receiver_id,
        title=f"New Surplus Match: {portions} portions nearby",
        body=f"{title} — {safe_minutes} min left in safety window. Tap to Accept or Decline (auto-escalates in 5 min).",
        deep_link=f"/receiver?listing={listing_id}",
    )


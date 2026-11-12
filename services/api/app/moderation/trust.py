"""Trust and Moderation Agent (agents.md #6 & architecture.md #3.7)."""

from pydantic import BaseModel, Field


class ModerationInput(BaseModel):
    profile_id: str
    current_trust_score: float = Field(ge=0.0, le=5.0, default=5.0)
    recent_ratings: list[int] = Field(default_factory=list)
    flags_count: int = Field(ge=0, default=0)
    no_shows_count: int = Field(ge=0, default=0)
    photo_mismatch_count: int = Field(ge=0, default=0)
    repeated_expiry_count: int = Field(ge=0, default=0)
    account_age_days: int = Field(ge=0, default=30)
    listings_last_24h: int = Field(ge=0, default=1)


class ModerationDecision(BaseModel):
    profile_id: str
    new_trust_score: float
    throttled: bool
    escalate_to_admin: bool
    auto_banned: bool = False  # Never bans automatically (agents.md #6)
    evidence: list[str]
    recommended_action: str


def evaluate_trust_and_moderation(data: ModerationInput) -> ModerationDecision:
    """Adjust trust score, throttle risky accounts, and escalate serious flags to admin."""
    score = data.current_trust_score
    evidence: list[str] = []

    if data.recent_ratings:
        avg_rating = sum(data.recent_ratings) / len(data.recent_ratings)
        if avg_rating < 3.5:
            score -= 0.4
            evidence.append(f"Low recent average rating ({avg_rating:.1f}/5)")
        elif avg_rating >= 4.5:
            score += 0.1

    if data.no_shows_count > 0:
        score -= 0.35 * data.no_shows_count
        evidence.append(f"{data.no_shows_count} pickup no-show(s)")

    if data.photo_mismatch_count > 0:
        score -= 0.6 * data.photo_mismatch_count
        evidence.append(f"{data.photo_mismatch_count} photo mismatch report(s)")

    if data.repeated_expiry_count >= 2:
        score -= 0.25 * data.repeated_expiry_count
        evidence.append(f"{data.repeated_expiry_count} listings expired unmatched/late")

    if data.flags_count > 0:
        score -= 0.5 * data.flags_count
        evidence.append(f"{data.flags_count} safety/quality flag(s)")

    new_account_velocity = data.account_age_days < 3 and data.listings_last_24h > 5
    if new_account_velocity:
        evidence.append(
            f"High new-account velocity ({data.listings_last_24h} listings in {data.account_age_days}d)"
        )

    clamped_score = round(max(0.0, min(5.0, score)), 2)
    throttled = clamped_score < 3.0 or new_account_velocity
    escalate = data.flags_count > 0 or data.photo_mismatch_count > 0 or clamped_score < 2.5

    if escalate:
        action = "Throttle listing rate and escalate evidence bundle to city admin for human review."
    elif throttled:
        action = "Apply temporary rate throttle until trust score recovers above 3.0."
    else:
        action = "Good standing — no moderation action required."

    return ModerationDecision(
        profile_id=data.profile_id,
        new_trust_score=clamped_score,
        throttled=throttled,
        escalate_to_admin=escalate,
        auto_banned=False,
        evidence=evidence,
        recommended_action=action,
    )


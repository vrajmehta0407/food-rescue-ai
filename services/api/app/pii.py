"""PII redaction and audit hashing utilities (agents.md Shared Rules #2 & #3)."""

import hashlib
import re

PHONE_PATTERN = re.compile(r"(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3,5}\)?[\s-]?)?\d{3,5}[\s-]?\d{4,5}")
EMAIL_PATTERN = re.compile(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}")
ADDRESS_PATTERN = re.compile(
    r"\b\d{1,4}[A-Za-z]?(?:[/,-]\d{1,4})?\s+[A-Za-z0-9\s]{2,40}?\b(?:Road|Rd|Street|St|Marg|Avenue|Ave|Lane|Ln|Nagar|Society|Flat|Floor|Apt|Block|Sector)\b",
    re.IGNORECASE,
)


def redact_pii(text: str) -> str:
    """Mask phone numbers, email addresses, and street-level addresses before any LLM call."""
    if not text:
        return text
    masked = EMAIL_PATTERN.sub("[REDACTED_EMAIL]", text)
    masked = PHONE_PATTERN.sub("[REDACTED_PHONE]", masked)
    masked = ADDRESS_PATTERN.sub("[REDACTED_ADDRESS]", masked)
    return masked


def hash_input(payload: str) -> str:
    """Return a deterministic SHA-256 digest of an agent input for audit logging."""
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


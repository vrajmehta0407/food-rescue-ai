"""Swappable Vision Intake Agent (agents.md #1 & architecture.md #1)."""

import base64
import json
import re
from typing import Literal

import httpx
from pydantic import BaseModel, Field

from app.config import (
    GEMINI_API_KEY,
    LLM_PROVIDER,
    OPENROUTER_API_KEY,
    OPENROUTER_MODEL,
    VISION_TIMEOUT_SECONDS,
)
from app.pii import redact_pii


class VisionAnalyzeRequest(BaseModel):
    image_base64: str | None = None
    filename: str | None = None
    voice_note: str | None = None


class VisionConfidence(BaseModel):
    category: float = Field(ge=0.0, le=1.0)
    portions: float = Field(ge=0.0, le=1.0)


class VisionAnalyzeResponse(BaseModel):
    category: str
    items: list[str]
    veg: bool
    estimated_portions: int | None = None
    allergens: list[str]
    packaging: Literal["sealed_containers", "covered_trays", "open_unsealed"]
    confidence: VisionConfidence
    low_confidence_fields: list[str] = Field(default_factory=list)
    provider: str


def _compute_low_confidence(conf: VisionConfidence, portions: int | None) -> list[str]:
    fields: list[str] = []
    if conf.category < 0.75:
        fields.append("category")
    if conf.portions < 0.75 or portions is None:
        fields.append("estimated_portions")
    return fields


def _mock_analyze(req: VisionAnalyzeRequest) -> VisionAnalyzeResponse:
    """Deterministic mock adapter when no API key is configured."""
    hint = f"{req.filename or ''} {redact_pii(req.voice_note or '')}".lower()

    if any(k in hint for k in ("biryani", "rice", "pulao", "khichdi")):
        conf = VisionConfidence(category=0.92, portions=0.61)
        return VisionAnalyzeResponse(
            category="cooked_rice_dish",
            items=["veg biryani", "raita"],
            veg=True,
            estimated_portions=40,
            allergens=["dairy"],
            packaging="sealed_containers",
            confidence=conf,
            low_confidence_fields=_compute_low_confidence(conf, 40),
            provider="mock",
        )
    if any(k in hint for k in ("sweet", "kheer", "rasmalai", "barfi", "mithai")):
        conf = VisionConfidence(category=0.88, portions=0.68)
        return VisionAnalyzeResponse(
            category="dairy_sweets",
            items=["milk barfi", "gulab jamun"],
            veg=True,
            estimated_portions=25,
            allergens=["dairy", "tree_nuts"],
            packaging="covered_trays",
            confidence=conf,
            low_confidence_fields=_compute_low_confidence(conf, 25),
            provider="mock",
        )
    if any(k in hint for k in ("roti", "naan", "bread", "chapati")):
        conf = VisionConfidence(category=0.90, portions=0.78)
        return VisionAnalyzeResponse(
            category="breads_rotis",
            items=["tandoori roti", "naan"],
            veg=True,
            estimated_portions=50,
            allergens=["gluten"],
            packaging="covered_trays",
            confidence=conf,
            low_confidence_fields=_compute_low_confidence(conf, 50),
            provider="mock",
        )

    conf = VisionConfidence(category=0.84, portions=0.58)
    return VisionAnalyzeResponse(
        category="cooked_curry_dal",
        items=["dal tadka", "mix veg sabzi"],
        veg=True,
        estimated_portions=30,
        allergens=[],
        packaging="sealed_containers",
        confidence=conf,
        low_confidence_fields=_compute_low_confidence(conf, 30),
        provider="mock",
    )


def _build_vision_prompt(sanitized_note: str) -> str:
    return (
        "You are FoodRescue AI's Vision Intake Agent. Inspect the provided food photo "
        f"and optional redacted donor note ('{sanitized_note}') and return ONLY valid JSON with keys: "
        "category (one of: cooked_rice_dish, cooked_curry_dal, breads_rotis, dairy_sweets, "
        "cut_fruit_salad, packaged_dry_staples, raw_meat_seafood, unpasteurized_dairy), "
        "items (array of dish names), veg (boolean), estimated_portions (integer or null if unclear; never invent), "
        "allergens (array of strings), packaging (sealed_containers | covered_trays | open_unsealed), "
        "confidence ({category: 0-1, portions: 0-1}). Never mark anything safe."
    )


def _parse_vision_json(text: str, provider: str) -> VisionAnalyzeResponse | None:
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    parsed = json.loads(match.group(0))
    conf = VisionConfidence(**parsed["confidence"])
    portions = parsed.get("estimated_portions")
    return VisionAnalyzeResponse(
        category=parsed["category"],
        items=parsed.get("items", []),
        veg=bool(parsed.get("veg", True)),
        estimated_portions=portions,
        allergens=parsed.get("allergens", []),
        packaging=parsed.get("packaging", "sealed_containers"),
        confidence=conf,
        low_confidence_fields=_compute_low_confidence(conf, portions),
        provider=provider,
    )


async def analyze_food_photo(req: VisionAnalyzeRequest) -> VisionAnalyzeResponse:
    """Analyze a food photo + optional redacted voice note into a draft listing."""
    sanitized_note = redact_pii(req.voice_note or "")
    prompt = _build_vision_prompt(sanitized_note)

    # 1. OpenRouter Vision Adapter (if configured)
    if LLM_PROVIDER == "openrouter" and OPENROUTER_API_KEY and (req.image_base64 or sanitized_note):
        try:
            content: list[dict] = [{"type": "text", "text": prompt}]
            if req.image_base64:
                img_url = (
                    req.image_base64
                    if req.image_base64.startswith("data:")
                    else f"data:image/jpeg;base64,{req.image_base64}"
                )
                content.append({"type": "image_url", "image_url": {"url": img_url}})

            async with httpx.AsyncClient(timeout=VISION_TIMEOUT_SECONDS) as client:
                resp = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": OPENROUTER_MODEL,
                        "messages": [{"role": "user", "content": content}],
                        "temperature": 0.1,
                        "max_tokens": 600,
                    },
                )
                resp.raise_for_status()
                data = resp.json()
                text = data["choices"][0]["message"]["content"]
                parsed = _parse_vision_json(text, "openrouter")
                if parsed:
                    return parsed
        except Exception:
            # Graceful fallback to deterministic mock adapter
            pass

    # 2. Gemini Direct Adapter (if configured)
    if LLM_PROVIDER == "gemini" and GEMINI_API_KEY and req.image_base64:
        try:
            raw_b64 = req.image_base64.split(",")[-1]
            base64.b64decode(raw_b64, validate=True)

            url = (
                "https://generativelanguage.googleapis.com/v1beta/models/"
                f"gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
            )
            body = {
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {"inline_data": {"mime_type": "image/jpeg", "data": raw_b64}},
                        ]
                    }
                ]
            }
            async with httpx.AsyncClient(timeout=VISION_TIMEOUT_SECONDS) as client:
                resp = await client.post(url, json=body)
                resp.raise_for_status()
                data = resp.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = _parse_vision_json(text, "gemini")
                if parsed:
                    return parsed
        except Exception:
            pass

    return _mock_analyze(req)

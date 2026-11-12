"""Helper Chat Assistant (agents.md #7): English / Hindi / Gujarati, strictly tool-backed."""

from typing import Literal
from pydantic import BaseModel, Field

from app.pii import redact_pii
from app.safety.engine import load_safety_rules


Language = Literal["en", "hi", "gu"]


class ChatAskRequest(BaseModel):
    message: str
    language: Language = "en"
    listing_summary: dict | None = None
    task_summary: dict | None = None
    impact_summary: dict | None = None


class ChatAskResponse(BaseModel):
    reply: str
    tools_used: list[str]
    language: Language
    disclaimer: str = "Answers come strictly from FoodRescue rules & live task data (no medical or legal advice)."


def _get_safety_rule_answer(query: str, lang: Language) -> tuple[str | None, str | None]:
    rules = load_safety_rules().get("categories", {})
    q = query.lower()
    mapping = [
        (["rice", "biryani", "pulao", "khichdi", "भात", "બિરયાની", "ભાત"], "cooked_rice_dish"),
        (["sweet", "mithai", "barfi", "kheer", "rasmalai", "मिठाई", "મીઠાઈ"], "dairy_sweets"),
        (["fruit", "salad", "फल", "ફળ"], "cut_fruit_salad"),
        (["roti", "naan", "bread", "chapati", "रोटी", "રોટલી"], "breads_rotis"),
        (["curry", "dal", "sabzi", "दाल", "દાળ", "શાક"], "cooked_curry_dal"),
        (["meat", "chicken", "fish", "seafood", "मांस", "માંસ"], "raw_meat_seafood"),
        (["packaged", "dry", "biscuit", "packet"], "packaged_dry_staples"),
    ]
    for keywords, cat_key in mapping:
        if any(k in q for k in keywords) and cat_key in rules:
            r = rules[cat_key]
            if r["blocked"]:
                if lang == "hi":
                    return f"{r['label']}: यह श्रेणी सुरक्षा नियमों के तहत ब्लॉक है। कृपया एडमिन से जांच करें।", cat_key
                if lang == "gu":
                    return f"{r['label']}: આ કેટેગરી સુરક્ષા નિયમો હેઠળ બ્લોક છે. કૃપા કરીને એડમિન સાથે તપાસો.", cat_key
                return f"{r['label']} is BLOCKED under sample safety rules: {r['notes']}", cat_key

            if lang == "hi":
                return (
                    f"{r['label']}: कमरे के तापमान पर अधिकतम {r['max_hours_ambient']} घंटे और ठंडे (chilled) में {r['max_hours_chilled']} घंटे सुरक्षित है। (नमूना नियम)",
                    cat_key,
                )
            if lang == "gu":
                return (
                    f"{r['label']}: રૂમ તાપમાને મહત્તમ {r['max_hours_ambient']} કલાક અને ઠંડા (chilled) માં {r['max_hours_chilled']} કલાક સુરક્ષિત છે. (નમૂના નિયમ)",
                    cat_key,
                )
            return (
                f"{r['label']}: max {r['max_hours_ambient']}h at room temp or {r['max_hours_chilled']}h chilled. ({r['notes']} — sample, review with a food-safety expert before real use)",
                cat_key,
            )
    return None, None


def answer_helper_chat(req: ChatAskRequest) -> ChatAskResponse:
    """Answer strictly from safety rules, listing/task context, and impact tools."""
    clean_msg = redact_pii(req.message).lower()
    tools_used: list[str] = []

    # 1. Medical / legal guardrail
    if any(w in clean_msg for w in ("sick", "poison", "hospital", "lawsuit", "legal", "tax deduction", "80g law")):
        msg = {
            "en": "I cannot give medical or legal advice. Please check with the city admin or a qualified professional immediately.",
            "hi": "मैं चिकित्सा या कानूनी सलाह नहीं दे सकता। कृपया तुरंत सिटी एडमिन से संपर्क करें।",
            "gu": "હું તબીબી કે કાનૂની સલાહ આપી શકતો નથી. કૃપા કરીને તરત જ સિટી એડમિનનો સંપર્ક કરો.",
        }[req.language]
        return ChatAskResponse(reply=msg, tools_used=[], language=req.language)

    # 2. Task status tool
    if any(w in clean_msg for w in ("pickup", "where", "volunteer", "eta", "status", "delivery", "पिकअप", "પિકઅપ")):
        tools_used.append("get_task_status")
        if req.task_summary:
            status = req.task_summary.get("status", "unassigned")
            eta = req.task_summary.get("eta_minutes", "N/A")
            area = req.task_summary.get("area", "Ahmedabad")
            reply = {
                "en": f"Current pickup status is '{status}' in {area}. Estimated ETA: {eta} min.",
                "hi": f"{area} में पिकअप की स्थिति '{status}' है। अनुमानित समय: {eta} मिनट।",
                "gu": f"{area} માં પિકઅપ સ્થિતિ '{status}' છે. અંદાજિત સમય: {eta} મિનિટ.",
            }[req.language]
            return ChatAskResponse(reply=reply, tools_used=tools_used, language=req.language)

    # 3. Impact tool
    if any(w in clean_msg for w in ("impact", "meals", "co2", "saved", "मील", "ભોજન")):
        tools_used.append("get_impact")
        if req.impact_summary:
            meals = req.impact_summary.get("meals", 0)
            kg = req.impact_summary.get("kg", 0)
            co2 = req.impact_summary.get("co2e_kg", 0)
            reply = {
                "en": f"Verified rescued impact: {meals} meals ({kg} kg food saved, {co2} kg CO2e avoided).",
                "hi": f"कुल बचाया गया भोजन: {meals} मील ({kg} किग्रा, {co2} किग्रा CO2e बचत)।",
                "gu": f"બચાવેલ ખોરાક: {meals} ભોજન ({kg} કિગ્રા, {co2} કિગ્રા CO2e બચત).",
            }[req.language]
            return ChatAskResponse(reply=reply, tools_used=tools_used, language=req.language)

    # 4. Safety rule lookup tool
    rule_reply, _cat = _get_safety_rule_answer(clean_msg, req.language)
    if rule_reply:
        tools_used.append("get_safety_rule")
        return ChatAskResponse(reply=rule_reply, tools_used=tools_used, language=req.language)

    # 5. Listing lookup fallback
    if req.listing_summary and any(w in clean_msg for w in ("listing", "safe_by", "food", "portions")):
        tools_used.append("get_listing")
        title = req.listing_summary.get("title", "Surplus listing")
        portions = req.listing_summary.get("portions", 0)
        return ChatAskResponse(
            reply=f"Listing '{title}' has {portions} portions. Exact address stays hidden until a match is accepted.",
            tools_used=tools_used,
            language=req.language,
        )

    fallback = {
        "en": "I'm not sure about that from the verified rules and task tools. Please check with the admin.",
        "hi": "सत्यापित नियमों में इसकी जानकारी नहीं है। कृपया एडमिन से जांच करें।",
        "gu": "સુરક્ષા નિયમો અને ટૂલ્સમાં આ માહિતી નથી. કૃપા કરીને એડમિન સાથે તપાસો.",
    }[req.language]
    return ChatAskResponse(reply=fallback, tools_used=tools_used, language=req.language)


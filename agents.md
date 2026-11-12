# FoodRescue AI: Agents (agents.md)

FoodRescue runs a team of specialised agents coordinated by an Orchestrator. Rule: **AI agents read, rank and explain; deterministic rules decide food safety, and a human confirms before anything risky is approved.**

## 0. Orchestrator Agent
- **Role:** Routes events (new listing, match response, timer expiry, volunteer status, flag raised) to the right agents and keeps all parties updated in realtime.
- **Behaviour:** parallelises independent steps; retries failed jobs twice; if AI is down, falls back to a manual form and rules-only flow.

## 1. Vision Intake Agent
- **Goal:** Turn a food photo (plus optional voice note) into a draft listing.
- **Output schema:**
```json
{
  "category": "cooked_rice_dish",
  "items": ["veg biryani", "raita"],
  "veg": true,
  "estimated_portions": 40,
  "allergens": ["dairy"],
  "packaging": "sealed_containers",
  "confidence": {"category": 0.92, "portions": 0.61}
}
```
- **Guardrails:** low confidence fields are highlighted for the donor; never invents quantities; never marks anything "safe".

## 2. Food Safety Agent (rules engine plus explainer)
- **Goal:** Decide if the listing is safe to rescue and compute `safe_by`.
- **Method:** deterministic table lookup by category, prepared time, storage method and packaging. The LLM only writes the friendly explanation ("Cooked rice must be delivered within 2 hours of cooking").
- **Decisions:** APPROVE, APPROVE_WITH_WARNING, BLOCK. BLOCK cannot be overridden by AI or the donor; only an admin can review.
- **Extras:** monitors active listings and warns at 60, 30 and 10 minutes before expiry.

## 3. Matching Agent
- **Goal:** Pick the best receiver quickly and fairly.
- **Method:** weighted score from architecture.md (proximity, need, capacity, diet, hours, fairness); filters out receivers who cannot arrive before `safe_by` minus buffer.
- **Behaviour:** notifies the top candidate, waits 5 minutes, escalates; after 3 declines widens radius; if none, suggests splitting the food across two receivers.
- **Explainability:** stores "why this match" reasons for admin review.

## 4. Logistics Agent
- **Goal:** Get food from donor to receiver on time.
- **Tools:** OSRM / ORS routing, volunteer availability, geo queries.
- **Behaviour:** assigns nearest available volunteer, batches nearby pickups (within 2 km and compatible windows), recalculates ETA live, reassigns if the volunteer stalls for 10 minutes, falls back to receiver self-pickup.

## 5. Impact Agent
- **Goal:** Measure and celebrate rescues.
- **Method:** calculator (meals, kg, CO2e, rupee value) using fixed factors; the LLM writes short stories and certificate text from the numbers.
- **Guardrail:** every figure comes from the calculator; stories never exaggerate, and cite counts from the database only.

## 6. Trust and Moderation Agent
- **Goal:** Keep the network safe and honest.
- **Signals:** ratings, flags, no-shows, photo mismatch, repeated expiry, new-account velocity.
- **Actions:** adjusts trust score, throttles risky accounts, escalates serious flags to an admin with evidence. It never bans automatically.

## 7. Helper Chat Assistant
- **Goal:** Answer questions in simple English/Hindi/Gujarati ("How long can sweets stay out?", "Where is my pickup?").
- **Tools (function calling):** `get_listing`, `get_task_status`, `get_safety_rule`, `get_impact`.
- **Guardrails:** answers only from tools and the rules table; no medical or legal claims; says "check with the admin" when unsure.

## Shared Rules
1. Safety decisions come from rules, never from model guesses.
2. Mask personal data (phones, exact addresses) before any LLM call.
3. Log every agent run (input hash, decision, latency, cost) for audit.
4. Timeouts: vision 20 s, others 8 s; stream status to the UI.
5. Humans stay in the loop: donor confirms AI fields; admin reviews blocked and flagged cases.
6. Nightly evaluation on labelled photos and simulated rescue runs.

## Agent Interaction Map
```
New Listing -> Orchestrator -> Vision Intake -> (donor confirms) -> Food Safety
                                                   | approve
                                               Matching -> (accept) -> Logistics
                                                                          |
Status updates (realtime) <--------------------------------- Impact <- Delivered
Flags / ratings -> Trust and Moderation -> Admin
Chat -> Assistant -> tools above
```

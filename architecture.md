# FoodRescue AI: Architecture (architecture.md)

## 1. Stack
| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, GSAP, Zustand, TanStack Query |
| Maps | MapLibre GL JS + OpenStreetMap tiles (free, no key) |
| Routing / ETA | OSRM (public demo or self-hosted) or OpenRouteService free tier |
| Backend API | Next.js Route Handlers + Python **FastAPI** service for AI, matching, safety |
| Database | PostgreSQL via Supabase with **PostGIS** (geo queries) |
| Auth | Supabase Auth (phone OTP, email) |
| Realtime | Supabase Realtime (listing and task status channels) |
| Storage | Supabase Storage / S3 (food photos, licences, proofs) |
| Queue | Redis + BullMQ (or Celery) for matching escalation timers |
| AI | Gemini (vision for food photos) behind a swappable adapter (OpenRouter / Groq fallback), mock adapter when no key |
| Notifications | Web Push + optional WhatsApp/SMS provider (Twilio or free-tier alternative) |
| Hosting | Vercel (web), Render/Fly.io (FastAPI), Supabase (DB) |
| Observability | Sentry, PostHog |

## 2. High-Level Diagram
```
 Donor / Receiver / Volunteer (PWA)
        |
   Next.js (UI + BFF)  <---- Supabase Realtime ----+
        |                                          |
        v                                          |
   Supabase Postgres + PostGIS  <---------  FastAPI Service
   (users, listings, matches,               |- Vision Intake
    tasks, impact)                          |- Safety Rules Engine
        ^                                   |- Matching Engine
        |                                   |- Logistics / Batching
   Redis Queue (escalation timers) ---------|- Impact Calculator
        |
   Storage (photos, proofs)     OSRM / ORS (routes)    Push / WhatsApp
```

## 3. Modules
1. **Vision Intake:** photo to food type, estimated portions, allergens, packaging; returns confidence; donor confirms.
2. **Safety Rules Engine (deterministic):** table of food categories with max hours at room temp / chilled, risk flags, and rules (e.g. cooked rice 2 h, dairy-based sweets 4 h, cut fruit 2 h). Computes `safe_by`. AI never overrides it.
3. **Matching Engine:** scores receivers using a weighted formula (below); creates ordered candidate list; queue escalates every 5 minutes.
4. **Logistics Service:** assigns volunteers, batches pickups within 2 km and compatible windows, requests route and ETA.
5. **Notification Service:** push / WhatsApp / SMS with deep links.
6. **Impact Calculator:** meals = portions delivered; kg; CO2e via per-category emission factors; rupee value from average meal cost.
7. **Trust and Moderation:** ratings, flags, trust score, auto-suspend rules.

## 4. Matching Score
```
score = 0.30*proximity + 0.20*need + 0.15*capacity_fit + 0.15*dietary_fit
      + 0.10*availability_hours + 0.10*fairness_penalty_inverse
```
`proximity` from PostGIS distance and route time; `need` from receiver's declared daily demand minus rescued today; `fairness` lowers score for receivers who received recently. Only candidates who can arrive before `safe_by` minus buffer are eligible.

## 5. Data Model (simplified)
```sql
profiles(id, role, name, phone, org_name, verified, trust_score, location geography, created_at)
verifications(id, profile_id, doc_type, doc_url, status, reviewed_by)
listings(id, donor_id, title, category, veg, portions, kg, allergens[], packaging,
         prepared_at, safe_by, pickup_location geography, photo_url, ai_confidence,
         status, created_at)           -- status: open, matched, picked, delivered, expired, cancelled
matches(id, listing_id, receiver_id, rank, score, status, notified_at, responded_at)
tasks(id, listing_id, volunteer_id, route_json, eta, status, picked_at, delivered_at, proof_url)
ratings(id, from_id, to_id, listing_id, stars, flag_reason)
impact(id, listing_id, meals, kg, co2e_kg, value_inr, delivered_at)
safety_rules(id, category, max_hours_ambient, max_hours_chilled, blocked, notes)
```
Row Level Security on every table; address fields visible to receivers and volunteers only after match acceptance; PostGIS GiST index on location columns.

## 6. API (REST)
| Method | Route | Purpose |
|---|---|---|
| POST | /api/listings/analyze | Photo to AI pre-fill |
| POST | /api/listings | Create listing (runs safety check) |
| GET | /api/listings/nearby | Geo feed for receivers |
| POST | /api/matches/:id/accept | Receiver accepts |
| POST | /api/matches/:id/decline | Decline, escalate |
| GET | /api/tasks/nearby | Volunteer tasks |
| POST | /api/tasks/:id/status | Accepted, Picked, Delivered + proof |
| GET | /api/impact/me | Personal impact |
| GET | /api/impact/city | City totals |
| POST | /api/flags | Report issue |
| GET/PUT | /api/profile | Profile and verification |
| DELETE | /api/account | Erase data |

## 7. Key Flow: Post to Delivered
1. Donor uploads photo; FastAPI vision returns draft fields.
2. Donor confirms; Safety Engine computes `safe_by` and blocks or approves.
3. Listing saved; Matching Engine ranks receivers; top candidate notified.
4. Receiver accepts (or timer escalates to next).
5. Logistics assigns nearest volunteer; route and ETA computed.
6. Realtime status updates to all three parties.
7. Delivery proof uploaded; Impact row written; certificate updated.
8. Listing expires automatically at `safe_by` if never matched; donor notified.

## 8. Security and Privacy
- RLS everywhere, signed upload URLs, image virus scan, EXIF location stripped from photos
- Approximate pickup location until a match is accepted
- Phone numbers masked; in-app contact only
- Rate limits, input validation (Zod / Pydantic), CSP
- DPDP-style export and delete; photo retention 30 days
- Disclaimers and safety acknowledgement checkbox for donors

## 9. Performance
- PostGIS indexes; feed query under 150 ms for 10 km radius
- Realtime channels per listing; tile caching for maps
- Images resized and WebP; lazy-loaded masonry; offline queue for listing form

## 10. Testing
- Unit: safety rules (golden cases), matching score, batching
- Simulation: 500 synthetic donors and receivers, measure time-to-match and fairness
- E2E (Playwright): donor post, receiver accept, volunteer deliver
- AI eval: 100 labelled food photos for category and portion estimate error

## 11. Folder Structure
```
foodrescue/
  apps/web/              (Next.js)
    app/(marketing)/ app/(donor)/ app/(receiver)/ app/(volunteer)/ app/(admin)/ app/api/
    components/glass/ components/map/ components/cards/ lib/
  services/api/          (FastAPI)
    vision/ safety/ matching/ logistics/ impact/ notify/
  packages/safety-rules/ (versioned JSON)
  supabase/              (migrations, seed)
  infra/  docs/
```

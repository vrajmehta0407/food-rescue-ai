# FoodRescue AI

**Good food deserves a plate, not a bin.**  
Responsive mobile-first PWA connecting surplus food from restaurants, caterers, and events in Ahmedabad to verified NGOs and volunteer riders within deterministic food-safety windows.

> **Sample Safety & Impact Notice:** Safety windows (`packages/safety-rules/safety_rules.json`) and emission/meal-value factors (`packages/safety-rules/impact_factors.json`) are **sample data — review with a food-safety expert before real use**.

---

## Folder Structure
- `apps/web/` — Next.js 15 (App Router, TypeScript, Tailwind CSS, Framer Motion, Zustand, MapLibre GL JS)
  - `app/(marketing)/` — Landing page (hero, live plate counter, marquee, masonry preview, role tabs)
  - `app/(donor)/donor/` — Donor Hub & 30-second surplus listing form (AI photo pre-fill, EXIF GPS stripping, offline queue)
  - `app/(receiver)/receiver/` — Receiver masonry feed, MapLibre map, 6-factor match score, accept/decline (3-decline radius widening)
  - `app/(volunteer)/volunteer/` — Volunteer task stack, slide-to-confirm pickup, stall reassignment, proof of delivery + confetti
  - `app/impact/` — Impact Dashboard, Impact Stickers, downloadable CSR certificate, opt-in leaderboard
  - `app/(admin)/admin/` — Admin Console (verification approvals, blocked listing & flag review)
  - `app/onboarding/` — Phone OTP sign-up, role selection, FSSAI / NGO / ID upload
  - `app/settings/` — DPDP JSON data export & account deletion
  - `app/api/` — Next.js BFF routes (`/api/listings/analyze`, `/api/listings`, `/api/chat`)
- `services/api/` — Python FastAPI service (`vision`, `safety`, `matching`, `logistics`, `impact`, `moderation`, `chat`, `orchestrator`, `notify`)
- `packages/safety-rules/` — Versioned deterministic JSON safety rules & impact factors
- `supabase/` — PostGIS migrations (`0001_initial_schema.sql`) & sample seed (`seed.sql`)
- `infra/` — `docker-compose.yml` & `Dockerfile.api`

---

## How to Get Free API Keys (Optional — Mock Mode Works Out of the Box)
1. **Google Gemini Vision (optional):** Create a free key at Google AI Studio (`aistudio.google.com`) and set `LLM_PROVIDER=gemini` + `GEMINI_API_KEY=...`. Without a key, `LLM_PROVIDER=mock` uses deterministic sample vision responses.
2. **Supabase (optional for cloud DB/Auth):** Create a free project at `supabase.com`, enable the `postgis` extension, run `supabase/migrations/0001_initial_schema.sql` and `supabase/seed/seed.sql`, and add your URL/keys to `.env`.
3. **Maps & Routing:** MapLibre GL JS uses free OpenStreetMap tiles (no API key required) and OSRM / Haversine urban fallback.

---

## `.env` Setup
Copy `.env.example` to `.env` (or `apps/web/.env.local` if customizing Next.js):
```bash
cp .env.example .env
```

---

## Exact Commands to Install, Seed, Test & Start

### 1. Install Dependencies
```bash
pip install -r services/api/requirements.txt
npm install --prefix apps/web
```

### 2. Run Backend & Frontend Checks
```bash
python -m pytest services/api/tests -v
npm --prefix apps/web run typecheck
npm --prefix apps/web run build
```

### 3. Run Locally with One Command (Windows PowerShell)
```powershell
.\start.ps1
```
*(Starts FastAPI on `http://localhost:8000` and Next.js on `http://localhost:3000`.)*

Or run separately:
```bash
python -m uvicorn app.main:app --app-dir services/api --port 8000
npm --prefix apps/web run dev
```

---

## 3 Simple Steps to Open and Use the App
1. **Start & Open:** Run `.\start.ps1` and open `http://localhost:3000` in your browser.
2. **Post Surplus as a Donor:** Click **Rescue Food**, upload a food photo (or type a quick note), confirm the AI-filled dish & portions, check the live Food Safety decision (`APPROVE` / `BLOCK`), tick the hygiene confirmation, and submit.
3. **Match & Deliver:** Open **Receiver** to accept the listing (revealing the exact pickup address), then open **Volunteer** to slide-to-confirm pickup, attach proof of delivery, trigger the Berry Pop confetti celebration, and view the updated totals on **Impact**.

---

## Suggested Features for Version 2
1. **Wedding & Festival Demand Forecasting:** Predict citywide surplus spikes during wedding seasons and festivals so NGOs and volunteers can pre-stage capacity.
2. **WhatsApp Bot Intake & Alerts:** Let caterers post photos and voice notes directly via WhatsApp in English, Hindi, or Gujarati without installing an app.
3. **Cold-Chain Volunteer Kits & Recurring Hotel Pickups:** Scheduled daily pickups for corporate canteens and hotels with insulated box temperature tracking.

# FoodRescue AI: Master Prompt for Antigravity

Paste everything below the line into Antigravity as the first prompt. Attach `PRD.md`, `design.md`, `architecture.md` and `agents.md` so the agent can read them.

---

Before writing any code, read the four attached docs completely, in this order: PRD.md, architecture.md, agents.md, design.md. Treat them as the single source of truth. Priority if they conflict: PRD, then architecture, then agents, then design.

You are a senior full-stack engineer and award-winning product designer. Build **FoodRescue AI**: a real-time network that connects surplus food from restaurants, caterers and stores to nearby NGOs, shelters and volunteers, with AI food intake, deterministic food-safety rules, smart matching, volunteer routing and an impact dashboard. Work autonomously in stages and verify each stage in the browser before moving on.

## Stack
Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion + GSAP ScrollTrigger; MapLibre GL + OpenStreetMap; FastAPI (Python) service for vision intake, safety rules, matching, logistics, impact; Supabase (Postgres + PostGIS, Auth, Realtime, Storage); Gemini for photo analysis behind a swappable adapter (OpenRouter/Groq fallback). If no API key exists, use a mock adapter with realistic sample responses so everything still runs.

## Design Requirements (critical)
- **Light theme only, no dark mode.** Colourful, glassmorphic, Pinterest-style masonry with big food photo cards.
- **Exactly three colours:** two main colours, Tangerine Flame `#FF5C1F` and Ocean Teal `#00B8A9`, plus one out-of-the-box accent, Berry Pop `#FF3D8B`, used sparingly (about 5-8% of a screen) for stickers, hearts, celebration moments, confetti sparkle and one highlighted headline word, never for body text or status. Neutrals: Deep Teal Ink `#0B2A2E`, White and Sea Mist `#EEFAF8`. **No cream, beige, violet, lime or any other colour.**
- Animated sunrise-wave background, frosted glass surfaces, Safe-By countdown rings, Match Orbit animation, Plate Counter hero number, slide-to-confirm pickup control, sticker badges, confetti (brand colours only) on delivery, scroll-pinned landing sections, cursor blob follower.
- Must NOT look like a generic AI template. Use quirky friendly display type (Bricolage Grotesque or Fraunces), Plus Jakarta Sans body, Space Grotesk numbers, asymmetric masonry and playful micro-interactions. Mobile-first, big tap targets for volunteers, honour reduced-motion and WCAG AA.

## Build Order
1. **Scaffold:** monorepo (`apps/web`, `services/api`, `packages/safety-rules`, `supabase`), Tailwind tokens, global background, glass utilities, fonts.
2. **Landing page:** hero "Don't waste it. Rescue it.", live-rescue marquee, 3-step pinned story, masonry gallery, impact numbers, role tabs, CTA.
3. **Auth + roles:** phone OTP and email; Donor, Receiver, Volunteer, Admin onboarding; verification document upload.
4. **Safety Rules Engine:** deterministic JSON rules by food category with `safe_by` calculation and BLOCK / WARN / APPROVE. Label the rule numbers as "sample, review with a food-safety expert before real use". Unit-test with golden cases.
5. **Listing flow:** photo upload, AI pre-fill (vision agent), donor confirmation, safety check, save.
6. **Receiver feed:** masonry of nearby listings plus map view using PostGIS, Safe-By rings, accept / decline.
7. **Matching Engine:** weighted score, 5-minute escalation queue, fairness, radius widening.
8. **Volunteer flow:** nearby tasks, batching, route and ETA on the map, status slider, proof-of-delivery photo.
9. **Realtime:** live status updates for all three parties via Supabase Realtime.
10. **Impact dashboard:** meals, kg, CO2e, rupee value, PDF impact certificate, city totals.
11. **Trust and moderation:** ratings, flags, trust score, admin console to approve partners and review flags.
12. **Helper chat assistant:** tool-calling over rules and user's own data only.
13. **Privacy + Polish:** export and delete account, location masking until accepted, skeletons, empty and error states, PWA manifest, Lighthouse above 90.

## Rules
- Food safety is decided only by the rules engine. AI may suggest and explain but never approves safety.
- Donors must confirm all AI-filled fields.
- Show approximate pickup location until a match is accepted; strip EXIF location from photos; mask phone numbers.
- Mask personal data before any LLM call.
- Provide a `seed` script: 10 donors, 8 receivers, 15 volunteers around Ahmedabad (or [your city]), 60 sample listings across statuses, so the app looks alive immediately.
- Write tests for the safety engine, matching score and batching, plus a Playwright flow (donor posts, receiver accepts, volunteer delivers).
- Produce a README with setup, env vars and run commands.

## Definition of Done
A donor can post food from a photo, the safety engine approves it with a `safe_by` timer, a nearby receiver is matched and accepts, a volunteer follows a route and delivers with proof, and everyone sees live status and the impact dashboard, all inside the tangerine-and-teal glassy masonry UI, running locally with one command.

Start by replying with a 10-bullet plan and the folder structure, list any ambiguities with the defaults you will assume, then begin Stage 1.

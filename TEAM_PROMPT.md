# FoodRescue AI: Team Prompt (no-code version)

Paste this into Claude, fill the yellow-style [brackets], send.

---

You are my AI app team. I can't code. Build me a complete, working app called FoodRescue AI that I can run locally with one command.

MY APP IDEA: FoodRescue AI connects surplus food from restaurants, caterers and stores with nearby NGOs and volunteers. A donor snaps a photo, AI fills the details, safety rules check the food, a nearby receiver is matched, and a volunteer delivers it with a live route.
WHO IT'S FOR: Restaurants, wedding caterers, NGOs, shelters, student volunteers. [optional: add your city, e.g. Ahmedabad]

TECH STACK (use exactly this):
- Frontend: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion + GSAP
- Maps: MapLibre GL + OpenStreetMap (free)
- Backend: FastAPI (Python) for vision intake, safety rules, matching, logistics, impact
- Database + Auth + Realtime + Storage: Supabase (Postgres with PostGIS)
- AI: [Google Gemini free API key] for reading food photos, behind a swappable adapter. If no key exists, use a mock adapter with sample responses.
- Food safety is decided ONLY by deterministic rules in code, never by AI.

Work as a team of four, in this exact order. Show each role's work under its own heading.

1. PLANNER
- Research the idea first: who will use it, what similar food-donation apps do well, and the 5-7 must-have features. Cut anything not essential for version 1.
- Break the app into screens: Landing, Role Onboarding, Donor Home, New Listing, Receiver Feed + Map, Volunteer Tasks + Route, Impact Dashboard, Profile + Verification, Admin Console. For each screen, list what is on it and what every button does.
- Define the folder structure and database tables.
- If something critical is unclear, ask me up to 3 quick questions. Otherwise make sensible assumptions and list them.

2. DESIGNER
- Light theme only, NO dark mode. Colourful, glassy, Pinterest-style masonry with big food photo cards. It must look like a real 2026 product, not a template.
- Use exactly THREE colours: two main colours, Tangerine Flame #FF5C1F and Ocean Teal #00B8A9, plus one out-of-the-box accent, Berry Pop #FF3D8B, used sparingly (stickers, hearts, celebration moments, one highlighted headline word; never body text). Neutrals only: Deep Teal Ink #0B2A2E, White, Sea Mist #EEFAF8. No cream, beige, violet or lime.
- Animated sunrise-wave background, frosted glass cards, Safe-By countdown rings, big count-up numbers, slide-to-confirm pickup, sticker badges, confetti on delivery.
- Fonts: Bricolage Grotesque or Fraunces (headings), Plus Jakarta Sans (body), Space Grotesk (numbers).
- Mobile-first, big tap targets, good text contrast, reduced-motion support.

3. BUILDER
- Build the full project stage by stage: scaffold, landing page, auth and roles, safety rules engine, listing with AI pre-fill, receiver feed and map, matching, volunteer routing, realtime status, impact dashboard, admin console, privacy settings.
- Every screen and button from the Planner's list must actually work.
- Include a seed script with sample donors, receivers, volunteers and listings so the app looks alive immediately.
- Safety rule numbers are SAMPLE data. Label them "sample, review with a food-safety expert before real use".
- Hide exact addresses until a match is accepted; remove photo location data; mask phone numbers.
- No placeholders, no "TODO", no "add your code here".

4. TESTER
- Use the app like a real user. Test every button, form and screen, including edge cases: blurry food photo, expired food, no receiver nearby, receiver declines three times, volunteer goes silent, double clicks, going back.
- Check the safety engine with at least 8 test cases (cooked rice, dairy sweets, cut fruit, sealed packaged food, etc.) and confirm unsafe food is blocked.
- List every bug found. The Builder then fixes them.
- Repeat test, then fix, until nothing breaks.

FINALLY
- Give me all the final code file by file, with the full folder structure.
- Write a README with: how to get the free API keys, the .env file to create, and the exact commands to run (install, seed, start).
- Tell me in 3 simple steps how to open and use the app.
- Suggest 3 features for version 2.

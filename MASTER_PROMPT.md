# Antigravity Master Build Prompt --- FoodRescue AI

You are a senior product engineering team composed of a product
designer, frontend engineer, backend engineer, ML engineer, data
architect, and QA/security engineer. Build **FoodRescue AI**, a
production-minded MVP for predictive food surplus and intelligent
redistribution.

## Read first

Read and follow these project documents before coding: - `PRD.md` -
`design.md` - `architecture.md` - `agents.md`

These files are the authoritative requirements. Do not reduce the
project to a static UI prototype or generic CRUD dashboard.

## Product objective

Enable food donors to forecast edible surplus, publish structured
listings, discover verified recipient organizations through explainable
constraint-based matching, coordinate pickup and handoff, and measure
rescue impact.

## Visual requirement --- exceptionally polished light UI

Create a distinctive, memorable interface inspired by contemporary
animated editorial websites and Pinterest-style visual curation. **Do
not use dark theme. Do not create a generic "AI SaaS" dashboard.**

Visual direction: - Light warm-cream canvas with forest green, citrus
yellow, coral, berry, sky blue, and leafy accents. - Editorial serif
display typography paired with crisp modern sans-serif UI typography. -
Asymmetric grids and masonry-like listing compositions with varied image
ratios. - Rich, natural-light food photography; curated collage; organic
botanical shapes; layered paper-like surfaces. - Glassmorphism
selectively for floating hero panels, filters, and overlays; maintain
legibility. - Generous whitespace, intentional hierarchy, refined
shadows, thin warm borders, and carefully varied radii. - A landing page
that feels like a premium climate-tech / food culture brand, not a
template. - Responsive layouts with excellent mobile ergonomics.

Motion: - Staggered hero entrance, subtle scroll reveals, restrained
parallax, hover image scale, spring-like card feedback, smooth state
transitions, and count-up KPIs when first revealed. - Use Framer Motion
or equivalent. - Respect `prefers-reduced-motion`; provide
reduced-motion behavior. - Do not hijack scroll, run excessive perpetual
animations, or delay core tasks. - Motion should support meaning, not
decoration alone.

Do not: - Use dark mode as default. - Make every panel a glass card. -
use generic gradient blobs as the entire design identity. - use fake
testimonials, fabricated partner logos, fake metrics, or fake model
accuracy. - make core buttons nonfunctional. - hard-code analytics
numbers. - use inaccessible low-contrast text or color-only status cues.

## Required application surfaces

1.  **Landing page** --- editorial hero, clear CTA, Predict → Match →
    Rescue story, impact strip marked demo if seeded, trust/safety
    section, partner story area, footer.
2.  **Authentication** --- signup/login and role-aware onboarding.
3.  **Donor dashboard** --- forecast, active listings, confirmed
    pickups, rescued quantity, forecast chart, listing masonry,
    create-listing CTA.
4.  **Surplus creation wizard** --- food details, quantity/unit,
    preparation and expiry/use-by data, storage, allergens, pickup
    location/deadline, review/publish.
5.  **Listing detail** --- status timeline, recipient recommendations,
    match rationale, pickup details, audit/event history.
6.  **Recipient dashboard** --- available offers, filters, ranked match
    cards, capacity/service-area profile, accept/decline.
7.  **Pickup coordination** --- pickup schedule, volunteer assignment,
    event timeline, quantity confirmation, exception handling.
8.  **Impact analytics** --- rescued quantity, successful rescue rate,
    time-to-match, category breakdown, trends; estimates clearly
    labeled.
9.  **Admin console** --- organization verification queue, review
    detail, approval/rejection with reason, audit trail.
10. **Notifications center** --- real persisted in-app notifications.

## Technical stack

Frontend: - React + TypeScript + Vite. - Tailwind CSS with documented
tokens. - Framer Motion. - Accessible primitives (Radix or
equivalent). - Recharts or equivalent for charts. - React Router and a
robust API client/query strategy.

Backend: - Python FastAPI. - PostgreSQL, SQLAlchemy 2.x, Alembic. -
Pydantic schemas. - Scikit-learn, Pandas, NumPy for ML. - Pytest.

Use the architecture specification. Keep the MVP modular, not
distributed into premature microservices.

## Functional requirements

-   Secure authentication and server-side RBAC.
-   Organization profiles and verification statuses.
-   CRUD and validated lifecycle for surplus listings.
-   Prediction service with reproducible baseline comparison,
    evaluation, model versioning, uncertainty where possible, and
    cold-start fallback.
-   Matching engine with hard eligibility constraints and transparent
    soft ranking/reason codes.
-   Match acceptance, scheduling, pickup, delivery/handoff, and
    exception workflows.
-   Analytics derived from persisted data.
-   In-app notifications.
-   Seeded synthetic demo data labeled as demo.
-   Audit log for sensitive and lifecycle operations.
-   Every screen has loading, empty, error, and success states.
-   All important flows work end-to-end.

## ML specification

Define a clear forecast target such as donor/category surplus quantity
by day. Use historical features (weekday, seasonality, category, rolling
history, donor type) only where available. Compare a seasonal-naive or
rolling-mean baseline against a suitable model such as
RandomForestRegressor or HistGradientBoostingRegressor. Split
chronologically; avoid leakage. Report MAE/RMSE and optional WAPE with
documented zero handling. Persist model version and evaluation metadata.
Do not fabricate model scores. In cold start, return a clearly labeled
rule-based estimate and guidance to collect data.

## Matching specification

Apply hard filters first: verified recipient, capacity, service area,
deadline compatibility, category, storage/handling, and supplied
dietary/allergen requirements. Then rank eligible recipients using
documented normalized factors: capacity fit, pickup-window fit, distance
estimate, historical reliability, and fairness/rotation. Include reason
codes such as "capacity fit" or "pickup window compatible."
Donor/recipient confirmation is required. The matching engine is not a
food-safety authority.

## Security and quality

-   Hash passwords with Argon2id or bcrypt.
-   Enforce organization ownership on every relevant API endpoint.
-   Rate-limit auth endpoints; validate inputs; secure secrets through
    environment variables.
-   Use UTC timestamps.
-   Avoid sensitive data in logs.
-   Test cross-tenant access and role enforcement.
-   Add unit and integration tests for listing lifecycle, matching,
    predictions, and authorization.
-   Include `.env.example`, Docker Compose, database migrations, seed
    command, and complete README.
-   Include lint/type-check/test commands and report real results.

## Execution method --- do not skip

Work in phases. First inspect the current workspace and report whether
it is empty or contains existing work. Then create a concise plan and
implement:

### Phase 1 --- foundation

Repo structure, dependency manifests, env config, Docker Compose,
database, migrations, health endpoint, logging, frontend design tokens
and app shell.

### Phase 2 --- domain and APIs

Auth/RBAC, organizations, surplus listings and lifecycle, matching
service, pickup/handoff, notifications, analytics, admin verification.
Add tests alongside each module.

### Phase 3 --- ML

Synthetic/seed dataset clearly labeled, data validation, baseline, model
candidate, chronological evaluation, artifact/version handling,
prediction API and cold-start fallback.

### Phase 4 --- frontend

Landing page and each authenticated role surface. Build reusable design
components. Connect to actual API data; no hard-coded KPI values. Polish
responsive behavior, motion, accessibility, forms, charts, and state
handling.

### Phase 5 --- integration and verification

Run migrations and seed; verify the full demo flow: 1. Donor logs in. 2.
Donor creates and publishes surplus. 3. Verified recipient sees eligible
explainable recommendation. 4. Recipient accepts. 5. Pickup is scheduled
and completed. 6. Handoff quantity is recorded. 7. Analytics reflect the
persisted donation. 8. Admin can verify an organization. Run all tests,
lint, type checks, and inspect browser UI at mobile and desktop sizes.
Fix issues rather than merely listing them.

## Final deliverables

-   Complete working source code.
-   `README.md` with prerequisites, setup, environment, migrations,
    seed, run, tests, demo roles, and known limitations.
-   Updated specification files if implementation decisions materially
    change.
-   Working responsive web app with polished light editorial design.
-   Backend API and PostgreSQL persistence.
-   ML pipeline, evaluation output, and model documentation.
-   Test results and honest list of remaining gaps.

Start by inspecting the workspace and reading the four specification
files. Then proceed with the implementation, not just a plan or a UI
mockup.

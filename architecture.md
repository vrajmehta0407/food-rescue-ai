# FoodRescue AI --- Technical Architecture

## 1. Architecture overview

Use a modular, API-first full-stack architecture. Keep prediction,
matching, donation workflow, and notifications separated into
services/modules with explicit interfaces. MVP should remain easy to run
locally; do not prematurely introduce microservices.

## 2. Recommended stack

-   Frontend: React + TypeScript + Vite.
-   Styling: Tailwind CSS with design tokens; Framer Motion for
    restrained motion; accessible component primitives (e.g. Radix).
-   Charts: Recharts or equivalent accessible chart library.
-   Backend: Python FastAPI.
-   Persistence: PostgreSQL; SQLAlchemy 2.x + Alembic migrations.
-   Validation: Pydantic.
-   ML: Pandas, NumPy, scikit-learn; optional XGBoost only if justified.
-   Geospatial: geopy/provider adapter; do not hard-couple the core app
    to a paid API.
-   Auth: secure session or JWT approach with refresh strategy; document
    chosen approach.
-   Testing: Pytest backend; Vitest/React Testing Library frontend.
-   Local infrastructure: Docker Compose for PostgreSQL and app
    services; include `.env.example`.

## 3. High-level component map

``` mermaid
flowchart TD
  U[Donor / Recipient / Volunteer / Admin] --> FE[React TypeScript Web App]
  FE --> API[FastAPI REST API]
  API --> AUTH[Auth & RBAC]
  API --> LIST[Surplus Listing Module]
  API --> MATCH[Matching Engine]
  API --> PRED[Prediction Service]
  API --> PICK[Pickup & Handoff Workflow]
  API --> ANALYTICS[Impact Analytics]
  API --> NOTIF[Notification Adapter]
  AUTH --> DB[(PostgreSQL)]
  LIST --> DB
  MATCH --> DB
  PRED --> ML[Model Pipeline / Model Artifact]
  PRED --> DB
  PICK --> DB
  ANALYTICS --> DB
  NOTIF --> DB
```

## 4. Backend modules

-   `auth`: registration, login, token/session, role guards.
-   `organizations`: organization profile, verification, service zone,
    capacity.
-   `surplus`: listing CRUD, lifecycle transitions, validation.
-   `prediction`: feature preparation, model loading, inference,
    evaluation metadata, cold-start fallback.
-   `matching`: eligibility constraints, scoring, reason generation,
    fairness guardrails.
-   `pickup`: scheduling, assignment, handoff, exception events.
-   `analytics`: aggregations and methodology metadata.
-   `notifications`: in-app event records; email adapter interface.
-   `admin`: verification queue, moderation, audit events.
-   `common`: config, logging, errors, pagination, time helpers.

## 5. Data model (core entities)

### User

`id`, `email`, `password_hash`, `full_name`, `role`, `organization_id`,
`is_active`, `created_at`.

### Organization

`id`, `name`, `type`, `verification_status`, `address`, `latitude`
(nullable), `longitude` (nullable), `service_radius_km` (nullable),
`capacity_value`, `capacity_unit`, `handling_capabilities` (JSON),
`created_at`, `updated_at`.

### SurplusListing

`id`, `donor_organization_id`, `title`, `food_category`, `description`,
`quantity_value`, `quantity_unit`, `prepared_at` (nullable),
`best_before_at` (nullable), `pickup_deadline_at`,
`storage_requirement`, `allergens` (JSON), `status`, `notes`,
`created_at`, `updated_at`.

### MatchRecommendation

`id`, `listing_id`, `recipient_organization_id`, `eligibility_status`,
`score`, `reason_codes` (JSON), `model_version`, `created_at`.

### DonationMatch

`id`, `listing_id`, `recipient_organization_id`, `accepted_at`,
`pickup_window_start`, `pickup_window_end`, `status`,
`assigned_volunteer_id` (nullable), `created_at`, `updated_at`.

### HandoffEvent

`id`, `match_id`, `event_type`, `quantity_value` (nullable),
`quantity_unit` (nullable), `occurred_at`, `notes`, `actor_user_id`.

### PredictionRecord

`id`, `organization_id`, `forecast_date`, `food_category` (nullable),
`predicted_quantity`, `lower_bound` (nullable), `upper_bound`
(nullable), `model_version`, `created_at`.

### Notification

`id`, `user_id`, `type`, `title`, `body`, `read_at` (nullable),
`created_at`.

### AuditLog

`id`, `actor_user_id`, `entity_type`, `entity_id`, `action`, `metadata`
(JSON), `created_at`.

Use UUID primary keys, UTC timestamps, foreign keys, appropriate
indexes, and migrations. Avoid storing unnecessary sensitive data.

## 6. API conventions

Prefix: `/api/v1`. JSON responses; consistent errors; pagination for
collections. - `POST /auth/register`, `POST /auth/login`,
`POST /auth/refresh`, `GET /auth/me` - `GET/POST /organizations`,
`GET/PATCH /organizations/{id}` - `GET/POST /surplus-listings`,
`GET/PATCH /surplus-listings/{id}`,
`POST /surplus-listings/{id}/publish`,
`POST /surplus-listings/{id}/cancel` -
`GET /surplus-listings/{id}/matches` - `POST /matches/{id}/accept`,
`POST /matches/{id}/decline`, `POST /matches/{id}/schedule` -
`POST /matches/{id}/pickup-events` - `GET /predictions/forecast`,
`POST /predictions/evaluate` (admin/demo protected) -
`GET /analytics/impact` - `GET /notifications`,
`POST /notifications/{id}/read` - `GET /admin/organizations/pending`,
`POST /admin/organizations/{id}/verify` - `GET /health`

## 7. Prediction design

MVP model: - Define target clearly: surplus quantity by
donor/category/day or surplus probability. - Feature candidates:
weekday, month/season, category, historical quantities, recent rolling
mean, holiday/event indicator if data exists, business type. - Split
data chronologically; avoid random leakage for time series. - Baseline:
seasonal naive or rolling mean. - Candidate: RandomForestRegressor or
HistGradientBoostingRegressor; compare against baseline. - Metrics: MAE
and RMSE for quantity forecast; WAPE optionally if zeros are handled
explicitly. - Return point estimate plus prediction interval/uncertainty
where method supports it. - Track model version and training dataset
snapshot. - Cold start: transparent rule-based estimate and request
historical data. - No invented model accuracy. Show evaluation only from
a reproducible run.

## 8. Matching design

1.  Filter verified recipients.
2.  Apply hard constraints: deadline, capacity, geography/service area,
    category, storage/handling, and explicitly supplied dietary/allergen
    requirements.
3.  Score eligible recipients with documented normalized components:
    -   capacity fit,
    -   pickup window fit,
    -   estimated distance,
    -   historical reliability,
    -   fairness/rotation.
4.  Persist recommendation and reason codes.
5.  Return ranked candidates and human-readable explanations.
6.  Recipient/donor confirmation required before reservation.
7.  Do not use protected attributes or opaque sensitive profiling.

## 9. Security

-   RBAC on every endpoint; verify organization ownership.
-   Password hashing with Argon2id or bcrypt.
-   Validate input and upload limits; sanitize user-rendered content.
-   Secrets in environment variables; `.env` excluded from git.
-   Rate-limit authentication endpoints.
-   Audit organization verification, listing state changes, and handoff
    records.
-   CORS allowlist; secure cookies if cookie auth is used.
-   Avoid logging tokens, passwords, or private contact details.
-   Test IDOR/cross-tenant access.

## 10. Repository structure

``` text
foodrescue-ai/
  frontend/
    src/
      app/
      components/
      features/{auth,dashboard,listings,matches,pickups,analytics,admin}/
      hooks/
      lib/
      styles/
      types/
  backend/
    app/
      api/v1/
      core/
      models/
      schemas/
      services/{prediction,matching,analytics,notifications}/
      repositories/
      tests/
    migrations/
    ml/
      data/
      notebooks/ (optional; not required for runtime)
      train.py
      evaluate.py
      artifacts/
  docs/{PRD.md,design.md,architecture.md,agents.md,MASTER_PROMPT.md}
  docker-compose.yml
  .env.example
  README.md
```

## 11. Development and deployment

-   Local setup via documented install steps and Docker Compose.
-   Seed organizations, users, listings, and history with explicitly
    marked synthetic demo data.
-   Include migration and seed commands.
-   Provide separate frontend and backend test commands.
-   Deployment can target a container host and managed PostgreSQL; keep
    configuration environment-driven.
-   CI should run lint, type checks, tests, and migration checks.

# FoodRescue AI --- Agent Instructions & Collaboration Rules

## 1. Purpose

This file defines how AI coding agents (including Antigravity agents)
should plan, implement, verify, and hand off FoodRescue AI. Treat
`PRD.md`, `design.md`, and `architecture.md` as source-of-truth
requirements.

## 2. Agent roles

### Product / Planning Agent

-   Translate requirements into small, testable tasks.
-   Maintain scope and acceptance criteria.
-   Identify missing decisions; choose safe defaults and document them
    instead of silently inventing business rules.

### UX / Frontend Agent

-   Implement the design direction with responsive layouts and polished
    states.
-   Prioritize accessibility, information hierarchy, and purposeful
    animation.
-   Do not replace the visual brief with a generic dashboard template.
-   Ensure every visible action works or is clearly disabled with an
    explanation.

### Backend / API Agent

-   Implement modular FastAPI routes, schemas, services, persistence,
    and authorization.
-   Keep business logic out of route handlers.
-   Enforce tenant ownership and role permissions server-side.

### ML / Prediction Agent

-   Define target, data assumptions, features, baselines, chronological
    validation, metrics, and model versioning.
-   Avoid leakage and fabricated performance claims.
-   Build a deterministic fallback for cold start and absent artifacts.
-   Explain predictions in terms of available features; do not overstate
    certainty.

### Matching / Optimization Agent

-   Separate hard eligibility filters from soft ranking.
-   Produce reason codes and understandable match explanations.
-   Include capacity, deadline, service area, handling, and
    fairness/rotation logic.
-   Human confirmation is required for match acceptance and food
    handoff.

### QA / Security Agent

-   Test functional requirements, authorization, validation, lifecycle
    transitions, accessibility, and responsive behavior.
-   Include negative tests and cross-organization access tests.
-   Inspect dependency and secret hygiene.

### Integration / Release Agent

-   Keep frontend/backend contracts synchronized.
-   Maintain environment examples, migrations, seed data, README, and
    run scripts.
-   Verify fresh-clone setup and core demo path.

## 3. Rules of engagement

-   Work in small coherent increments; do not generate the entire
    repository as one unreviewable blob.
-   Read all specification files before implementation.
-   Do not invent third-party API keys, credentials, datasets, or
    integrations.
-   Use synthetic demo data only when clearly labeled.
-   No hard-coded dashboard KPI values in the production UI; metrics
    must come from API/database.
-   No placeholder primary buttons, fake charts, dead links, or "coming
    soon" controls on the core path.
-   Never claim a feature, test, or integration works unless verified.
-   Use UTC in persistence and convert to local time in the UI.
-   Preserve the light, colorful, editorial visual direction.
-   Avoid dark mode as the default.
-   Keep secrets out of source control.
-   Add tests with each domain feature.
-   Document tradeoffs and assumptions.

## 4. Required implementation sequence

1.  Inspect repository and specification; create implementation plan.
2.  Establish monorepo, tooling, environment, database, and health
    checks.
3.  Implement auth, roles, organization onboarding, and authorization
    tests.
4.  Implement listing CRUD and lifecycle.
5.  Implement recipient eligibility filters and explainable matching.
6.  Implement pickup, handoff, and exception workflows.
7.  Implement prediction baseline, model training/evaluation, inference,
    and cold-start fallback.
8.  Implement analytics based on persisted events.
9.  Build frontend shell and design system, then screens and real API
    wiring.
10. Add notifications, admin verification, demo seed data, and polish.
11. Run tests, lint/type checks, responsive/accessibility review, and
    end-to-end core flow.
12. Update README and document setup, demo accounts, architecture, and
    limitations.

## 5. Definition of done

-   Feature meets PRD acceptance criteria.
-   API authorization and validation are tested.
-   UI has loading, empty, error, and success states.
-   Core action works end-to-end with persisted data.
-   No console errors or unhandled API failures in core path.
-   Accessibility and responsive checks performed.
-   Tests pass; failures are reported honestly.
-   Documentation and environment configuration updated.

## 6. Agent handoff format

At the end of a task, report: - What changed - Files created/updated -
Decisions and assumptions - Commands/tests run and actual results -
Known gaps or next tasks

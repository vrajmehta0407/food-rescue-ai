# FoodRescue AI --- Design System & UX Direction

## 1. Creative direction

Create a distinctive, contemporary food-rescue experience that feels
like an editorial Pinterest board crossed with a polished climate-tech
product. The design should be colorful, warm, airy, layered, and
premium. Avoid generic SaaS dashboard tropes, template-like sidebars,
excessive rounded cards, and dark mode.

**Visual keywords:** harvest editorial, playful precision, botanical
optimism, soft translucency, collage, asymmetrical rhythm, tactile
paper, cinematic scroll, purposeful micro-interactions.

## 2. Palette

Use a light canvas as the foundation: - Warm cream: `#FFF8EE` (page
background) - Paper white: `#FFFFFF` (content surfaces) - Forest:
`#1F5B43` (primary action / brand) - Leaf: `#83B879` (supporting) -
Citrus: `#F6C94A` (highlight) - Coral: `#F17C65` (urgent / accent) -
Berry: `#B84D72` (secondary accent) - Sky: `#B9DDF2` (visual balance) -
Ink: `#24312B` (primary text) - Muted ink: `#6B756F` (secondary text) -
Border: `#E9E3D9`

Maintain contrast. Accent colors are not interchangeable for semantic
statuses.

## 3. Typography

-   Display: expressive modern serif (e.g. Fraunces or equivalent) for
    hero headlines and editorial statements.
-   UI/body: clean sans (e.g. Manrope, Inter, or equivalent).
-   Numeric KPIs: tabular numerals.
-   Use restrained font scale: large hero, clear section heading,
    readable body, compact metadata.

## 4. Layout language

-   Desktop: generous whitespace, asymmetrical 12-column grid, editorial
    hero with image collage and floating glass panels.
-   Dashboard: persistent compact navigation rail or top nav, broad
    content canvas, not a dense left-sidebar clone.
-   Use masonry-style card grids for surplus listings and
    inspiration/impact content, but preserve logical order and
    accessible reading sequence.
-   Mobile: single-column cards, bottom navigation or compact header,
    sticky primary action when helpful.
-   Content max width approximately 1440px; comfortable spacing; avoid
    overly wide text paragraphs.

## 5. Key screens

### Marketing / landing

-   Hero headline: "Good food deserves a second destination."
-   Warm cream background, large editorial type, high-quality food
    imagery, layered photo tiles, animated curved/organic accent shapes.
-   Hero CTA: "Explore the rescue network"; secondary CTA: "List
    surplus".
-   Impact strip with real seeded/demo values clearly marked.
-   Three-step narrative: Predict → Match → Rescue.
-   Visual story of donor-to-recipient journey.
-   Testimonial/partner section only with authentic or clearly demo
    content.
-   Footer with trust, safety, and organization links.

### Donor dashboard

-   Greeting and daily surplus forecast.
-   KPI tiles: forecast surplus, active listings, confirmed pickups,
    rescued quantity.
-   Forecast chart with confidence band and selected period.
-   "Create a surplus listing" primary action.
-   Masonry listing grid with category image, quantity, deadline, state,
    and compact actions.
-   Distinct urgency chip; avoid alarmist color overload.

### Create listing flow

-   Multi-step or progressive form: food details → handling & allergens
    → pickup → review.
-   Inline validation and clear units.
-   Preview card to show how recipient sees listing.
-   Save draft and publish actions.

### Recipient discovery / matching

-   Ranked recommendation cards with reason tags: capacity fit, pickup
    window, category fit, service area.
-   Map is supplementary; list remains usable without map/geocoding.
-   Accept / decline actions with confirmation and accessible feedback.
-   Avoid opaque "AI says so" explanations.

### Pickup coordination

-   Timeline with statuses and timestamps.
-   Mobile-friendly pickup instructions and contact details protected by
    role.
-   Exceptions presented as actionable resolution states.

### Analytics / impact

-   Editorial dashboard with meaningful charts, not chart overload.
-   Trends for rescue rate, quantities, match time, category
    distribution.
-   Explain methodology for meals-equivalent and emissions estimates;
    clearly label estimates.
-   Download/export only if functional.

### Admin verification

-   Organization queue, detail panel, evidence checklist,
    approve/reject/suspend with reason.
-   Audit trail and status badges.

## 6. Motion and interaction

Use modern motion sparingly and deliberately: - Hero entrance: staggered
reveal of headline, imagery, and CTA. - Scroll-linked section
transitions with subtle parallax, only where performant. - Listing
cards: gentle lift, image scale, and tactile hover state. - KPI numbers:
count-up only on first reveal and only from real values. - Match state:
smooth status transition and concise success feedback. - Use spring-like
easing with short durations; avoid constant floating loops and excessive
scroll hijacking. - Respect `prefers-reduced-motion`; provide static
alternatives. - No animation should delay forms, navigation, or core
actions.

## 7. Glass and surface treatment

-   Glassmorphism for floating forecast summary, nav overlays, and hero
    mini-panel only.
-   Use translucent white, blur, thin warm border, and subtle shadow.
-   Main data surfaces should be solid/legible paper surfaces.
-   Avoid frosted glass over text-heavy areas or every card.

## 8. Image direction

-   Use genuine-looking food photography: seasonal produce, bakery
    surplus, prepared meals, crates, community kitchens.
-   Mix cropped photography with simple vector botanical motifs and
    abstract shapes.
-   Image cards should have varied aspect ratios in editorial grids.
-   Use a consistent warm natural-light treatment.
-   Do not use images to encode critical information.
-   Provide alt text; avoid fabricated partner logos.

## 9. Components

-   Buttons: forest primary, outlined secondary, coral/citrus accent
    only for contextual actions.
-   Cards: subtle border, low shadow, varied radius (not every component
    same radius).
-   Tags: compact, semantic, readable.
-   Charts: clean gridlines, accessible labels, hover details, legend.
-   Forms: clear labels, helper text, error messages; never
    placeholder-only labels.
-   Toasts: short, actionable, screen-reader announced.
-   Empty states: illustration or small visual + next action.
-   Skeletons: match actual layout, not generic shimmer everywhere.

## 10. Accessibility and responsive quality

-   Keyboard navigation and visible focus.
-   Contrast-compliant text and controls.
-   Semantic headings, landmarks, labels, and accessible chart
    summaries.
-   Touch targets at least 44×44 CSS px.
-   Reduced motion.
-   Do not rely solely on color for status.
-   Test 360px mobile, tablet, 1440px desktop, and wide desktop.

# FoodRescue AI: Design System (design.md)

**Direction:** Light, colourful, glassy, Pinterest-style masonry. Not dark theme. Warm and hopeful, like a sunrise over a clean ocean. It must feel alive and human, not a generic app template.

---

## 1. Three-Colour Palette (strict)
Two main colours plus one out-of-the-box accent. This palette is intentionally different from GridMind AI (which uses violet and lime). Do not reuse those.

| Role | Name | Hex |
|---|---|---|
| Brand 1 | **Tangerine Flame** | `#FF5C1F` |
| Brand 2 | **Ocean Teal** | `#00B8A9` |
| Accent (out-of-the-box) | **Berry Pop** | `#FF3D8B` |
| Ink (text) | Deep Teal Ink | `#0B2A2E` |
| Surface | Frost White | `#FFFFFF` |
| Page tint | Sea Mist | `#EEFAF8` (teal-tinted white, never cream or beige) |

**Rules**
- Tangerine = primary actions, urgency (safe-by timers), key highlights, donate/rescue CTA.
- Teal = success, delivered, verified, navigation, charts, calm surfaces.
- **Berry Pop (hot pink) is the surprise accent, used sparingly (about 5-8% of any screen):** sticker badges, hearts/likes, the "thank you" moments, confetti sparkle, hover glows and one highlighted word in headlines. Never for body text, never for status, never as a large background.
- No cream, beige, yellow, violet or lime anywhere.
- Tints come only from opacity of the three colours (tangerine, teal 10/20/35%; berry 10/20%).
- Berry on white fails small-text contrast, so use it only for fills, icons and large display text, with Deep Teal Ink text on top of berry fills.
- Status without traffic lights: Available = tangerine, Matched = teal outline, In transit = teal solid, Delivered = teal with check sticker, Expiring soon = tangerine pulse.

## 2. Background
Animated **sunrise-wave**: 3-4 large blurred blobs (tangerine and teal at 25-35% opacity, `blur(90px)`) drifting slowly (30-45 s loops) over Sea Mist, plus one small berry blob at 15% opacity floating near the hero, a faint wavy line pattern and 3% noise.

## 3. Glass Surfaces
```css
.glass {
  background: rgba(255,255,255,0.58);
  backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.75);
  box-shadow: 0 10px 34px rgba(0,184,169,0.14), inset 0 1px 0 rgba(255,255,255,0.85);
  border-radius: 28px;
}
.glass-teal { background: rgba(0,184,169,0.14); border-color: rgba(0,184,169,0.3); }
.glass-tangerine { background: rgba(255,92,31,0.14); border-color: rgba(255,92,31,0.32); }
.glass-berry { background: rgba(255,61,139,0.14); border-color: rgba(255,61,139,0.34); }
```
Fallback without `backdrop-filter`: solid `rgba(255,255,255,0.92)`.

## 4. Typography
- Display: **Bricolage Grotesque** or **Fraunces** (700), friendly and slightly quirky
- Body: **Plus Jakarta Sans** or **DM Sans**
- Numbers: **Space Grotesk** with tabular figures
- Scale: 12 / 14 / 16 / 20 / 28 / 40 / 64 / 96. Hero stat ("12,480 meals rescued") goes huge.

## 5. Layout: Pinterest Masonry
- Receiver feed and Impact board are **masonry grids** of food cards with mixed heights, large food photos on top, like a food mood board.
- 4 columns desktop, 2 tablet, 1 mobile (swipeable card stack for volunteers). Gap 20px.
- Card types: Food Listing (photo, portions, safe-by ring), Map Peek, Volunteer Task, Impact Stat, Story Card, Badge, Donor Spotlight.
- Photo cards use rounded 28px corners with a glass caption bar.

## 6. Signature Components
1. **Safe-By Ring:** circular countdown around the food photo; teal while safe, shifts to tangerine pulse in the last 30 minutes.
2. **Rescue Button:** big tangerine pill with a ripple and a heartbeat glow.
3. **Live Route Strip:** glass bottom sheet over the map with ETA, steps and one-tap status slider ("Slide to confirm pickup").
4. **Plate Counter:** hero number counting up, with tiny animated plates and spoons orbiting it.
5. **Match Orbit:** donor in centre, nearby receivers as orbiting avatars; the chosen one snaps in with a teal ring.
6. **Impact Stickers:** teal, tangerine and berry sticker badges (berry for celebratory ones) ("100 meals", "Night Hero"), slightly rotated, wiggle on hover.
7. **Quantity Stepper:** chunky pill stepper with portion icons that fill up.

## 7. Motion (2026 feel)
- **Framer Motion / Motion One** + **GSAP ScrollTrigger**, optional **Lenis** smooth scroll.
- Page entry: staggered reveal (translateY 24px, blur 8px to 0, 60ms stagger).
- Photo cards: hover lift 6px, subtle tilt up to 4deg, image zoom 1.04.
- Count-ups: `cubic-bezier(.22,1,.36,1)`, 1.2 s.
- Landing: pinned story sections, horizontal scroll gallery of rescued meals, marquee text.
- Map pins bounce in; routes draw on with SVG stroke animation.
- Cursor: teal blob follower with tangerine ring on interactive items (desktop).
- Confetti burst (tangerine, teal and a few berry pieces) when a delivery completes; the heart icon pops in berry.
- `prefers-reduced-motion`: disable drift, tilt, confetti and count-ups.

## 8. Shape and Spacing
- Radii: 14 (chips), 22 (inputs), 28 (cards), 999 (pills)
- 8px spacing grid; section padding 96px desktop, 56px mobile
- Icons: Phosphor duotone, 1.75 stroke; food illustrations are simple, flat, two-colour

## 9. Landing Page Sections
1. Hero: "Don't waste it. Rescue it." with floating glass food cards and a live rescue counter
2. Marquee of live rescues ("Spice Hub saved 40 meals 12 min ago")
3. How it works in 3 pinned steps (Post, Match, Deliver)
4. Masonry gallery of real-style food cards and stories
5. Impact numbers (plates, kg, CO2e)
6. For Donors / NGOs / Volunteers tabs
7. CTA with sunrise-wave background

## 10. Accessibility
- Deep Teal Ink `#0B2A2E` for text on glass; white text only on solid tangerine or solid teal (check 4.5:1; use darker tangerine `#E8470F` for small white text if needed)
- Never rely on colour alone: icons and labels on all statuses
- 48px minimum tap targets for volunteers; visible 3px focus ring in teal with white offset
- Alt text on all food photos; table fallbacks for charts

## 11. Tokens (Tailwind)
```js
colors: {
  tangerine: { DEFAULT:'#FF5C1F', 50:'#FFF0EA', 100:'#FFDCCD', 500:'#FF5C1F', 700:'#E8470F' },
  teal:      { DEFAULT:'#00B8A9', 50:'#E6F9F7', 100:'#C2F0EB', 500:'#00B8A9', 700:'#00877C' },
  berry:     { DEFAULT:'#FF3D8B', 50:'#FFEBF3', 100:'#FFD1E4', 500:'#FF3D8B', 700:'#D61F6B' },
  ink: '#0B2A2E', mist: '#EEFAF8'
}
```

## 12. Do / Don't
| Do | Don't |
|---|---|
| Big real-feeling food photos, huge stats | Stock charity clichés, sad imagery |
| Hopeful, warm, energetic tone | Guilt-tripping copy |
| Three colours plus neutrals, berry as a rare spark | Extra accent colours, berry as a main colour, cream tones |
| One clear action per screen on mobile | Dense dashboards for volunteers |

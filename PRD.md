# FoodRescue AI: Product Requirements Document

**Tagline:** Good food deserves a plate, not a bin. AI that connects surplus food to people who need it, in minutes.
**Version:** 1.0 | **Primary market:** India (start: Ahmedabad) | **Platform:** Responsive web app (PWA), mobile-first

---

## 1. Problem
Restaurants, hotels, caterers, wedding venues, canteens and grocery stores throw away large amounts of safe, edible food every day, while NGOs, shelters and communities nearby go short. The gap is coordination: donors don't know who needs food, NGOs don't know what is available, volunteers don't know where to go, and food has a short safe window.

## 2. Vision
A real-time rescue network: a donor posts surplus in 30 seconds, AI checks safety and quantity, matches the best nearby receiver, and routes a volunteer. Every rescue is tracked and counted.

## 3. Target Users
| Persona | Need |
|---|---|
| Donor (restaurant manager, caterer, wedding host) | Post leftover food fast, get a pickup, get an impact/tax receipt |
| Receiver (NGO, shelter, old-age home, community kitchen) | See available food nearby, accept, know quantity and safe-by time |
| Volunteer (student, rider, driver) | Pick up and deliver with a simple route and one-tap status |
| Admin (city coordinator) | Verify partners, monitor safety, view city impact |

## 4. Goals and Success Metrics
- Donor posts a listing in **under 45 seconds**
- Median time from post to pickup under **40 minutes**
- Match acceptance rate above **70%**
- Rescued meals: **5,000+ in first 3 months** in the pilot city
- Food-safety incidents: **zero**
- Week-4 donor retention above **50%**

## 5. Core Features (MVP)
### F1. Surplus Listing
- Post by photo, voice note or form: food type, quantity (portions/kg), veg/non-veg, packaging, prepared-at time, pickup address
- AI reads the photo and pre-fills type, estimated portions and allergens; donor confirms
- Safe-by countdown calculated from food category and storage

### F2. Smart Matching
- Ranks nearby verified receivers by distance, need, capacity, dietary fit, opening hours and fairness (so one NGO doesn't take everything)
- Receiver gets a push/WhatsApp-style alert with Accept / Decline; auto-escalates to next match after 5 minutes

### F3. Volunteer Logistics
- Pickup tasks on a live map with route, ETA and one-tap statuses (Accepted, Picked up, Delivered)
- Batches nearby pickups into one route
- Proof of delivery: photo plus receiver tap

### F4. Food Safety Guard
- Rules for time and temperature windows by food category
- Hard block on risky items (e.g. cut fruit beyond window, rice held too long); donor sees the reason
- Receiver can flag a problem; donor trust score updates

### F5. Impact Dashboard
- Meals rescued, kg saved, CO2e avoided, rupees value, people fed
- Donor certificate / CSR-style impact report (PDF)
- Public city leaderboard of donors (opt-in)

### F6. Verified Profiles
- Donor and receiver onboarding with licence / registration upload (FSSAI, NGO registration), admin approval

## 6. Post-MVP
Demand forecasting for events (weddings, festivals), WhatsApp bot posting, multilingual voice (Hindi, Gujarati), recurring pickups for hotels and canteens, cold-chain volunteer kits, donation receipts for tax benefits, expansion to more cities.

## 7. Functional Requirements
| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Sign up with phone OTP, choose role | P0 |
| FR-2 | Create listing with photo and AI pre-fill | P0 |
| FR-3 | Compute safe-by time and block unsafe listings | P0 |
| FR-4 | Rank and notify nearby receivers | P0 |
| FR-5 | Accept / decline with auto-escalation | P0 |
| FR-6 | Assign volunteer and show route | P0 |
| FR-7 | Status tracking and proof of delivery | P0 |
| FR-8 | Impact dashboard and PDF report | P1 |
| FR-9 | Ratings, flags and trust scores | P1 |
| FR-10 | Admin verification console | P0 |
| FR-11 | Data export and account delete | P0 |

## 8. Non-Functional Requirements
- Works on low-end Android and 4G; first load under 2.5 s
- Offline-tolerant listing form (queue and sync)
- Real-time updates under 2 seconds
- Location data shared only after a match is accepted
- WCAG 2.2 AA contrast; large tap targets for volunteers

## 9. User Flows
**Donor:** Open app, tap "Rescue food", snap photo, confirm AI fields, submit, see match and volunteer ETA, get impact receipt.
**Receiver:** Alert arrives, view food details and safe-by timer, Accept, track volunteer, confirm receipt.
**Volunteer:** See nearby tasks, accept, follow route, pick up, deliver, earn badge.

## 10. Screens
Landing, Role Onboarding, Donor Home, New Listing, Listing Detail, Receiver Feed (map + masonry), Volunteer Tasks + Live Route, Impact Dashboard, Profile + Verification, Admin Console, Settings/Privacy.

## 11. Risks
| Risk | Mitigation |
|---|---|
| Food safety and liability | Strict rules engine, safe-by timers, disclaimers, flagging, trust scores |
| Fake or bad listings | Verified partners, photo requirement, ratings |
| Not enough volunteers | Batching, badges, partner delivery riders, receivers can self-pickup |
| Privacy of addresses | Approximate location until accepted |
| Wrong AI estimates | Donor confirmation always required; AI never auto-approves safety |

## 12. Milestones
- **Week 1:** Auth, roles, listings, safety rules engine
- **Week 2:** Matching, notifications, receiver feed + map
- **Week 3:** Volunteer routing, status tracking, proof of delivery
- **Week 4:** Impact dashboard, admin console, polish, pilot launch

## 13. Out of Scope (v1)
Payments, selling food, cooking or hygiene certification, legal tax receipts (v1 gives an impact report only).

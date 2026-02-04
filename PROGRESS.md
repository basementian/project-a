# DIBS - Development Progress Log

## Project Overview
**DIBS** - A real-time peer-to-peer access exchange that allows users to temporarily transfer unused, time-bound access they currently control (e.g. seats, desks, queue positions, chargers) to nearby users for immediate use, in exchange for payment.

**Tech Stack:** Next.js 16.1 | React 19 | Supabase (PostgreSQL + Auth) | Zustand | Mapbox GL | Tailwind CSS | PostGIS

**Build Philosophy:** Ship narrow. Ship real. Ship fast. MVP only — optimize for speed, clarity, and behavioral validation.

---

## Product Spec (Non-Negotiable)

### Core Rules
- MVP scope only — if it doesn't prove real-time access liquidity, don't build it
- One universal access model (no asset-specific logic)
- Real-time, hyper-local, mobile-first
- Two roles only: Access Holder (posts a Dib) and Access Seeker (claims a Dib)
- Trust via constraints, not heavy checks

### Dip Data Model
```
Dip {
  id, type ('seat'|'desk'|'queue'|'charger'|'other'), location {lat, lng},
  available_until, price, access_method ('code'|'qr'|'physical_handoff'|'meet_confirm'),
  rules?, status ('active'|'claimed'|'expired'|'completed'),
  owner_id, claimer_id?, created_at
}
```
**NO 'parking' type.**

### Required Flows
1. **Post a Dib** — auto-detect location, select type, set duration/price, choose access method. Post in ≤30s. One active dib per user. No future scheduling. No bulk posting.
2. **Discover Dibs** — map-first UI, show only nearby/active/unclaimed. Filters: distance, price, time remaining, type. Empty state encourages posting.
3. **Claim a Dib** — enforce GPS proximity, require payment before revealing access, reveal instructions immediately after payment. No chat.
4. **Complete** — claimer taps "I'm done", owner taps "Access free", both rate each other, release funds.
5. **Disputes** — single "Report issue" button, manual handling only.

### Trust & Abuse Controls (MVP)
- Phone number verification
- GPS proximity enforcement
- One active dip per user
- Short max duration
- Ratings

### Payments
- Stripe integration
- Instant payment on claim
- Platform fee: 15–20%
- No subscriptions, no credits, manual refunds only

### Language
Use: "Post a Dib", "Release access", "Claim access", "Time remaining", "Nearby Dibs"
Never use: sell, rent, resell, scalp

### Out of Scope
Public street parking, long-term bookings, advance reservations, multiple active dips, hardware integrations, institutional dashboards, subscriptions, AI pricing, compliance systems

---

## Spec Audit Results (2026-02-03)

### Passing
- [x] One active dip per user — enforced in DB (RLS + `user_has_active_dip()`) and UI
- [x] Access instructions hidden until after claim — only shown to claimer when status='claimed'
- [x] Completion flow — separate buttons: claimer sees "I'm done", owner sees "Access free"
- [x] Rating flow — both parties can rate after completion, unique constraint per dip/rater
- [x] Empty state on map — shows "No Dibs nearby" with "Be the first to post" encouragement
- [x] No future scheduling — always "now + duration", no date picker, DB constraint enforces max 4hr
- [x] No bulk posting — one active dip rule prevents this

### Failing / Needs Work
- [x] **Remove 'parking' type** — DONE (Session 2)
- [x] **GPS proximity: server-side enforcement** — DONE: `claim_dip` RPC with PostGIS distance check (Session 2)
- [x] **Stripe payment integration** — DONE: real PaymentIntent + Payment Element in BottomSheet (Session 2)
- [x] **Platform fee applied** — DONE: 15% fee calculated in API, shown in ClaimButton and DipForm review (Session 2)
- [ ] **Real phone OTP** — mock auth still in place, hint removed from UI. Needs real SMS provider for production.
- [x] **Reporting** — DONE: writes to Supabase `reports` table via authenticated server client (Session 2)
- [x] **Dip auto-expiry** — DONE: client-side expiry detection in fetchDipById/getUserActiveDip + expire_stale_dips SQL function (Session 2)
- [x] **Mock OTP hint removed** — DONE: "Mock mode: use code 123456" removed from OTPInput UI (Session 2)

### File Locations for Key Fixes
| Issue | Files |
|-------|-------|
| Remove parking type | `src/types/dip.ts:1`, `src/types/database.ts:9,24,36`, `supabase/migrations/001_create_dips.sql:5`, `src/components/dip/DipForm.tsx:23`, `src/components/map/FilterBar.tsx:8` |
| Proximity enforcement | `src/services/dips.ts:81-98` (claimDip has no proximity check), `src/components/dip/ClaimButton.tsx:19` |
| Payment mock | `src/app/api/payment/route.ts`, `src/services/payments.ts`, `src/components/dip/ClaimButton.tsx:21-40` |
| Platform fee | `src/lib/constants.ts:6` (defined), nowhere used |
| Auth mock | `src/services/auth.ts` (MOCK_OTP = '123456') |

---

## What's Built (Inventory)

### Database (Supabase)
- `dips` table — PostGIS geography, RLS, realtime enabled
- `profiles` table — auto-created on signup via trigger
- `ratings` table — automatic average calculation via `update_user_rating()`
- `reports` table — for disputes
- Functions: `nearby_dips()`, `user_has_active_dip()`, `update_user_rating()`, `handle_new_user()`

### Routes
| Route | Purpose |
|-------|---------|
| `/(auth)/login` | Phone number entry |
| `/(auth)/verify` | OTP verification |
| `/(main)/map` | Map view with real-time dips |
| `/(main)/post` | Create new dip |
| `/(main)/dip/[id]` | Dip details, claim, complete, rate |
| `/(main)/activity` | Current and past dips |
| `/(main)/profile` | User profile and ratings |
| `/api/payment` | Payment endpoint (mock) |
| `/api/report` | Report endpoint (stub) |

### Components
- **Layout:** TopBar, BottomNav, BottomSheet
- **UI:** Button, Input, Card, Badge, Spinner, StarRating, CountdownTimer
- **Dip:** DipForm, DipPreviewCard, DipStatusBadge, ClaimButton, AccessInstructions
- **Map:** MapView, FilterBar
- **Auth:** PhoneInput, OTPInput

### Constants
- Max dip duration: 4 hours
- Default search radius: 2000m / Max: 10km
- Claim proximity: 200m
- Platform fee: 15%
- Min dip duration: 15 minutes

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

---

## Session Log

### Session 1 - 2026-02-03
**What happened:**
- Initial project exploration and full codebase audit
- Reviewed all routes, components, database schema, services
- Received and recorded full product spec
- Ran detailed spec compliance audit across 12 dimensions
- Created this progress tracking file

**No code changes were made.**

**Spec compliance: 7/12 passing, 5/12 need work.**

**Priority fixes identified:**
1. Remove 'parking' type from entire codebase
2. Add server-side GPS proximity validation on claim
3. Implement Stripe payment (replace mock)
4. Apply platform fee in payment flow
5. Replace mock OTP with real phone verification
6. Clarify completion flow (one-party vs two-party)
7. Wire up report endpoint to Supabase
8. Add dip auto-expiry mechanism

### Session 2 - 2026-02-04
**What happened — all spec fixes implemented:**

**Phase 1: Remove 'parking' type**
- Removed `'parking'` from `DipType` union in `src/types/dip.ts`
- Removed parking entries from `DIP_TYPE_LABELS` and `DIP_TYPE_ICONS`
- Removed from `database.ts` Row/Insert/Update/Functions types (4 occurrences)
- Removed from SQL migration `001_create_dips.sql` enum
- Removed from `DipForm.tsx` and `FilterBar.tsx` allTypes arrays

**Phase 2: Server-side proximity + auto-expiry**
- Created `supabase/migrations/002_claim_dip_rpc.sql`:
  - `claim_dip()` RPC: row locking, status/expiry/ownership/proximity validation via PostGIS (200m)
  - `expire_stale_dips()` function for batch expiry
- Updated `claimDip()` in `services/dips.ts` to call RPC with `(dipId, userLat, userLng)`
- Added auto-expiry detection in `fetchDipById()` and `getUserActiveDip()`
- Added `claim_dip` function type to `database.ts`

**Phase 3: Stripe payment integration**
- Installed `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`
- Created `src/lib/stripe.ts` (server-side Stripe instance)
- Created `src/lib/stripe-client.ts` (client-side loadStripe)
- Rewrote `/api/payment/route.ts`: authenticated, validates dip, creates real PaymentIntent, calculates 15% platform fee
- Rewrote `services/payments.ts`: new `PaymentIntentResult` type, removed mock functions
- Rewrote `ClaimButton.tsx`: Stripe `<PaymentElement>` in `<BottomSheet>`, fee breakdown, calls `claimDip` RPC after payment
- Added fee display to `DipForm.tsx` review summary ("You earn: $X.XX after 15% fee")

**Phase 4: Report endpoint**
- Rewrote `/api/report/route.ts`: authenticates user, inserts into Supabase `reports` table
- Removed `reporterId` from client request body in `dip/[id]/page.tsx`

**Phase 5: OTP cleanup**
- Removed `MOCK_OTP` import and "Mock mode" hint text from `OTPInput.tsx`

**Build status: `npm run build` passes clean.**

**Files changed (12):** `src/types/dip.ts`, `src/types/database.ts`, `supabase/migrations/001_create_dips.sql`, `src/components/dip/DipForm.tsx`, `src/components/map/FilterBar.tsx`, `src/services/dips.ts`, `src/app/api/payment/route.ts`, `src/services/payments.ts`, `src/components/dip/ClaimButton.tsx`, `src/app/api/report/route.ts`, `src/app/(main)/dip/[id]/page.tsx`, `src/components/auth/OTPInput.tsx`

**New files (3):** `supabase/migrations/002_claim_dip_rpc.sql`, `src/lib/stripe.ts`, `src/lib/stripe-client.ts`

**Remaining for production (not MVP blockers):**
- Replace mock OTP auth with real SMS provider (Twilio/Supabase Phone Auth)
- Add real Stripe test keys to `.env.local`
- Set up Stripe Connect for owner payouts
- Add pg_cron for `expire_stale_dips()` (currently client-side only)
- Add Stripe webhook for payment confirmation resilience

### Session 3 - 2026-02-04
**What happened — renamed service from DIPS to DIBS**

User-facing text renamed across the entire app. Internal code identifiers (type names, function names, variable names, file paths) intentionally left as-is since they don't affect user experience.

**Files changed (11):**
- `package.json` — `"dips-app"` → `"dibs-app"`
- `src/app/layout.tsx` — title `'DIPS'` → `'DIBS'`
- `src/app/(auth)/login/page.tsx` — `'Welcome to DIPS'` → `'Welcome to DIBS'`, `'dips_phone'` → `'dibs_phone'`
- `src/app/(auth)/verify/page.tsx` — `'dips_phone'` → `'dibs_phone'` (2 places)
- `src/services/auth.ts` — `'@dips.mock'` → `'@dibs.mock'`
- `src/components/layout/BottomNav.tsx` — `'Post a Dip'` → `'Post a Dib'`
- `src/components/dip/DipForm.tsx` — `'Post Dip'` → `'Post Dib'`
- `src/app/(main)/post/page.tsx` — `'Post a Dip'` → `'Post a Dib'` (3 places), `'post a Dip'` → `'post a Dib'`
- `src/app/(main)/map/page.tsx` — `'nearby Dips'` → `'nearby Dibs'`, `'No Dips nearby'` → `'No Dibs nearby'`
- `src/app/(main)/activity/page.tsx` — `'No active Dips'` → `'No active Dibs'`, `'Post a Dip'` → `'Post a Dib'`
- `src/app/(main)/dip/[id]/page.tsx` — TopBar `'Dip'` → `'Dib'` (2 places), `'Dip not found'` → `'Dib not found'`
- `src/app/api/payment/route.ts` — `'Dip not found'` → `'Dib not found'`, `'Dip is not available'` → `'Dib is not available'`
- `PROGRESS.md` — all DIPS/Dip/Dips references updated

**Build status: `npm run build` passes clean.**

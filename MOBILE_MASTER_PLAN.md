# Dibs White-Label Mobile App — Master Completion Plan

**Status:** Approved direction, ready for execution
**Date:** 2026-07-06 · **Execution-readiness revision 2026-07-26** (adds §0.5 prerequisites, session protocol in §4, time-semantics §3.7, Lane 5 scheduling, dev-build strategy, pre-phase source traces for P4/P5, store-listing legal items, `EXECUTION_STATE.md`)
**Supersedes:** `.claude/PLAN.md` (the "Modernization Plan (Revised)") — that document's architectural decisions remain valid; this document replaces its phasing, scope, and adds the white-label-first strategy, the complete feature/endpoint parity map, the design workflow, and executor guardrails.
**Companion:** `DESIGN_BRIEF.md` (the design prompt — run BEFORE building any screen)

---

## 0. Decisions Already Made (do not re-litigate)

These were decided by Alicia on 2026-07-06. An executing model must not reverse them:

1. **Codebase:** This repo (`dibs-mobile-app`), branch `feature/modernize-dibs-mobile-app`. The directory `/Users/aliciaulin/Desktop/dibs/code/dibs_mobile_app_new` is an abandoned 2024 scaffold (Expo SDK 39, broken imports) — never build there, never copy code from it. The only useful artifact in it is `config.json` (legacy per-studio config shape, reference only).
2. **V1 ship target: white-label per-studio apps.** One template codebase → each studio gets its own branded App Store / Play Store app. The multi-studio "Dibs" aggregator app is a later mode of the SAME codebase (a config flag, not a fork). Do not build aggregator UI (studio discovery/search) in v1.
3. **Design DNA: strong editorial template.** One opinionated, typography-led design language (the Dibs sensibility — "independent magazine, not SaaS template") where each studio's accent color, logo, and hero image slot in as the personality layer. NOT the widget model where studio color derives everything.
4. **Legacy code:** `legacy-reference/` is read-only reference for business logic porting. Never import from it at runtime.
5. **Backend of record:** `dibs-api` (Express, `/api/v2/...`). The app consumes the same endpoints as the widget wherever they exist. New endpoints go into dibs-api following its conventions (see §7, including the dibs-api execution protocol at the end of that section).

---

## 0.1 Revision 2026-08-04 — direction changes that OVERRIDE the sections below

Two decisions by Alicia mid-execution. Where they conflict with anything later in this
document, **these win**. Sections §6.3, §10, §11 and the P3/P5 endpoint tables have not been
rewritten line-by-line; read them through this filter.

### A. Ship the rebuild as an UPDATE to the two existing apps, not as new listings

Carlsbad Village Yoga and Everyday Ballet already have live iOS listings owned by
**Dibs Technology Inc**. Both are stranded on 2021 builds and broken for their installed base.
Verified from the public App Store on 2026-08-04:

| Studio | Bundle id | Live version | Last updated |
|---|---|---|---|
| 210 Carlsbad Village Yoga | `com.ondibs.carlsbadvillageyogaapp` | 1.8 | 2021-04-01 |
| 88 Everyday Ballet | `com.ondibs.everydayballetapp` | 1.6 | 2021-02-08 |

The rebuild ships into those same bundle ids as a version update. Consequences:

- **The Apple/Play enrollment long pole leaves the critical path for both rescue studios.**
  §6.3's DUNS/organization-enrollment runbook now applies ONLY to genuinely new studio apps.
- **The broken installs self-heal.** App Store updates auto-install for most users within days.
  A new listing would instead require every affected client to find and install a different app
  while the dead one sits on their home screen.
- **Nothing is foreclosed.** Apple supports transferring an app between developer accounts with
  users, ratings and reviews intact, so a studio-owned account remains available later. Verify
  the current transfer-eligibility rules before relying on it.
- **Guideline 4.2.6 risk drops.** Updating a years-old existing app reads very differently to a
  reviewer than submitting a batch of new templated listings.

Alicia is disabling/removing the two broken listings from sale ahead of the new version — the
build config must simply target the same identifiers.

Encoded in `whitelabel/schema.ts` as `store.ownership` (`dibs` | `studio`) and
`store.releaseType` (`update` | `new`), with a guard that an `update` build must carry the live
bundle id and a version that exceeds `lastKnownStoreVersion`.

**Both resolved 2026-08-04 (Alicia):** App Store Connect access is confirmed. Nothing has ever
been submitted to Google Play, and **v1 is iOS-only** — `store.platforms: ['ios']` in every
studio config, and release validation only demands Android identifiers when a studio actually
targets Android. Android remains a development target throughout; it is only the *submission*
that is out of scope.

### B. v1 ships CLASSES ONLY — appointments are deferred

The studios being rescued take group bookings only. Appointments are **not** "just as easy to
include": they carry availability slots, service providers, categories, a separate booking
endpoint (`complete-appointment-booking`), and the recurring-subscription payNow/hold split
with its 20th/25th invoice cycle — which is the single most complex domain module in this plan
and still has no verified call trace (the pre-P5 deliverable). Deferring appointments removes
approximately all of P5 and a meaningful slice of P3.

- **P5 (recurring appointment subscriptions) moves out of v1.** "View upcoming payments" and
  "view previous payments" (capabilities 4 and 10) stay in scope only insofar as they cover
  membership and package activity, which is what 210/88 actually have.
- **Studio 263 moves out of v1 entirely** — it is appointments-only AND needs a new
  studio-owned listing. It stays configured in `whitelabel/` so nothing about it leaks into
  hardcoded code, with `features.appointments: true` and `features.classes: false`.
- **Nothing is foreclosed.** `features.appointments` exists from day one; navigation gates on
  BOTH the build's feature flag and the studio's own `show_appts` config, so a build never
  renders a surface it has no code for.

**Consequence, now decided:** 263 was the only pilot with `locationDynamicPricing: true`, so
P6's flash-credit surface had no test studio. **Flash credits are DEFERRED (Alicia,
2026-08-04).** P6 ships as the stats/milestone pipes only — and milestones are themselves gated
on locating that backend (§7 item 7.6), so P6 may reduce to the stats card alone. Neither the
schema nor the endpoints are foreclosed; nothing about flash credits gets built in v1.

### C. Brand assets — status as of 2026-08-04

Studio-supplied originals live in `brand-assets/` (gitignored; the derived, correctly-sized
files are committed under `whitelabel/studios/<slug>/assets/`).

| Studio | Icon (1024² square) | Hero (vertical) | Splash |
|---|---|---|---|
| 88 Everyday Ballet | ✅ 1024×1024, opaque | ✅ 1440×2160 dancer | ✅ 1242×2436 wordmark |
| 210 Carlsbad Village Yoga | ❌ needs the **badge alone** exported from the EPS at 1024² | ❌ only a landscape class photo | — falls back to icon-on-white |

210's vector logo (`.eps`) carries a 1000² embedded preview, extracted and committed as its
`logo.png` — good for an in-app header, too low-resolution once the badge is cropped out of it
for an icon. The gap registry lives in `whitelabel/__tests__/studios.test.ts`; a studio without
store-ready assets keeps the placeholder icon rather than shipping a squashed wordmark.

---

## 0.5 Prerequisites — resolve BEFORE P0 acceptance is attempted

The executing model cannot conjure these. At session start, check each; if one is missing, record it in `EXECUTION_STATE.md` as blocked-on-Alicia and continue with unblocked work — **never guess a value.**

| # | Prerequisite | Status / source |
|---|---|---|
| A | **Canonical prod API URL** | `https://api.dibsonline.com` (Railway alias — verified live 2026-07-22, shared CLAUDE.md). ⚠️ Do NOT copy the widget's `.env-v2.txt` value (`dibs-api-v2.herokuapp.com` — legacy Heroku, now a stale fork) and do NOT use `api.ondibs.com` (an earlier guess that appeared in a prior revision of this plan). |
| B | **Staging API URL confirmed alive post-Railway-cutover** | **RESOLVED 2026-08-04 — there is no remote staging.** Probed: `dibs-api-staging.herokuapp.com` → 503 Application Error (dead); `dibs-api-v2.herokuapp.com` → 503 Offline for Maintenance (dead); `api.dibsonline.com` → 200 (live prod). The dev loop therefore targets **local dibs-api on `http://localhost:3001/api/v2`**, matching the widget's own dev `.env`. Full findings + per-target URLs: `docs/environments.md`. **Still needs an Alicia decision** for anything requiring a backend reachable off this laptop (device push testing in P7, TestFlight beta in P10): stand up a Railway staging service, or accept LAN-only until launch. |
| C | **Firebase client config** (apiKey, authDomain, projectId, appId) for the widget's Firebase project | **DONE 2026-08-04.** Lifted from `dibs-widget-new/.env` into this repo's gitignored `.env`; names documented in `.env.example`. Project `dibs-studio-clients` — the CLIENT project, never `dibs-admin-users`. |
| D | **Staging test user + studio state** | A known email/password login at a pilot studio on staging, with at least one pass, some credit, and a saved sandbox card. Alicia supplies one or approves creating one. |
| E | **Stripe sandbox key path verified** | **DONE 2026-08-04.** Local API returns `pk_test_…`, prod returns `pk_live_…`. All of 88/210/226/263 have `stripe_account_id_test` populated, so sandbox connected-account checkout is exercisable. |
| F | **Local toolchain for dev builds** | **PARTIAL 2026-08-04. iOS ready** (Xcode 26.2, CocoaPods 1.16.2). **Android absent** — no `ANDROID_HOME`, no `~/Library/Android/sdk`, no Java runtime. Per this row's own rule this is now Alicia's call: install the Android toolchain, or run iOS-first with Android acceptance batched. Note the two rescue apps are iOS listings, so iOS-first also matches the shipping order. |
| G | **Expo/EAS account + project** | `eas init` happens in P0, not P9 — P7's device push testing requires an EAS development build with real credentials, and first-build friction is better paid early. |
| H | **Sentry DSN** | Needed at P8. Non-blocking until then. |

---

## 1. What We Are Building

A white-label client mobile app (iOS + Android, Expo) for boutique fitness studios on Dibs. A studio provides: **logo, accent color, one vertical hero photo**. Dibs spins up a branded app that passes App Store review. Clients of that studio can do everything web-widget users can do:

| # | Capability (Alicia's v1 list) | Phase |
|---|---|---|
| 1 | ~~Book appointments (if studio offers them)~~ | **DEFERRED past v1 — §0.1-B** |
| 2 | Book classes (if studio offers them) | P3 |
| 3 | Buy packages | P4 |
| 4 | View upcoming payments (subscriptions) | P5 |
| 5 | Manage billing info (add/remove cards) | P2 |
| 6 | See flash credits — fun and exciting | P6 |
| 7 | Gamification pipes (bookings count, total spend, milestones) — pipes now, full UX later | P6 |
| 8 | Create a subscription/membership | P4 (membership). Recurring appt subscription **deferred — §0.1-B** |
| 9 | Cancel subscription/membership | P4 (membership). Recurring appt **deferred — §0.1-B** |
| 10 | View previous payments | P5 |
| 11 | View credit amounts | P2 |
| — | Apple Pay / Google Pay / cards | P3 |
| — | Push notifications | P7 |
| — | Add to calendar | P3 |
| — | Data consistency: every number in the app matches the web | All phases (§9 invariant) |

Plus delight features already cheap because the backend exists (§7.6): milestone celebrations, referral share, waitlist push.

---

## 2. Current State (verified 2026-07-06)

- **Scaffold:** Expo SDK 56, React 19.2, RN 0.85, New Architecture enabled, TypeScript 6 strict, Expo Router (typed routes), TanStack Query 5, Zustand 5, zod, decimal.js, expo-secure-store. `npx tsc --noEmit` → clean. `npx jest` → 280/280 pass.
- **NativeWind was REMOVED 2026-08-07 and must not be re-added casually.** Its JSX transform
  (`jsxImportSource: 'nativewind'`) silently DISCARDS a `style` prop that is a function, so every
  `style={({ pressed }) => …}` on a `Pressable` was dropped whole — layout, padding and background
  together. That shipped four broken builds: schedule rows, account rows and the Home menu all
  stacked vertically, and the selected day chip lost its pill. Nothing threw, nothing failed a test,
  typecheck was clean. Proven by a four-variant on-device probe: a style function was the only
  variant that failed, and it failed whether it returned an object OR an array. The app had **zero**
  `className` usages, so the transform was pure cost. Styling is plain RN `StyleSheet`/inline objects
  driven by `useTheme()`.
- **Done:** pricing waterfall ported to `src/domain/pricing/` with golden-master tests. Router shell (`src/app/_layout.tsx`, `index.tsx`). Query client (`src/api/query-client.ts`).
- **Empty:** `src/api` (beyond query-client), `src/stores`, `src/components`, `src/theme`, `src/lib` — everything else in this plan.
- **Not yet installed (add in P0):** `@stripe/stripe-react-native`, `firebase` (JS SDK), `expo-notifications`, `expo-calendar`, `expo-local-authentication`, `@react-native-async-storage/async-storage`, `expo-haptics`, `date-fns`, `date-fns-tz`.

---

## 3. Architecture

### 3.1 Layer diagram

```
┌─ src/app/            Expo Router file-based routes (thin — compose features)
├─ src/features/       Feature modules (schedule, booking, account, billing, …)
│    each: screens/ components/ hooks/ (feature-scoped)
├─ src/components/     Shared design-system components (Button, Card, Sheet, …)
├─ src/theme/          Two-layer theme (template DNA + studio personality) §5
├─ src/api/            Typed client: fetch wrapper, zod schemas, TanStack hooks
├─ src/domain/         PURE TypeScript business logic, zero RN imports, jest-only
│    pricing/ (done)  time/  passes/  promos/  recurring/  cancellation/  stats/
├─ src/stores/         Zustand: authStore, cartStore, uiStore (UI state only —
│                      server data lives in TanStack Query, never in Zustand)
├─ src/lib/            Infra: firebase.ts, stripe.ts, notifications.ts,
│                      calendar.ts, analytics.ts, secure-storage.ts
└─ whitelabel/         Per-studio config + assets + build tooling  §6
```

### 3.2 The API client (P0 — everything depends on this)

`src/api/client.ts`:
- Base URL from `EXPO_PUBLIC_API_URL` (dev: staging; per-studio builds: prod).
- Every request: `Authorization: Bearer <Firebase ID token>` when a user is signed in. Get the token from `auth.currentUser.getIdToken()` — the Firebase SDK caches and auto-refreshes; never store raw ID tokens yourself.
- Every response validated with a zod schema (`src/api/schemas/*.ts`). A schema mismatch throws a typed `ApiSchemaError` in dev and logs + passes-through in prod (do not brick the app on additive backend changes).
- Normalize errors to `{ status, code, message, retriable }`. 401 → sign-out flow. Network failure → retriable.
- One TanStack Query hook per endpoint in `src/api/hooks/`. Mutations invalidate the relevant query keys (defined centrally in `src/api/keys.ts`).

### 3.3 Auth

- **Firebase JS SDK** (`firebase/auth`), same Firebase project the widget uses (dibs-api validates with `FIREBASE_WIDGET_CREDENTIALS`). This makes mobile tokens indistinguishable from widget tokens on the backend — zero backend auth work. Persistence via `getReactNativePersistence(AsyncStorage)`.
- Flows: email/password sign-in, sign-up (`POST /create-new-dibs-user` then Firebase credential), password reset (Firebase). **DECIDED: v1 ships email/password only.** Sign in with Apple + Google Sign-In land together in v1.1 (Apple requires Sign in with Apple the moment any other third-party login is offered — shipping neither avoids the rule entirely; shipping both together satisfies it later). No social-login work appears in any v1 phase.
- Backend user linkage: dibs-api looks up `dibs_user` by `du_firebase_uid` with email fallback (`middleware/widget-auth.js`) — identical to widget.
- Guest mode: browsing (schedule, appointment types, packages) requires no auth, same as widget. Auth gate appears at booking/purchase/account.
- `expo-local-authentication` Face ID/biometric re-entry: P8 polish.

### 3.4 Payments (Stripe)

Read `.claude/CHECKOUT.md` and the current Stripe React Native docs before implementing. Non-negotiables from the platform:
- **The app NEVER creates PaymentIntents.** Backend creates them on the studio's connected account; app confirms with the client secret. (Same rule as the widget.)
- `StripeProvider` configured with the studio's **connected account**: `publishableKey` (platform key via `POST /get-stripe-publishable-key`) + `stripeAccountId` (from studio config) + `merchantIdentifier` (per-app Apple Pay merchant ID, from white-label config).
- **New card / Apple Pay / Google Pay:** Stripe **PaymentSheet** in payment-intent mode. Backend endpoint returns `clientSecret`; PaymentSheet handles card entry, wallets, and 3DS. Apple Pay and Google Pay come nearly free once PaymentSheet is wired (`applePay: { merchantCountryCode: 'US' }`, `googlePay: { merchantCountryCode: 'US', testEnv: __DEV__ }`).
- **Saved cards:** reuse the widget's server-side model — list saved PaymentMethods server-side, the user picks one in our own UI, and the `pm_xxx` id goes in the checkout payload. This avoids needing a new ephemeral-key endpoint. (Optional later: an ephemeral-key endpoint to let PaymentSheet itself show saved cards.)
  - ✅ **RESOLVED 2026-07-21 (source trace — `docs/verified-widget-sequences.md`):** the widget's live card-listing endpoint is **`POST /stripe/get-all-payments`** (used at both checkout and the account/billing screen). Response shape: `{ paymentsDibs[], paymentsConnectedAccount[] (raw Stripe PaymentMethods), stripeidDibs?, stripeidStudio?, defaultPaymentMethodId?, defaultFingerprint? }`, with `is_default: true` stamped on the default PM. `/stripe/get-payment-methods-for-user` (routers.js:516) and `/stripe-get-payment-methods` (routers.js:582) are studio-admin surfaces — do not use them. `/stripe/get-payment-options` does not exist; `getAllCardOptionsForUser.js` is confirmed dead code.
- **3DS / `requires_action` on saved-card payments:** PaymentSheet handles 3DS for new cards, but the saved-card path sends `pm_xxx` for server-side use. If the PaymentIntent comes back `requires_action`, the app MUST call the Stripe RN SDK's `handleNextAction(clientSecret)` and then re-poll/complete the booking — the widget has NO explicit handling for this today (verified: zero `requires_action`/`handleCardAction` references in dibs-widget-new), so "mirror the widget" is insufficient here. **Trace update 2026-07-21:** it's worse than "no handling" — the widget's charge rail creates AND confirms the PI server-side with `off_session: true` (`services/shared/stripe/charge-card.js`), so a 3DS challenge hard-fails on web today. See §7 item 7.8 for the decision this forces. Preferred shape: backend creates the PI and returns `clientSecret` + status; app confirms client-side (`confirmPayment` with the saved `pm_xxx`) so the SDK owns the 3DS challenge end-to-end. Mostly-US cards make this rare; rare ≠ ignorable for a payment flow.
- **Add card without purchase (billing screen):** `POST /stripe/create-setup-intent` → confirm with PaymentSheet in setup-intent mode. Remove: `POST /stripe/remove-card`. Default: `POST /stripe/set-default-card`.
- Dev vs prod Stripe IDs: the backend handles the `_test` field swap; the app just needs the right `EXPO_PUBLIC_API_URL` + matching publishable key returned by the API. Never hardcode keys.

### 3.5 Domain layer (pure TS, golden-master tested)

Port from the widget/legacy with tests BEFORE building the screens that use them (`legacy-reference/` and `dibs-widget-new` are the reference implementations):
- `domain/pricing` — DONE (280 tests).
- `domain/passes` — pass eligibility + priority sort (which pass auto-applies to which event). Reference: widget `sortPassesByPriority.js`. **Placeholder passes (`is_placeholder`) are never shown and never selectable** — see §9.
- `domain/promos` — promo application semantics (CASH_OFF, PERCENT_OFF, FIXED_PRICE, FREE_CLASS), tax recalculation on discounted subtotal.
- `domain/recurring` — the payNow/hold occurrence split for recurring appointment checkout (the "25th rule" billing window). Reference: widget recurring checkout actions + `.claude/SUBSCRIPTION_BILLING.md`. Get golden masters by recording widget payloads for 3-4 real scenarios.
- `domain/cancellation` — early/late cancel determination from `default_cancel_time_group` / `_private` / `_subscription` config values. Reference: `.claude/CANCELLATION.md`.
- `domain/stats` — gamification derivations (visit count, lifetime spend, milestone progress) computed from API data; see §7.6.

Rule: domain outputs are **display estimates**. The server's returned breakdown is the number we show at confirmation and charge. If domain estimate ≠ server total, show server total and log the divergence (`src/lib/analytics.ts`).

### 3.6 State

- **TanStack Query = all server data.** Query keys in `src/api/keys.ts`: `['config', studioId]`, `['schedule', studioId, range]`, `['passes', userId]`, `['credit', userId]`, `['subscriptions', userId]`, `['paymentMethods', userId]`, `['flashCredits', userId]`, `['history', userId]`, `['milestones', userId]`.
- **Zustand = UI/session only:** `authStore` (userid, profile snapshot, hydration state), `cartStore` (in-progress checkout selection), `uiStore` (sheets, toasts). If a Zustand store starts holding anything the server also knows, that's a bug.
- Offline: TanStack persister (AsyncStorage) so schedule + account render instantly from cache; mutations require connectivity (no offline booking queue in v1). **Persist an explicit whitelist of query keys only** (`config`, `schedule`, upcoming bookings). Never persist payment methods or the full account payload — AsyncStorage is unencrypted; PII and payment data stay in memory.

### 3.7 Time semantics — display vs arithmetic (read twice; this is the bug class most likely to ship)

All stored event times are **studio wall-clock labeled as UTC** ("fake UTC" — the platform Timezone Rule). That convention is safe for display and lethal for arithmetic:

- **Display:** show the stored value verbatim. Never convert with the device timezone. (Unchanged.)
- **Arithmetic — cancel windows, countdowns, "starts in 2h" copy, past/upcoming bucketing:** NEVER compare device `Date.now()` (a real UTC instant) against stored times (fake UTC). The result is off by the studio's UTC offset — 4–8 hours for the pilots, enough to flip an early cancel into a late cancel and charge someone. ALL window/countdown math goes through one canonical helper: `src/domain/time/studio-now.ts` → `studioNow(mainTZ)` returns the current studio wall-clock re-encoded in the same fake-UTC frame as stored times, so every comparison is frame-consistent. Golden-master its consumers against widget behavior (the widget's early/late determination is the reference implementation).
- **Field classification is a deliverable, not tribal knowledge:** `docs/time-semantics.md` — a table classifying every timestamp field the app consumes as *wall-clock* (`start_date`, `end_date`, `visitDate`, …) or *real instant* (`createdAt`, Stripe timestamps, …). Flash-credit `expires_at` MUST be classified by reading the backend writer before any countdown is built (P6). New field → classify before use.
- **Two sanctioned conversions only:** (1) device-calendar inserts reconstruct the real instant via `fromZonedTime(wallClock, mainTZ)` (P3); (2) server-side push scheduling (P7 backend) works in real instants — that's backend territory following backend conventions.

---

## 4. Phases

Every phase ends with: `npm run typecheck && npm test && npm run lint` clean, the acceptance checklist below verified in the iOS simulator AND an Android emulator, and a short written report (what passes, what needs Alicia's eyes, concerns). Phases marked 🎨 have a design gate: the relevant screens from `DESIGN_BRIEF.md` output must be approved by Alicia BEFORE implementation of those screens begins.

### Session protocol — multi-session model runs (read every session)

1. **`EXECUTION_STATE.md` at repo root is the single source of truth for app-side progress** (seeded 2026-07-26; backend items live in `backend-workstream/STATUS.md`). One row per phase item: `done / in-progress / blocked-on-Alicia (reason) / not-started`, plus a "next up" line. Update it at the end of EVERY session.
2. **Blocked ≠ idle.** When an item hits an approval gate, a design gate, or a missing prerequisite (§0.5): record the blocker and move to the next unblocked item — including jumping ahead to independent work (e.g., P3's pass path while Lane 5 is pending). Never improvise past a gate; never end a session "waiting."
3. **A phase is a testable checkpoint.** Each phase must end in a state Alicia can exercise on a simulator/device. Never report a phase complete with unverified acceptance items — list them under "needs Alicia's eyes" instead. Don't start phase N+1 work that *depends* on unverified phase-N acceptance; the parallel lanes (backend 7.x, store enrollment, design mocks) are exempt by design.
4. **One phase-item per PR, committed locally, never pushed** — operator policy: Alicia reviews in GitKraken and pushes.

### P0 — Foundation (est. 2 weeks)

Everything later depends on this. No screens yet beyond a dev shell. (Honest sizing: seven workstreams including full auth flows, an 8-component theme system, the white-label pipeline, and CI is two weeks of work, not one.)

0. ~~**Kick off store enrollment for all three pilot studios NOW**~~ **SUPERSEDED by §0.1-A (2026-08-04).** The two v1 studios ship as updates to existing Dibs-owned listings, so no enrollment is on the critical path. What replaces this item: confirm access to the Dibs Technology Inc App Store Connect account, and confirm whether either app ever shipped on Google Play. Studio-owned enrollment (§6.3) applies only to genuinely new studio apps, of which 263 is the first — and 263 is deferred past v1 (§0.1-B). **Also kick off backend Lane 5 NOW** — the 7.8 endpoint + widget migration (`July21/widget-class-checkout-migration-plan.md`). It must be live and widget-proven before P3's card path; starting it when P3 starts would block the crown-jewel phase by its full length (§10 chart).

1. **Deps + dev builds:** install the §2 "not yet installed" list. `@stripe/stripe-react-native` and `expo-notifications` need config plugins in `app.config.ts` — convert `app.json` → `app.config.ts` now (white-label requires it anyway, §6). ⚠️ **This commit ends Expo Go** — both libraries contain native code. From here the dev loop is a development build: `npx expo run:ios` / `npx expo run:android` locally (toolchain per §0.5-F), plus `eas init` + a minimal `development` profile in `eas.json` NOW (full per-studio profiles still land in P9; P7 device push testing needs the EAS project to exist). Budget a half-day for the first successful dev build on each platform — it never "just works."
2. **API client** per §3.2 + zod schemas for the P1/P2 endpoints. Version-compat plumbing reads an optional `minAppVersion` field from `get-basic-config` and shows an update banner when the installed build is older — tolerate the field being absent (the backend side is item 7.9, additive + approval-gated, and must never block P0). There is no existing `/api/v2/version` endpoint — do not invent one. Also: a one-hour **endpoint re-verification grep** of every P1/P2 endpoint in this plan against current dibs-api `routes/routers.js` — the §4 tables were verified 2026-07-06 and auth mounts are being added on an ongoing basis (7.3 workstream); confirm each route's current auth expectation and that guest-mode endpoints (`get-basic-config`, `get-schedule`, packages, categories) remain public.
3. **Auth wiring** per §3.3: firebase.ts, authStore, sign-in/sign-up/reset screens (functional, unstyled OK until design gate), token injection, 401 handling.
4. **Theme system** per §5.1 (tokens + provider + 6-8 core components: Button, Text styles, Card, Sheet, Input, Chip, Skeleton, EmptyState).
5. **White-label config loader** per §6.1 — even with one test studio, the pipeline exists from day one so nothing gets hardcoded.
6. **Error/loading grammar:** every screen uses Skeleton (loading), EmptyState (no data), ErrorState (retry). Build these three ONCE.
7. **CI:** GitHub Actions — typecheck + lint + jest on every PR. (Full EAS build profiles in P9; the `development` profile from item 1 already exists.)
8. **Design mocks — full set, batch-reviewed (this turns §10's front-load advice into an owned task):** produce the complete mock set for ALL 🎨 phases per §5.3 (P1–P6 screens × the 3 pilot variants + the hostile-red stress variant) during P0; Alicia batch-reviews in 1–2 sittings so no build phase ever waits on design. Per-screen approval status is tracked in `EXECUTION_STATE.md`.

**Acceptance:** app boots to a themed shell with the test studio's branding; can sign in against staging; token-authenticated request to `POST /api/v2/widget/get-user-account` succeeds; all checks green.

### P1 — Browse 🎨 (est. 1.5 weeks)

Home, class schedule, appointment browsing. Design gate: Home, Schedule, Class Detail, Appointment Type screens.

**Endpoints:**
| Purpose | Endpoint |
|---|---|
| Studio config + branding | `POST /api/v2/widget/get-basic-config` `{ dibsStudioId }` — returns color, logo (`color_logo`), `hero_url`, timezone (`mainTZ`), feature flags (`show_schedule`, `show_appts`, `show_credit_load`), cancel windows, `instructor_alt_name`, terms, tax data, locations |
| Class schedule | `POST /api/v2/widget/get-schedule` |
| Appointment categories | `POST /appts/get-unique-categories` `{ dibsId }` |
| Appointment availability slots | `POST /api/v2/appts/get-availability` |
| Pre-booking validation | `POST /confirm-space`, `POST /confirm-class-exists` |

**Rules:**
- `show_schedule` / `show_appts` flags decide which tabs exist (some studios are classes-only, some appointments-only). Navigation must handle all three combinations gracefully — a studio with only appointments should never show an empty Classes tab.
- All times are **UTC stored, displayed verbatim** (platform Timezone Rule — see `.claude/CLAUDE.md` "Timezone Rule"). Display the stored hour; do NOT convert with the device timezone. Use the studio's `mainTZ` only where the API contract expects it. Any past/upcoming bucketing or "starts in Nh" copy in the schedule uses `studioNow(mainTZ)` per §3.7 — never device now.
- `instructor_alt_name` replaces the word "Instructor" everywhere it appears.
- Capacity states on class cards: open / nearly full ("3 spots left" when ≤3) / full+waitlist / full.
- **Degraded studio mode:** if the studio is not live / in soft-lockout (per config), the app renders read access + a calm "booking temporarily unavailable" state instead of booking CTAs; cancellations stay allowed. See §6.3 "Studio lifecycle states."

**Acceptance:** real staging studio renders home + schedule + appointment types; classes-only and appointments-only studios both render correctly; pull-to-refresh; skeletons on cold load; cached render when offline.

### P2 — Account core & billing info 🎨 (est. 1 week)

Profile, saved cards, credit balances. Design gate: Account hub, Wallet/Billing screen.

**Endpoints:**
| Purpose | Endpoint |
|---|---|
| Full account | `POST /api/v2/widget/get-user-account` (requireWidgetAuth) |
| Update profile / phone / comms prefs | `POST /update-profile`, `POST /user/update-phonenumber`, `POST /user/update-communication-preferences` |
| List saved cards | `POST /stripe/get-all-payments` — the widget's live endpoint (see §3.4; response shape documented in `docs/verified-widget-sequences.md`) |
| Add card (no purchase) | `POST /stripe/create-setup-intent` → PaymentSheet (setup mode) |
| Remove card / set default | `POST /stripe/remove-card`, `POST /stripe/set-default-card` |
| Credit balance | `POST /get-credit` `{ userid, dibsid }` |
| Passes owned | `POST /get-passes` `{ userid, dibsid }` |

**Rules:**
- Filter `is_placeholder` passes out of every list (§9).
- Credit balance is fetched live before display — never trusted from cache at checkout time (matches widget behavior).
- Removing the card that backs an active membership: warn ("This card pays for your [membership name]") before confirming. Detect via subscriptions data (P5 hook can land early as data-only).

**Acceptance:** add a card via PaymentSheet on staging Stripe, see it listed, remove it; credit balance matches the widget for the same test user; profile edit round-trips.

### P3 — Checkout: classes & single appointments 🎨 (est. 2 weeks — the crown jewel)

> **⚠️ Narrowed to CLASSES ONLY for v1 (2026-08-04, §0.1-B).** Skip every appointment row in
> the matrix below, including `complete-appointment-booking`. The build order already puts the
> class paths first, so this mostly removes work rather than reordering it.

Design gate: payment selection sheet, confirmation screen, booking-success moment.

**Endpoints — scenario matrix (keyed to CHECKOUT.md; verified against routers.js 2026-07-06 except where marked):**

⚠️ `POST /checkout/complete-appointment-booking` is **APPOINTMENTS-ONLY** — the service hardcodes `eventtype: 'appt'`, `seats: 1`, `private: true` and requires an `appointment_types` row. It never handles group classes. Do not route class bookings through it.

| Scenario | Endpoint(s) |
|---|---|
| Smart payment options for an event | `POST /checkout/payment-options` (routers.js:399) |
| **Appointment** — any payment type | `POST /checkout/complete-appointment-booking` — payload includes `paymentMethod { type: card\|pass\|credit, paymentMethodId?, passId?, useCredit }`, `pricingBreakdown`, `appliedPromo`, **`source: 'dibs'`** |
| **Class + pass and/or credit** | `POST /checkout-with-pass-and-or-credit` |
| **Class + credit only** | `POST /checkout-credit-only` |
| **Class, free/comp** | `POST /checkout-free-event` |
| **Class + card** | **Implementation = the new 7.8 endpoint (Option B, decided 2026-07-21): pass-based + client-side confirm.** The traced widget sequence below is kept as REFERENCE for parity testing and for understanding legacy rows — do NOT implement it for mobile. Widget sequence (verified by source trace, HIGH confidence): `POST /start-dibs-transactions` (creates `dibs_transaction` type='class', status 0, unpaid true — **no pass row in this flow**) → `POST /stripe/clone-payment-method-only` (Dibs-platform cards only; fingerprint-deduped) → `POST /stripe/charge-card` (PI created **and confirmed server-side**, `off_session: true`, on the connected account; also sends confirmation + ops emails) → `POST /update-dibs-transactions-uuid` (status→1, stamps `stripe_charge_id`, creates the attendee with `attendeeID = String(transaction.id)`) → `POST /update-event-counts`. New-card variant runs a save-card phase first: `POST /stripe/create-setup-intent` → client `confirmSetup()` → `POST /stripe/create-user-connected` → card-list refresh. NOTE: `/passes/create-after-charge` + `/checkout/record-booking-with-pass` are **appointments-only**; the `create-payment-intent*` routes are never called by mounted widget code. ⚠️ This rail cannot do 3DS/SCA — decision required, §7 item 7.8. |
| Promo validation | `POST /verify-promo-code-exists` → `POST /check-promocode-usage-limits` (second call only when the code has limits configured). **Trace findings (2026-07-21):** the discount is computed CLIENT-side (`applyPromoCode.js` pattern) — the server does not return a discounted total and does not re-validate at charge time. The widget's class-checkout promo component is a broken hard-coded stub; the working reference is the appointments/packages promo component (`components/promo-codes/new/index.js`). Widget bug NOT to copy: it reads `atCodeLimit` but the backend returns `atStudioLimit`, so per-code caps are silently unenforced. |
| Waitlist | `POST /add-to-waitlist` |
| Cancel a booking | `POST /drop-event` `{ userid, classid, dibsid }` |

**Build order inside P3 (decouples the phase from Lane 5):** (1) pass path → (2) credit path → (3) free/comp → (4) promo entry → (5) cancel + waitlist → (6) **card path LAST**, against the 7.8 endpoint. If Lane 5 isn't live on staging when items 1–5 are done, mark the card path `blocked-on-Lane-5` in `EXECUTION_STATE.md` and proceed to P4 — do NOT build the legacy `start-dibs-transactions` rail as a stopgap.

**Payment selection logic (mirror the widget exactly):**
1. If an eligible pass exists → preselect it (via `domain/passes` priority sort).
2. Else if credit covers the total → offer credit.
3. Else → card (saved card default, or PaymentSheet for new card / Apple Pay / Google Pay).
4. Promo code entry always available; recompute via `domain/promos`, confirm against server totals.

**Also in P3:**
- **Add to calendar** post-booking: `expo-calendar` insert with class name, studio address, start/end (permission requested in-context at the moment of tap, never on launch).
  - ⚠️ **This is the ONE sanctioned exception to invariant #3 (UTC verbatim).** Stored times are studio wall-clock labeled UTC — but a device calendar entry needs a real instant. Reconstruct it as `wall-clock time interpreted in the studio's mainTZ` (date-fns-tz `fromZonedTime`), otherwise the entry lands at the wrong time for any device not set to the studio's timezone (and even matching-TZ devices get shifted by the OS). Display surfaces still show the stored value verbatim; only the calendar insert converts.
- Cancel flow with early/late messaging from `domain/cancellation` — show what the user gets back (pass use / credit) BEFORE they confirm, using CANCELLATION.md rules. Early/late determination compares `studioNow(mainTZ)` (§3.7) against the stored class time — never device now; the frame mismatch is a 4–8 hour error that charges people.
- Waitlist join when full.

**Acceptance:** on staging — book a class with a pass; with credit; with a new card via PaymentSheet; with Apple Pay (simulator supports test cards); apply a promo; cancel early and see pass returned (verify in DB or studio admin); the confirmation totals match the widget for identical bookings; ops email fires; `source='dibs'` on created rows.

### P4 — Packages & memberships 🎨 (est. 1.5 weeks)

Design gate: package storefront, membership card, cancel-membership dialog.

**Endpoints:**
| Purpose | Endpoint |
|---|---|
| Package list | `POST /api/v2/widget/get-packages` |
| Buy pack (card / credit / free) | `POST /checkout-package-credit-card`, `/checkout-package-using-credit`, `/checkout-package-no-charge` + `POST /passes/create-after-charge` |
| Enroll membership (Stripe subscription) | widget path via `POST /stripe/create-subscription` (backed by `lib/purchasing/shared/stripe/index.js` — this path populates `dibs_studio_id` on the autopay row; keep it) |
| Cancel membership renewal | `POST /stripe/cancel-renewal` `{ dibsId, userid, passid }` |
| Membership list/state | passes with `autopay=true` + `POST /studio/client/stripe-memberships` |

**Rules (read `.claude/SUBSCRIPTION_BILLING.md` + the Memberships section of `.claude/CLAUDE.md` first):**
- Membership cancel is `cancel_at_period_end` — copy must say "you keep access until {expiresAt}". Never imply immediate termination.
- **Reactivation is retired platform-wide** (2026-05-16 decision). A canceled membership re-starts via a fresh enrollment, not a "reactivate" button. Do not build reactivate.
- Pause membership: **NOT in v1.** View + cancel only. (Widget's pause is admin-driven; self-serve pause is a deliberate later decision.)
- The `purchasePlace` value written by any new backend code must fit VARCHAR(32) (see the 2026-07-06 invoice post-mortem in `.claude/CLAUDE.md`).
- Cancel actor tracking: the widget self-cancel path writes `cancellation_source='widget_self_service'`. Mobile cancels go through the SAME route so they're recorded; if product wants to distinguish mobile later, that's a backend enum addition (`'mobile'`) — flag, don't improvise.
- **Pre-P4 deliverable — membership-enrollment source trace:** the enrollment route above is UNVERIFIED. The table's claim conflates two things shared CLAUDE.md describes separately: `services/shared/stripe/create-subscription.js` (the studio-admin enrollment path) and `lib/purchasing/shared/stripe/index.js` (the widget enrollment path) — they may be different mounted routes. Trace the widget's real enrollment call sequence into `docs/verified-widget-sequences.md` BEFORE building the membership screens, then correct the endpoint table.

**Acceptance:** buy a pack on staging → appears in Wallet and in the widget for the same user; enroll a membership → autopay row + pass created (`dibs_studio_id` populated); cancel → widget shows the same canceled state; studio notification email fires on cancel (dispatcher Hook A).

### P5 — Subscriptions (recurring appointments), payments past & upcoming 🎨 (est. 2 weeks)

> **⚠️ DEFERRED PAST v1 in its entirety (2026-08-04, §0.1-B).** Recurring appointment
> subscriptions are studio 263's model, and 263 is out of v1. Payment history and upcoming
> charges for the v1 studios are membership- and package-shaped, and belong with P4.
> Keep this section as the v1.1 spec — including its un-discharged pre-P5 source-trace
> deliverable, which is still required before anyone builds it.

Design gate: subscription card, upcoming-payments view, payment-history list.

**Endpoints:**
| Purpose | Endpoint |
|---|---|
| Create recurring subscription | `POST /appointments/recurring/enhanced` — payNowOccurrences / holdOccurrences / perOccurrenceAssignments payload (use `domain/recurring`) |
| Generate future unpaid sessions | `POST /appts/generate-weekly-unpaid-appts` |
| Link events | `POST /appts/link-events-to-subscription` |
| List subscriptions (next billing date, next amount, last charge) | `POST /api/v2/widget/user-subscriptions` (requireWidgetAuth) |
| Notice-period config | `POST /widget/get-cancel-time-settings` |
| Cancel one session | `POST /widget/cancel-subscription-session` (returns `earlyCancel`, `passReturned`, `creditsReturned`) |
| Cancel entire subscription | `POST /api/v2/widget/cancel-subscription` (requireWidgetAuth) |
| Payment history | `POST /api/v2/widget/payment-history` (requireWidgetAuth) |
| Upcoming bookings | `POST /get-upcoming-classes-new`, `POST /get-upcoming-appts` |

**Rules (read `.claude/SUBSCRIPTION_BILLING.md` first — the 20th/25th cycle):**
- "Upcoming payments" view = per-subscription `next_billing_date` + amount from `user-subscriptions`, framed around the 20th (invoice created) / 25th (charged) cycle. Copy: "Your next invoice for {subscription} will be charged on the 25th: ${amount}."
- Cancel flows must surface the notice period (`default_cancel_time_subscription`, hours) and clearly state early-cancel consequences BEFORE confirmation.
- Payment history must render every row the widget renders — same endpoint, same ordering. Do NOT recompute amounts client-side; the backend already handles the `amount_charged` legacy-leak logic (see `.claude/CLAUDE.md` "Key Fields").
- Subscription holds have `unpaid=true` / `status=0` — they are legitimate upcoming sessions, not errors. Never filter them out of upcoming views.
- **Pre-P5 deliverable — recurring-checkout source trace:** the class-card checkout earned a full verified sequence (`docs/verified-widget-sequences.md`); the recurring flow — more complex and multi-call (`/appointments/recurring/enhanced`, `generate-weekly-unpaid-appts`, `link-events-to-subscription`, possibly `add-appt-dibs-transactions` / `add-appt-attendees`) — has none. Trace the widget's real call order + payloads and record the 3–4 golden-master scenarios BEFORE building. The three endpoints in the table above are candidates from a 2026-07-06 route scan, not a verified sequence.

**Acceptance:** create a weekly recurring appointment on staging paying with card — verify payNow/hold split matches what the widget produces for the same inputs (golden-master fixtures); subscription card shows correct next billing date/amount vs studio admin; cancel one session (early) → pass/credit return messaging correct; full cancel → notice-period logic correct + studio notification fires (Hook C-widget); payment history matches widget row-for-row.

### P6 — Flash credits, credits, gamification pipes 🎨 (est. 1 week)

Design gate: flash-credit surface (the "fun and exciting" moment), stats/milestone card.

**Endpoints:**
| Purpose | Endpoint |
|---|---|
| Active flash credits | `GET /api/v2/widget/active-flash-credits?userid=X&dibsId=Y` (auth'd) |
| Milestone progress | `POST /api/v2/widget/milestones/progress` `{ userid, dibsStudioId? }` (requireWidgetAuth) — returns live `currentCount`, `earned`, `next`, `unclaimedCelebrations` |
| Acknowledge celebration | `POST /api/v2/widget/milestones/acknowledge` `{ userid, milestoneEventId }` |
| Visits/spend for stats | derive from payment-history + upcoming/attendee data (see `domain/stats`) |

**Flash credits UX (the design brief owns the visual; the mechanics):**
- Surface on Home when ≥1 active credit: a live-countdown element (expires_at), amount, and the condition. Tapping deep-links to the action that earns/uses it. ⚠️ Classify `expires_at`'s time frame per §3.7 (real instant vs studio wall-clock) by reading the backend writer BEFORE building the countdown — a frame mismatch here shows a countdown that's hours wrong.
- At checkout, when a flash credit applies, the discount line animates in with its own labeled row — the user should FEEL the win.
- Push notification on new flash credit (P7).

**Gamification pipes (build the plumbing, keep UI minimal):**
- `domain/stats` module + `useStats()` hook exposing: `totalVisits`, `lifetimeSpend`, `milestonesEarned`, `nextMilestone { threshold, remaining }`, `unclaimedCelebrations`. All computed from existing endpoints — NO new backend.
- V1 UI: one understated "Your journey" card on the Account screen (visits + next milestone progress) and a **milestone celebration moment** — when `unclaimedCelebrations` is non-empty, show a full-screen takeover celebration once, then `acknowledge`.
- ⚠️ **GATE: the milestones backend must be located or built first — see §7 item 7.6.** Shared CLAUDE.md documents it as shipped 2026-06-10, but it is verifiably absent from dibs-api (local, worktrees, and origin). Do NOT start the milestone screens until the endpoints respond on staging. If the work can't be found, ship P6 as flash credits + stats-card only and move celebrations to v1.1 — flash credits and the stats pipes have no such dependency.
- Status levels/perks: NOT in v1. The hook's shape should make them a pure additive later.

**Acceptance:** seed a flash credit for a test user → renders with countdown, applies at checkout; milestone crossing (seed via sweep backfill on staging) → celebration fires once and acknowledges; stats numbers match reporting definitions (visits = non-dropped attendees with `visitDate <= now`).

### P7 — Push notifications & backend workstream (est. 1.5 weeks, backend + app in parallel)

**Backend (dibs-api) — ⚠️ REQUIRES ALICIA'S APPROVAL before migration (schema change):**
1. Table `user_push_tokens`: `id, userid (FK dibs_users), dibs_studio_id, expo_push_token (unique), platform ('ios'|'android'), app_slug, last_seen_at, createdAt, updatedAt, deletedAt` (paranoid). The Loyalty Milestones design doc already sketches this shape — follow it.
2. Routes (widget-auth'd): `POST /api/v2/widget/push/register`, `POST /api/v2/widget/push/unregister`.
3. Send service `services/shared/notifications/send-push.js` using `expo-server-sdk` — fire-and-forget, per-token try/catch, prune tokens on `DeviceNotRegistered`, greppable error id (`[PUSH-DISPATCH-ERR id=...]`) mirroring the `dispatch-notification.js` pattern.
4. Scheduled sends follow the platform cron convention: **thin axios caller in `dibs-scheduled-jobs` → INTERNAL_API_KEY-gated endpoint in dibs-api** which holds all logic. First job: class reminder (2h before start, reuse the virtual-class-link windowing pattern from `services/shared/email/send-virtual-class-links.js`).
5. Event-triggered pushes hook into existing code paths (fire-and-forget `.catch(() => {})`): booking confirmed, waitlist spot opened, new flash credit, milestone reached (`dispatch-client-milestone.js` gets a push channel), upcoming subscription charge (3 days before the 25th).

**App:**
- `expo-notifications`: permission requested **after the user's first successful booking** (never on first launch — earn the ask), token registration on grant + refresh, foreground handler (in-app toast), notification → deep link routing (booking → booking detail, flash credit → home surface).
- Notification preferences screen (per-category toggles, stored server-side via comms preferences).

**Acceptance:** booking on staging triggers a push to a real device (Expo push works in dev builds); reminder job dry-run lists correct recipients; unregister on sign-out; iOS + Android both receive.

### P8 — Polish & platform integration (est. 1 week)

- Biometric quick-unlock (expo-local-authentication) for returning sessions.
- Haptics on key moments (booking success, milestone) — expo-haptics, subtle.
- Native share for refer-a-friend (endpoints exist: `POST /get-friend-referrals`, `/get-referral-amount`, `/create-friend-referral`) — share sheet with the referral link + credit incentive copy.
- **In-app account deletion — HARD App Store requirement (Guideline 5.1.1(v)):** any app with account creation must offer in-app account deletion, or Apple rejects. UI lands here (quiet row in Account hub, typed-confirmation dialog); backend endpoint is §7 item 7.7 (approval gate — build it earlier so P8 only wires UI). Semantics per 7.7: block deletion while a membership or recurring subscription is active (direct the user to cancel first — honest, and avoids silently killing paid entitlements); on delete, remove the Firebase user, soft-delete/anonymize the `dibs_user` row (paranoid pattern), retain Stripe customer + transaction history (financial records), unregister push tokens.
- App Store review prompt (`expo-store-review`) after 2nd successful booking, max once per version.
- Accessibility pass: Dynamic Type, VoiceOver/TalkBack labels on all interactive elements, contrast validation of studio accents (§5.2 fallback logic).
- Error-reporting wiring (Sentry via `sentry-expo`).

### P9 — White-label factory & store readiness (est. 1.5 weeks + per-studio lead time)

See §6 for the full build system. This phase productionizes it:
- `whitelabel/studios/<slug>/` for the 2 pilot studios + the icon/splash generation script.
- `eas.json` profiles: `development`, `preview`, `production` (env-driven `STUDIO_SLUG`).
- **Store compliance runbook** (§6.3) executed for pilot studio #1: Apple Developer enrollment, ASC app record, EAS Submit, review notes.
- Store assets pipeline: screenshots (per-studio branding, generated from the running app), privacy nutrition labels (data types: identity, purchase history, contact info — linked to user), `NSCalendarsUsageDescription` etc. permission strings with per-studio names.
- OTA update channel per studio (EAS Update), respecting store policy (JS-only changes).

### P10 — QA hardening & launch (est. 1.5 weeks)

- Maestro E2E flows: sign-up → browse → book with card → cancel; buy pack → book with pass; enroll membership → cancel. Run on both platforms in CI (EAS workflows or local).
- **Parity audit — scripted, not eyeballed:** a small script (`scripts/parity-audit.ts`) that hits the same endpoints with the same test user's token as both app and widget would, and diffs the JSON the two clients render from (passes, history, subscriptions, credit, next-billing amounts). Runs in CI so parity is continuously enforced, not a one-shot human pass. Supplement with a manual screenshot pass for rendering/rounding bugs the JSON diff can't see. Zero tolerance for divergence (§9 invariant).
- Beta: TestFlight + Play internal track with pilot studio's real staff as testers.
- Launch runbook: staging → prod env flip checklist, webhook/monitoring checks, support escalation path.

---

## 5. Design System (see DESIGN_BRIEF.md for the full brief)

### 5.1 Two-layer theming — the core idea

**Layer 1 — Template DNA (fixed, identical in every studio's app):** typography system (editorial serif display + humanist sans body — Fraunces + DM Sans, both OFL-licensed so they can ship embedded in apps), type scale, spacing rhythm, layout grammar, radii, motion curves, component anatomy, iconography (Lucide, 1.5px stroke). This is what makes every Dibs-built app feel expensive and NOT generic.

**Layer 2 — Studio Personality (per-studio, injected at build):**
- `accent` — the studio's brand color, expanded into a derived scale (accent, accentPressed, accentSubtle/wash, onAccent) via a contrast-safe derivation function in `src/theme/accent.ts` (port the widget's `accentTones()` logic as the starting point; add a WCAG-AA guard that darkens/lightens until text passes).
- `logo` — header + splash.
- `heroImage` — the vertical brand photo: splash treatment, Home cover, auth backdrop.
- App name, icon (generated), support email.

Implementation: `src/theme/tokens.ts` (DNA) + `src/theme/studio.ts` (personality, loaded from white-label config) → merged in a ThemeProvider → consumed via a `useTheme()` hook. **No component ever references a raw hex.**

### 5.2 Guardrails on studio inputs

Studio-provided colors can be terrible (neon yellow, near-white). The derivation function must: enforce AA contrast for text-on-accent (auto-switch `onAccent` black/white), generate a muted wash for backgrounds, and clamp saturation for large fills. The hero image gets a consistent treatment (subtle darkening gradient for text legibility) so any decent photo works.

### 5.3 Design workflow (per 🎨 phase)

1. Screens for the phase are mocked as **standalone HTML previews** (390×844 device frames) per the CLAUDE.md preview rule — produced by running `DESIGN_BRIEF.md` through a design-focused Claude session, or by the executing model following the brief.
2. Alicia reviews in a browser and approves/annotates.
3. Implementation matches the approved mock. The self-review step diffs the built screen against the mock.
4. Each mock must be shown in **3 personality variants — the three REAL pilot studios defined in the brief** (Carlsbad Village Yoga, Everyday Ballet, Independent Training Spot), plus the brief's fourth hostile-red stress variant for Home + payment sheet only. The mocks ARE the pilot products under review, not hypotheticals.

---

## 6. White-Label Build System

### 6.1 Config-as-data

```
whitelabel/
  studios/
    _template/studio.json          # documented schema
    drift-yoga/                    # pilot example
      studio.json
      assets/logo.png  hero.jpg  icon-source.png
  scripts/
    generate-assets.ts             # icon/splash/adaptive-icon from logo+accent (sharp)
    validate-studio.ts             # schema check + contrast check + asset dims check
```

`studio.json` (zod-validated):
```jsonc
{
  "slug": "drift-yoga",
  "dibsStudioId": 226,
  "appName": "Drift Yoga",
  "accentColor": "#7A8B6F",
  "ios":     { "bundleId": "com.driftyoga.app", "appleTeamId": "…", "ascAppId": "…", "merchantId": "merchant.com.driftyoga.app" },
  "android": { "package": "com.driftyoga.app" },
  "support": { "email": "hello@driftyoga.com" },
  "legal":   { "privacyPolicyUrl": "https://ondibs.com/legal/privacy/drift-yoga" },  // REQUIRED for every store listing — hosting model decided in P9 (Dibs-hosted templated page per studio suggested)
  "api":     { "url": "https://api.dibsonline.com" }  // canonical prod host (§0.5-A) — NOT api.ondibs.com, NOT *.herokuapp.com
}
```

`app.config.ts` reads `process.env.STUDIO_SLUG`, loads the studio.json + assets, and emits the Expo config (name, icon, splash, bundle ids, scheme, Stripe merchantIdentifier, EXPO_PUBLIC_STUDIO_ID, EXPO_PUBLIC_ACCENT, …). Runtime code reads only `expo-constants` extra — **never a hardcoded studio id anywhere in `src/`** (CI grep guard: `dibsStudioId\s*[:=]\s*\d` in src/ fails the build).

Note: `dibsStudioId` + branding also come live from `get-basic-config` at runtime — build-time config pins identity + assets; runtime config keeps operational fields (cancel windows, feature flags) fresh without a store release.

### 6.2 Build & release per studio

- `eas.json` production profile takes `STUDIO_SLUG` via env; one command: `STUDIO_SLUG=drift-yoga eas build --profile production --platform all`.
- EAS Submit with per-studio credentials (ASC API key / Play service account) stored in EAS secrets per project — one EAS project per studio app (cleanest credential isolation) OR one project with per-studio channels; decide in P9 after testing both (start with one-project-per-studio; it maps 1:1 to store apps).
- EAS Update channel per studio for OTA JS fixes.

### 6.3 Store acceptance — the real constraint (do not skip)

> **⚠️ Scope narrowed 2026-08-04 (§0.1-A).** Everything in this section describes the
> **studio-owned-account path**, which now applies ONLY to genuinely NEW studio apps. The two
> v1 studios (210, 88) ship as version updates into existing listings owned by Dibs Technology
> Inc — no enrollment, no DUNS, no new app record. Read this section when onboarding a studio
> that has never had an app, not for the v1 rescue.

**Apple Guideline 4.2.6/4.3:** apps generated from a template/app-generation service are rejected **unless submitted under the client's own developer account**. This is why every white-label fitness platform (Mindbody's branded apps included) requires each studio to enroll in the Apple Developer Program.

Runbook per studio (bake into studio onboarding):
1. Studio enrolls in Apple Developer Program as an **organization** ($99/yr; needs a DUNS number — 1-2 week lead time; sole proprietors can enroll as individual).
2. Studio adds Dibs (developer@ondibs.com) as **Admin** in App Store Connect, or issues an ASC API key scoped to App Manager.
3. Dibs creates the app record, uploads via EAS Submit, handles review responses. Review notes must include a demo account and explain the studio relationship ("published by the studio, built on the Dibs platform").
4. Apple Pay merchant ID is created under the STUDIO's team; certificate managed via EAS credentials.
5. **Push credentials are also per-studio:** each app needs its own APNs key (created under the studio's Apple team) and its own FCM configuration for Android — both managed via EAS credentials alongside the Apple Pay cert.
6. **Store-listing legal:** every app needs a per-studio **privacy policy URL** (studio.json `legal.privacyPolicyUrl`) and a support URL. Decide the hosting model once — a Dibs-hosted templated privacy page per studio is the cheap answer.
7. **Payments-outside-IAP defense:** the review notes should preemptively cite **Apple Guideline 3.1.3(e)** — class/appointment bookings and packages are services consumed *outside* the app (physical services), so Stripe is permitted and IAP is not required. Reviewers ask; have the sentence ready rather than losing a review cycle to it.

Google Play: same pattern (studio's own Play Console account, $25 one-time; Dibs invited as admin). Play's "repetitive content" policy makes publishing many templated apps under ONE Dibs account risky — per-studio accounts sidestep it.

**Timeline implication:** studio's store accounts are the long pole (2-4 weeks of paperwork, zero code dependency) — **start enrollment in week 1 (P0), not later.** The dependency bites earlier than launch: P10's TestFlight beta requires each studio's App Store Connect account to already exist, so enrollment slippage cascades into QA, not just release.

**Studio lifecycle states (don't skip):** a branded store app can't just vanish when the studio's Dibs relationship changes. The app must render a graceful degraded mode driven by config: when `dibs_studio.live = false` or the studio is in trial soft-lockout, show a calm "booking is temporarily unavailable — contact {studio}" state with read access preserved and cancellations still allowed (mirroring the backend's soft-lockout semantics; see shared CLAUDE.md). Full decommission (studio leaves Dibs) = store delisting via the studio's own account + an in-app sunset message for installed copies. Design brief screen 17 covers the visual.

---

## 7. Backend Workstream Summary (dibs-api)

All backend changes follow dibs-api conventions (see `.claude/CLAUDE.md`): approval gates for schema/endpoints/billing, canonical-doc updates in the same PR, `sendWebhookFailureAlert`-style loud failures, `withStudioScope` never needed here (these are widget-auth'd customer routes, use `requireWidgetAuth`).

| Item | Type | Phase | Approval needed |
|---|---|---|---|
| 7.1 `user_push_tokens` table + register/unregister routes + send service + reminder job | New table + endpoints | P7 | **YES — Alicia (schema + endpoints)** |
| 7.2 Event-hook pushes (booking, waitlist, flash credit, milestone, upcoming charge) | Additive hooks | P7 | YES (touches booking paths — review only) |
| 7.3 Auth hardening: mount `requireWidgetAuth` on customer endpoints that today run unauthenticated (`/drop-event`, `/stripe/remove-card`, payment-method listing, checkout routes, `/get-credit`, …) — **extracted to its own tracked plan: `dibs-api/docs/WIDGET_AUTH_HARDENING.md`** so it survives independently of this app's schedule. Scope addition (trace finding 2026-07-21): server-side re-validation of client-computed totals and promo discounts at charge time — the charge path currently trusts the amounts the client sends | Security fix | parallel, start early | **YES — coordinated with widget** (widget must send tokens on those calls first; roll out endpoint-by-endpoint behind logging) |
| 7.4 Optional: Stripe ephemeral-key endpoint (full PaymentSheet saved-card UX) | New endpoint | post-v1 | YES |
| 7.5 Optional: `'mobile'` cancellation_source + notification source values | Enum extensions | post-v1 | YES |
| 7.6 Gamification/milestones — **⚠️ VERIFY BEFORE P6:** the Loyalty Milestones backend documented in shared CLAUDE.md (2026-06-10) is **absent from the dibs-api local repo, all its worktrees, AND origin** (verified 2026-07-06: no code, no migrations, no branches). Either it lives in an unpushed clone somewhere, or it was never actually built. If it can't be located: milestones become a real backend workstream (2 tables + 2 endpoints + sweep job, approval gate) — or P6 ships flash credits + stats only and milestone celebrations move to v1.1 | Verification, then possibly tables+endpoints | before P6 | **YES if it must be built** |
| 7.8 **Mobile class-checkout endpoint (3DS-capable, pass-based) — DECIDED: Option B (Alicia, 2026-07-21).** New widget-auth'd endpoint pair: backend creates the PI *unconfirmed* on the connected account and returns `clientSecret`; app confirms via Stripe RN SDK (PaymentSheet owns 3DS end-to-end); backend then records the booking using the **CHECKOUT.md Scenario 5 data model** — paid pass created + redemption transaction + attendee + event counts + emails — reusing the existing `create-pass-after-charge` / `record-booking-with-pass` machinery, NOT the legacy `start-dibs-transactions` pipeline (which creates a bare `type='class'` transaction with no pass; verified in code 2026-07-21 — see `docs/verified-widget-sequences.md`). Rationale: the pass-based model is the platform's intended shape (Scenario 5); the widget's class path simply predates it. **REORDERED (Alicia, 2026-07-21): the widget migrates onto this endpoint FIRST** (widget ships well before the mobile app) — execution plan: `July21/widget-class-checkout-migration-plan.md` in this repo. One rail for both clients fixes the web 3DS gap, the `amount_charged` leak, and the row-shape divergence, and mobile P3 then consumes an already-proven endpoint. This is backend Lane 5. **Contract requirement: the new endpoint re-validates the promo code and recomputes the discount server-side (the client sends the code, never a discounted total).** The widget's trust-the-client promo pattern (see the promo row in P3) must not carry onto the new rail — retrofit-later is how the current hole happened. | New endpoint + widget migration (approved) | **Lane 5 starts in P0** (kickoff is P0 item 0); endpoint live before mobile P3 | Approved 2026-07-21; implementation review still required (billing path) |
| 7.7 **In-app account deletion endpoint** (Apple 5.1.1(v) — v1 blocker): `POST /api/v2/widget/delete-account` (requireWidgetAuth). Blocks with 409 if an active membership/subscription exists; else deletes Firebase user, soft-deletes/anonymizes `dibs_user`, retains Stripe customer + `dibs_transactions` (financial records), removes push tokens. No such endpoint exists today (verified) | New endpoint | before P8 | **YES — Alicia (endpoint + deletion semantics)** |
| 7.9 `minAppVersion` — additive optional field on `get-basic-config` so stale white-label builds can show an update banner (client plumbing ships in P0 tolerating absence; there is NO `/api/v2/version` endpoint and none should be created) | Additive field on existing endpoint | any time before launch | YES — endpoint contract change (small) |

⚠️ **7.3 is a real finding, independent of the app:** `/stripe/remove-card` and payment-method listing being callable without auth is a security gap TODAY. Recommend prioritizing it as its own workstream even if the app slips.

### dibs-api execution protocol (MANDATORY for every backend item above)

Operator policy is identical to this repo's: **commit locally, NEVER push; Alicia reviews in GitKraken and merges/pushes.** An executing model never merges to `main`, never pushes, never deploys, never touches Heroku.

1. **Never work in the primary checkout** (`/Users/aliciaulin/Desktop/dibs/code/dibs-api`) — it carries Alicia's in-flight uncommitted work. One worktree per backend item, branched from local `main` HEAD (dibs-api's default branch is `main`, unlike this repo's `master`):
   ```
   git -C /Users/aliciaulin/Desktop/dibs/code/dibs-api worktree add \
     /Users/aliciaulin/Desktop/dibs/worktrees/mobile-<topic>/dibs-api \
     -b feature/mobile-<topic> main
   ```
2. Do not fetch or pull remotes. If local `main` looks stale for the files involved, say so in the report and stop.
3. **Migrations are files, not actions.** Never run sequelize-cli / `npm run migrate` against any remote database — prod has no `SequelizeMeta` and deploys do not run migrations (shared CLAUDE.md, "Deploys do NOT run migrations"). Local dev DB only. Any branch containing a migration must state in bold in its report entry: **"migration must be applied to prod manually at deploy."**
4. Run dibs-api's existing test suite in the worktree before declaring an item done. Report failures honestly; never claim green without output.
5. Customer-facing routes mount `requireWidgetAuth` AND derive identity from the Firebase token server-side — never trust a `userid` from the request body for ownership decisions (the IDOR rule; see item 7.3).
6. Canonical docs (`.claude/*.md`) are updated on the same branch when behavior changes.
7. **Definition of done:** branch committed in its worktree + an entry appended to `dibs-mobile-app/backend-workstream/STATUS.md` (scope shipped, files touched, migration flag, test output summary, what needs Alicia's manual verification). The status file lives in the mobile repo — NOT on the dibs-api branch — so parallel branches never conflict over it.

---

## 8. Ideas Beyond the Ask (ranked, none block v1)

1. **Apple Wallet passes** for memberships/class packs — the membership card in Wallet with live remaining-uses. High delight, medium effort (PassKit + a pass-update endpoint). v1.1 candidate.
2. **Home-screen widget** (iOS/Android) — "Next class: Thu 10:30 Reformer" + one-tap booking deep link. Uses existing upcoming endpoint.
3. **iOS Live Activity** — class-day countdown on the lock screen from 2h before class.
4. **Waitlist auto-book opt-in** — "grab my spot automatically if one opens" (needs small backend flag; pairs perfectly with push).
5. **Streaks in the stats module** — weekly attendance streak derived client-side from attendee history; the celebration surface from P6 gives it a home. Feeds the future status-level system.
6. **App-exclusive pricing hooks** — when that future arrives, it's a `channel: 'app'` param on payment-options; the cart already carries `source`. Noted so nothing in v1 forecloses it.
7. **In-app studio announcements** — a lightweight `studio_announcements` surface on Home (backend table + admin CRUD later; design leaves a slot).

---

## 9. Invariants & Guardrails for Executing Models (READ FIRST, EVERY SESSION)

**Platform invariants (violating any of these is a critical bug):**
1. **Never create PaymentIntents client-side.** Backend creates on the studio's connected account; app confirms with clientSecret.
2. **`source: 'dibs'`** on every booking/transaction payload. Never `'zf'` (dead legacy value).
3. **All times UTC, displayed verbatim; all time ARITHMETIC through `studioNow()`** (§3.7) — no device-timezone conversion of stored times, and never compare device `Date.now()` against stored times (off by the studio's UTC offset; flips early cancels into late cancels). Sanctioned conversions: device-calendar inserts (P3) and server-side push scheduling (P7) only.
4. **`is_placeholder` passes never appear in any list and are never selectable/returnable.**
5. **Server totals are truth.** Client pricing is a display estimate; the confirmation screen and success state show server-returned amounts.
6. **Numbers must match the web.** Same endpoints as the widget, same rows, same amounts. If an endpoint would require client-side recomputation of money, stop — that's a design smell; find the endpoint the widget uses.
7. **No hardcoded studio IDs, colors, keys, or URLs in `src/`.** Everything flows from white-label config + `get-basic-config`.
8. **Zustand never mirrors server data.** Server state lives in TanStack Query only.
9. **No raw hex in components.** Theme tokens only.
10. `attendees.attendeeID` ↔ `dibs_transactions.id` join convention (STRING→INT cast) if any new backend read is written — see `.claude/CLAUDE.md` "Linking attendees ↔ dibs_transactions".
11. **`ios/` and `android/` belong to ONE studio. Switching `STUDIO_SLUG` means `npx expo prebuild --clean` first.** They are gitignored artifacts generated from `app.config.ts` for whichever studio built last, and `expo run:*` reuses them as-is instead of regenerating. Building Everyday Ballet on a Carlsbad `ios/` produced a single binary carrying Carlsbad's bundle id, display name, icon and deep-link scheme wrapped around Everyday Ballet's slug, `dibsStudioId` and accent (observed 2026-08-07: the Carlsbad icon launches, the app "switches" to Everyday Ballet when JS loads). That is a store hazard, not a cosmetic one — a local or `eas build --local` archive can be uploaded to the wrong studio's app record under the wrong Apple account, which is exactly what Guideline 4.2.6 compliance depends on getting right. EAS **cloud** builds prebuild fresh and are not exposed. Enforced by `whitelabel/native-identity.ts`, called from `app.config.ts` so it fires whatever command was typed; it stands aside for `prebuild` itself.

**Process guardrails:**
- **Read before touching:** checkout → `.claude/CHECKOUT.md`; cancellation → `.claude/CANCELLATION.md`; subscriptions/memberships → `.claude/SUBSCRIPTION_BILLING.md`; any UI → `DESIGN_BRIEF.md` + approved mocks. Stripe → current official Stripe RN docs (training data is stale).
- **Stop and ask Alicia (do NOT improvise):** any DB schema change; any new dibs-api endpoint; anything touching billing/Stripe logic; deleting files/features; anything affecting live bookings.
- **Definition of done for every task:** typecheck + lint + jest green; feature verified in iOS simulator AND Android emulator; domain logic has tests; screens match approved mocks; report states what was verified vs what needs manual eyes.
- **When a backend response doesn't match the zod schema:** the schema is probably wrong, not the backend — verify against the actual widget network traffic before "fixing" the backend.
- **When tests fail:** report the failure output honestly. Never mark a phase complete with failing checks.
- **Small PRs, one phase-item per PR**, each independently green.
- **Any dibs-api work follows the "dibs-api execution protocol" (end of §7):** worktree per item, branch from `main`, never push, never merge, migrations are files only; done = committed branch + STATUS.md entry.

---

## 10. Sequencing & Estimates

```
Prereqs (§0.5)     ── gate   staging URL + Firebase config + test user confirmed BEFORE P0 acceptance
Lane 5 (backend)   ████ →    7.8 endpoint + widget migration — starts in P0, must be widget-proven before P3 card path
P0 Foundation      ██ 2w     ← white-label loader + dev builds + eas init + full mock set + START STORE ENROLLMENT (week 1)
P1 Browse          ██ 1.5w   🎨
P2 Account/Billing █ 1w      🎨      Backend 7.3 auth hardening runs parallel from here
P3 Checkout        ███ 2w    🎨      card path LAST — if Lane 5 is late, the card path is the only blocked item
P4 Packages/Memb.  ██ 1.5w   🎨      pre-P4: membership-enrollment source trace
P5 Subscriptions   ███ 2w    🎨      pre-P5: recurring-checkout source trace + golden masters
P6 Flash/Stats     █ 1w      🎨      ← gated on locating/building milestones backend (7.6)
P7 Push            ██ 1.5w           Backend 7.1/7.2 (approval gate before migration); needs the EAS project from P0
P8 Polish          █ 1w              includes account-deletion UI (backend 7.7 built earlier)
P9 WL Factory      ██ 1.5w           ← store review cycles add calendar time
P10 QA/Launch      ██ 1.5w           TestFlight requires studios' ASC accounts to exist (enrolled in P0)
                   ≈ 17 focused build-weeks to pilot-studio launch
```

**Planning honesty:** these are build-effort weeks. The critical path runs through serial dependencies on Alicia — six design gates, three-plus schema/endpoint approvals (7.1, 7.6-if-built, 7.7), enrollment paperwork, and Apple review responses. Estimates assume same-day approvals; every approval day adds a day. Design gates front-load: run `DESIGN_BRIEF.md` and get the full mock set approved during P0-P1 so no build phase ever waits on design.

---

## 11. Pilot Studios (decided 2026-07-06)

> **⚠️ Reordered 2026-08-04 (§0.1).** v1 = **210 Carlsbad Village Yoga** and **88 Everyday
> Ballet** only — both classes-only, both existing Dibs-owned iOS listings to be updated in
> place. **263 Independent Training Spot is deferred past v1** (appointments-only + needs a new
> studio-owned listing). The table below still describes all three; treat 263's rows as v1.1
> planning, and note that deferring it leaves flash credits (P6) without a test studio.

Three pilots, chosen by Alicia. Between them they cover the entire feature surface — every phase's acceptance criteria should be verified against the pilot that exercises it. Live config pulled from `get-basic-config` on 2026-07-06:

| | **263 — Independent Training Spot** (IGTS Bryant Park) | **210 — Carlsbad Village Yoga** | **88 — Everyday Ballet** |
|---|---|---|---|
| Mode | **Appointments-only** (`showAppts`, no schedule) | **Classes-only** | **Classes-only** |
| Accent | `#1A92E4` — **CONFIRMED (Alicia, 2026-07-21), design with it as final.** It coincides with legacy Dibs Blue but is their color. Passes AA with white text | `#356280` (slate blue — passes AA with white text) | `#F986A5` (light pink — **fails AA with white text**; the `onAccent` auto-flip to dark text MUST work. This studio is the built-in contrast stress test) |
| Logo | `dibs-client-assets.s3…/igts_logo.png` | `dibs-email-assets.s3…/studio-logos/cvyoga.png` | `s3…/dibs-image-assets/eb_logo.png` |
| Hero | `…/independent-training-spot/itgs-buildwithus.png` (verify it's vertical/high-res enough for splash) | `…/studio-images/cvyoga_hero.png` | `…/studio-images/eb-hero.png` |
| Packages | No (`allowsPackages: false`) | Yes | Yes |
| Flash credits / dynamic pricing | **Yes** (`locationDynamicPricing: true`) — the P6 pilot | No | No |
| Credit load | Yes | No | No |
| Cancel windows | group 12h / private 168h / **subscription 744h (31 days)** | 12h across | 12h across |
| TZ | America/New_York | America/Los_Angeles | America/New_York |
| What it proves | Appointments, recurring subscriptions, upcoming payments (20th/25th cycle), flash credits, the appointments-only Home | Classic class studio: schedule, packs, class checkout | Same + the hostile-accent theming case |

**Studio 263 exceptions (READ before building against it — see `.claude/CLAUDE.md` "Studio Exceptions"):**
- Rental model: its "clients" are independent trainers booking studio time. Every 263 event has a **phantom instructor** (`trainerid` is auto-assigned and meaningless). The app must not render instructor names for 263 — handle via a per-studio display flag in white-label config (`showInstructor: false`), NOT a `=== 263` conditional in app code.
- Do not generalize any 263-driven pattern to the other pilots.
- App name **CONFIRMED (Alicia, 2026-07-21): "Independent Training Spot NYC"** — 29 chars, fits the 30-char App Store name limit. Set a shorter home-screen display name (`CFBundleDisplayName` / Android launcher label): iOS truncates around 12–15 chars under the icon. Default to "IGTS" unless Alicia overrides.
- 263 is also the studio with the richest existing billing-notification flow — its clients are the best testers for the P5 upcoming-payments view.

**P1 acceptance update:** the "classes-only and appointments-only both render correctly" criterion is now concrete — Home/nav must be verified against 263 (no Classes tab, appointments entry point) and 210/88 (no Appointments tab).

**Firebase (decided):** the app shares the widget's Firebase project (the one `FIREBASE_WIDGET_CREDENTIALS` validates). No isolation.

## 12. Remaining Open Items

1. ~~263's real accent color + app name~~ **RESOLVED 2026-07-21:** accent stays `#1A92E4`; App Store name "Independent Training Spot NYC"; home-screen display name "IGTS" (default — Alicia can override).
2. **Apple/Play enrollment for all three studios** — **start week 1 (P0 item 0)**, not week 4. Each needs an Apple Developer **organization** enrollment (DUNS required) and a Play Console account; Dibs added as Admin on both. 263's enrollment should be under the IGTS business entity. P10's TestFlight beta depends on these existing.
3. **Locate or rebuild the Loyalty Milestones backend** (§7 item 7.6) — check other machines/clones for unpushed work before P6; the shared CLAUDE.md description does not match any code on origin.
4. **Approval gates queued:** ~~7.8 payment-rail decision~~ **DECIDED 2026-07-21: Option B** (3DS-capable, pass-based endpoint — backend Lane 5; implementation review still required), 7.1 push-token schema (P7), 7.3 auth hardening rollout (early — see `dibs-api/docs/WIDGET_AUTH_HARDENING.md`), 7.7 account-deletion endpoint semantics (before P8), per-studio EAS project structure (P9).
5. **Backfill decision:** if/when milestones exist — the backfill (`BACKFILL=true`) should run on prod before P6 ships so long-time members see accurate earned milestones rather than getting a celebration blast (backfill pre-sets notified/celebrated — designed for exactly this).
6. **Staging environment post-cutover (§0.5-B):** Alicia names the staging URL the app targets and the executor verifies it responds — P0 acceptance is blocked until this exists.
7. **Staging test user (§0.5-D):** known login at a pilot studio with a pass, credit, and a saved sandbox card.
8. **Android toolchain on the build machine (§0.5-F):** confirm installed, or approve iOS-first with batched Android verification.
9. **Expo/EAS account (§0.5-G):** org + `eas init` in P0 — P7 device push testing depends on it.
10. **Privacy-policy hosting model (§6.3 item 6):** a per-studio URL is required for every store listing — decide once.

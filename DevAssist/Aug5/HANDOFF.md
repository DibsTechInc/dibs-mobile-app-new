# Handoff — dibs-mobile-app, 2026-08-05

**Read `MOBILE_MASTER_PLAN.md` (repo root) first — it is the governing plan.** Start with §0.1,
which is an override block recording direction changes that contradict older sections further
down. Then §9 (invariants) and the "Session protocol" in §4. This document tells you where that
plan currently stands and where to pick it up.

**`EXECUTION_STATE.md` (repo root) is the live status file.** Update it at the end of every
session. This handoff is a point-in-time snapshot; that file is the source of truth.

Branch: `feature/modernize-dibs-mobile-app`. 16 commits this session, all **local and unpushed** —
operator policy is that Alicia reviews in GitKraken and pushes. Never push, never merge.

Gate as of this writing: `npm run typecheck` clean · `npx jest` **443/443** · `npm run lint` 0
errors (2 pre-existing warnings in `src/domain/pricing`).

---

## 1. Start here

**First task: wire Home to real data (P1).** Everything under it is built and tested; Home is
currently rendering a hardcoded `SAMPLE` object.

1. `src/app/index.tsx` holds `SAMPLE: HomeData`. Replace it with a TanStack Query hook.
2. The API client, query keys, error normalization and the `get-basic-config` zod schema already
   exist (§3 below). What does NOT exist yet: schemas + hooks for `get-schedule`,
   `get-user-account`, `get-passes`, `get-credit`.
3. **The missing hero image Alicia noticed is this exact gap** — see §2.

Auth (P0 item 3) is the other unstarted P0 item and is a prerequisite for any authenticated
endpoint. If you need `get-user-account` for Home's "your next class", do auth first.

---

## 2. Why Home shows no photograph (asked 2026-08-05 — expected, not a bug)

`HomeScreen` renders `source={data?.heroUri ?? undefined}` and the sample data sets
`heroUri: null`, so you see the `surface` wash instead of a photo. Correct behaviour for the
current wiring.

**The design intent:** Home's hero comes from `heroUrl` on `get-basic-config` — a REMOTE url — so
a studio can change their photograph without a store release. The bundled
`whitelabel/studios/<slug>/assets/hero.jpg` is used for the **splash** (build-time, via
`app.config.ts`), not for Home.

⚠️ **Consequence for design review:** until this is wired, nobody can evaluate the hero settle
animation, the drift, or the scrim — they are animating an empty rectangle. There is an open
design question (§6) that *cannot be answered* until a real photo renders. Wiring this early
unblocks a decision, not just a feature.

Note the local vertical heroes and the live `heroUrl` values are DIFFERENT images: the ones on S3
are the old landscape web banners. Whether `get-basic-config` should start returning the new
vertical assets is an open question for Alicia — do not assume the remote URL is the right photo.

---

## 3. What exists (with paths)

### Foundation — P0

| Area | Status | Where |
|---|---|---|
| White-label config system | **done** | `whitelabel/` — zod `schema.ts`, Node `load.ts`, 3 studios + `_template`, 57 validation tests |
| Per-studio Expo config | **done** | `app.config.ts` (replaced `app.json`, which is deleted) |
| Runtime studio identity | **done** | `src/config/studio.ts` — the ONLY sanctioned way to learn which studio the build is |
| API client | **core done** | `src/api/client.ts`, `errors.ts`, `keys.ts`, `schemas/basic-config.ts`, 40 tests |
| Time semantics | **done** | `src/domain/time/studio-now.ts` + `docs/time-semantics.md`, 29 tests |
| Theme (2-layer) | **done** | `src/theme/` — `tokens.ts` (DNA), `color.ts` (accent derivation), `theme.ts`, `ThemeProvider.tsx`, 37 tests |
| Components | **done** | `src/components/` — Text, Button, Card, Chip/StatusTag, Input, Sheet, Skeleton/SkeletonList, EmptyState/ErrorState, `motion.tsx` |
| Home screen | **built, unwired** | `src/features/home/HomeScreen.tsx` + `types.ts`; route `src/app/index.tsx` |
| Component gallery | **done** | route `/dev-shell` (`src/app/dev-shell.tsx`) — every component in one scroll |
| CI | **done** | `.github/workflows/ci.yml` — typecheck, lint, jest, per-studio config resolution, 4 grep guardrails |
| EAS projects | **done** | `@dibs-tech/carlsbad-village-yoga`, `@dibs-tech/everyday-ballet`; ids in each `studio.json`; `eas.json` has development/preview/production |
| Design mockups | **partial** | `design/mockups/home-options.html`, `booking-and-account.html` |
| Pricing domain | **done (pre-existing)** | `src/domain/pricing/`, 280 golden-master tests |

### Not started

- **Auth** (P0 item 3) — `src/lib/firebase.ts`, authStore, sign-in/up/reset, token injection into
  the API client, 401 handling. The client already accepts a `getIdToken` callback; nothing
  provides one yet.
- **P1 browse** — schedule screen, class detail, appointment types (appointments are OUT of v1).
- **P2 account/billing**, **P3 checkout**, **P4 packages/memberships**.
- **Remaining mockups** — packages storefront, membership detail, auth, system-states reference.
- **Backend Lane 5** (`7.8` endpoint + widget migration) — not started, blocks P3's card path.

---

## 4. Direction changes — these override older parts of the plan

All four are recorded in `MOBILE_MASTER_PLAN.md` §0.1. They contradict sections written weeks
earlier; §0.1 wins.

1. **Rescue-first.** 210 Carlsbad Village Yoga and 88 Everyday Ballet ship as **version updates
   to existing Dibs-owned iOS apps**, not new listings. Bundle ids are pinned and verified against
   the public App Store: `com.ondibs.carlsbadvillageyogaapp` (live v1.8) and
   `com.ondibs.everydayballetapp` (live v1.6). A test asserts these strings — if one changes, the
   rebuild stops being an update and strands the existing installs. Apple enrollment is off the
   critical path.
2. **v1 is classes-only.** Appointments deferred entirely — availability slots, service providers,
   `complete-appointment-booking`, and the recurring-subscription payNow/hold split are all out.
   P5 is deferred in full.
3. **v1 is iOS-only.** Nothing has ever shipped to Google Play. `store.platforms: ['ios']`;
   release validation only demands Android identifiers when a studio targets Android. Android
   remains a *development* target.
4. **Studio 263 is out of v1** (appointments-only AND needs a new studio-owned listing), and
   **flash credits are deferred** with it — 263 was their only test studio.

---

## 5. Gotchas

### From this session — build environment (all cost real time)

- **`react-native-worklets@0.8.3` was installed WITHOUT its podspec.** Sat corrupt in
  `node_modules` since 2026-06-10; no `RNWorklets.podspec`, no README. Pod install failed with
  *"Unable to find a specification for RNWorklets"*. Fix was `rm -rf node_modules/react-native-worklets
  && npm install react-native-worklets@0.8.3`. **If pods fail on a package, check the package is
  actually complete before debugging the Podfile.** This would have broken the first EAS build too.
- **`xcodebuild ... -showdestinations` is the diagnostic**, not the build error. A build failure
  saying *"iOS 26.2 is not installed"* alongside an unrelated destination id is misleading — ask
  for destinations directly and you learn whether ANY are eligible. Here: zero, because Xcode 26.2
  ships the iOS 26.2 SDK but the *runtime* is a separate `xcodebuild -downloadPlatform iOS`.
- **Expo Go cannot run this app.** Native modules (Stripe, notifications, calendar, local auth,
  Reanimated worklets) killed it at P0. `expo start` will offer Expo Go and it is a dead end.
- **Two concurrent `expo` processes corrupt `~/.expo/codesigning/<projectId>/`** with an ENOENT on
  an atomic rename. Harmless and self-healing, but kill strays before starting a new run.
- **`ios/` and `android/` are gitignored** (continuous native generation). They are build
  artifacts. If native config changes, delete and regenerate — hand edits are silently overwritten.
- **`npx expo install --check` reports ~10 drifted packages**, including `expo` itself
  (56.0.9 vs ~56.0.18). `--fix` was NOT run — it moves ten dependencies at once and should be its
  own isolated, revertible commit. Flagged to Alicia, undecided.
- **`eas init` cannot write into a dynamic `app.config.ts`.** It creates the project, prints the
  id, then exits non-zero. The id goes by hand into that studio's `studio.json` under `eas.projectId`.

### From this session — data and contracts

- **`MOBILE_MASTER_PLAN` §4's P1 endpoint table lists DATABASE column names, not API fields.**
  The wire returns `colorLogo`, `heroUrl`, `timezone` — not `color_logo`, `hero_url`, `mainTZ`.
  The accent arrives **without** a leading `#`. Capture a real response before writing a schema;
  `src/api/schemas/basic-config.ts` documents the curl command.
- **No remote staging backend exists.** Both Heroku hosts are dead (503). Dev targets **local
  dibs-api on `:3001`**. See `docs/environments.md`. A Railway staging service is planned — Alicia
  will supply the URL.
- **Every path on `dibsonline.com` and `ondibs.com` returns HTTP 200 with the widget SPA shell.**
  Nothing 404s. A status-code check cannot tell a live page from a missing one — which is why
  `legal.privacyPolicyLive` is a separate hand-flipped boolean in the release gate.
- **Flash-credit `expires_at` is a REAL INSTANT**, verified against the backend writer. Its
  countdown uses `Date.now()`, NOT `studioNow()` — the opposite of event times.
- **The plan's claim that 263's `#1A92E4` "passes AA with white text" is wrong** — it measures
  3.35:1. Pinned in `src/theme/__tests__/color.test.ts`.
- **`get-basic-config` is unauthenticated and returns the studio's `stripeId` / `stripeIdTest`.**
  Belongs on the backend 7.3 auth-hardening list.

### From the widget — read these before touching money or auth

These are hard-won lessons in the shared `.claude/CLAUDE.md`. They are not optional reading; each
one describes a production outage.

- **`passes.totalUses === null` means UNLIMITED.** In SQL, `NULL > n` is NULL, so a bare
  `totalUses > usesCount` silently drops every unlimited pass. **In JS it is worse:**
  `null - usesCount` returns a NEGATIVE NUMBER, so an active membership reads as over-spent. This
  trap has now bitten **six** separate read surfaces. Never do the arithmetic inline.
- **TWO Stripe payment-method id prefixes are chargeable: `pm_` AND `card_`.** A `pm_`-only check
  shipped in the widget and caused a two-day outage — ~35,000 clients hold legacy `card_` ids.
- **Presence in a saved-card list is NOT evidence a charge will succeed.** Never rehydrate a card
  list from storage. "Could not ask Stripe" and "no cards on file" are DIFFERENT states and
  collapsing them strands a client with no way to pay.
- **"Logged in" means a LIVE Firebase session, never a persisted userid.** On a shared device a
  persisted userid is the previous client's identity. The widget rendered someone else's saved
  card because of this.
- **`is_placeholder` passes never appear in any list and are never selectable or returnable.**
- **Server totals are truth.** Client pricing is a display estimate. If they disagree, show the
  server's number and log the divergence.
- **The app NEVER creates PaymentIntents.** Backend creates them on the studio's connected
  account; the app confirms with the client secret.
- **`source: 'dibs'` on every booking payload.** Never `'zf'` (dead legacy value).
- **`attendees.attendeeID` ↔ `dibs_transactions.id`** requires a STRING→INT cast, and is a partner
  reservation id (not a transaction id) when `source` is `'cp'`/`'gp'`.
- **No dead ends.** Every booking surface must always offer a reachable next action. Enumerate a
  gating state variable's values — including its INITIAL value — and show each reaches an action.
- **Two owners is a bug waiting.** If a component can be rendered by more than one parent, the
  "who renders it" question gets ONE shared helper, not two conditions that can both decline.

---

## 6. Open items needing Alicia

1. **Home hero photo source** (§2) — the live `heroUrl` is the old landscape banner; the good
   vertical assets are bundled locally. Decide which Home should use.
2. **The scrim on Everyday Ballet.** Its hero is high-key; darkening it may read as a mistake.
   The fix, if so, is to put the greeting BELOW the photo for that studio, not to deepen the
   scrim. **Cannot be judged until §2 is wired.**
3. **`expo install --fix`** for the ~10 drifted packages — yes/no.
4. **Railway staging URL** — promised, not yet supplied.
5. **Staging test user** (§0.5-D) — still open.
6. **Apple credentials** via `eas credentials` — fills `appleTeamId` and `merchantId`
   automatically; do not hand-write them.
7. **The privacy policy page does not exist.** `https://dibsonline.com/apple/privacy-policy` is
   recorded but serves the widget shell.
8. **Carlsbad's app icon** is derived from a 774px source, upscaled 1.61×. Ships fine; a native
   1024² badge export from the `.eps` would sharpen the App Store listing. Option A vs B preview:
   `whitelabel/studios/carlsbad-village-yoga/icon-options-preview.html`.

Both v1 studios currently report exactly three things blocking a release build:
`ios.appleTeamId`, `ios.merchantId`, `legal.privacyPolicyLive`.

---

## 7. Running it

```bash
# Full native build (needed after any app.config.ts or native dependency change)
STUDIO_SLUG=carlsbad-village-yoga npx expo run:ios --device "iPhone 17 Pro"

# Fast iteration once the dev build is installed — press i
STUDIO_SLUG=carlsbad-village-yoga npx expo start

# The other studio is a separate app (different bundle id); both can coexist on the simulator
STUDIO_SLUG=everyday-ballet npx expo run:ios --device "iPhone 17 Pro"

# Gate — all three must pass before reporting anything complete
npm run typecheck && npx jest && npm run lint
```

`STUDIO_SLUG` matters for `expo start` too — the dev client reads the config from Metro at
runtime, and omitting it silently gives you the default (carlsbad-village-yoga).

Home is at `/`. The component gallery is at `/dev-shell`.

---

## 8. Working agreements

- **One phase-item per commit, committed locally, never pushed.**
- **Verify, do not assume.** Endpoints were re-grepped against live `dibs-api` routers; bundle ids
  came from the public App Store; the flash-credit time frame came from reading the backend
  writer. Every claim in this repo's docs should be traceable to something someone ran.
- **Read before touching:** checkout → `.claude/CHECKOUT.md`; cancellation → `.claude/CANCELLATION.md`;
  subscriptions/memberships → `.claude/SUBSCRIPTION_BILLING.md`; any UI → `DESIGN_BRIEF.md` plus
  the approved mockups. Stripe → current official docs, never memory.
- **Stop and ask** on: DB schema changes, new dibs-api endpoints, anything touching billing or
  Stripe, deleting files or features, anything affecting live bookings.
- **Report honestly.** If tests fail, say so with output. If something is unverified, list it
  under "needs Alicia's eyes" rather than claiming it passes.

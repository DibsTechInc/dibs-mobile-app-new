# Execution State — dibs-mobile-app white-label build

> Single source of truth for app-side progress. See `MOBILE_MASTER_PLAN.md` § "Session protocol."
> Backend (dibs-api) items are tracked in `backend-workstream/STATUS.md`, not here.
> The executor updates this file at the end of EVERY session. Statuses: `done` / `in-progress` / `blocked-on-Alicia (reason)` / `not-started`.

**Last updated:** 2026-08-06 (session 2 close)
**Gate status:** `npm run typecheck` clean · `npx jest` 523/523 · `npm run lint` 0 errors (2 pre-existing warnings) · all 4 CI grep guardrails clean
**Next up:** P1 continues — the schedule screen and class detail. Both of Home's tap targets
(`onOpenClass`, `onSeeFullSchedule`) are deliberately inert until they exist.

## Session 2 (2026-08-06) — what landed

Four commits, local and unpushed.

1. **Home reads live data.** `get-basic-config` + `get-schedule`, both public, so a signed-out
   client sees a fully populated screen. **This discharges the §2 hero blocker in the previous
   handoff** — a real photograph now renders, so the settle animation, the drift and the scrim
   can finally be judged. See "Needs Alicia's eyes" below.
2. **Auth core** (P0 item 3, first half) — Firebase against `dibs-studio-clients`, session store,
   the Dibs-identity lookup, token injection, 401 → sign-out.
3. **Auth screens** — sign in / create account / reset, one screen with three modes, reachable
   from a labelled action on Home's hero. Mockup at `design/mockups/auth.html`.
4. **Your next class** on Home, from `get-upcoming-appts`.

## ⚠️ Direction changes this session (see `MOBILE_MASTER_PLAN.md` §0.1)

1. **Rescue-first.** 210 + 88 ship as **version updates to their existing Dibs-owned iOS apps**,
   not new listings. Store enrollment leaves the critical path.
2. **v1 is classes-only.** Appointments deferred; **263 leaves v1 entirely** (appointments-only
   AND needs a new studio-owned listing).
3. **v1 is iOS-only.** Nothing has ever shipped to Google Play; `store.platforms: ['ios']`.
   Android stays a development target, just not a submission target.
4. **Flash credits deferred** — 263 was their only test studio.

## Prerequisites (§0.5)

| # | Item | Status |
|---|---|---|
| A | Canonical prod API URL = `https://api.dibsonline.com` | **done** — probed live 2026-08-04, returns real config |
| B | Staging URL | **resolved with a finding.** No remote staging exists — both Heroku hosts are dead (503). Dev targets **local dibs-api :3001**. `docs/environments.md`. **Still needs Alicia** for off-laptop device testing (P7/P10) |
| C | Firebase client config | **done** — lifted into gitignored `.env`, names in `.env.example`. Project `dibs-studio-clients` |
| D | Staging test user + studio state | **blocked-on-Alicia.** Shape has changed: the local DB is a prod restore, so real users exist, but Firebase passwords are live and `stripeid_test` may be empty. Name one test login |
| E | Sandbox Stripe key path | **done** — local returns `pk_test_…`, prod returns `pk_live_…`. All pilots have `stripe_account_id_test` |
| F | Local toolchain | **iOS done** (Xcode 26.2, CocoaPods 1.16.2). **Android absent** — no SDK, no `ANDROID_HOME`, no Java. **No longer blocking:** v1 is iOS-only, so Android verification is deferred with the platform |
| G | Expo/EAS org + `eas init` | **done 2026-08-04.** Account: **`dibs-tech`** (the Organization, chosen over the personal account). Projects created — `@dibs-tech/carlsbad-village-yoga` (`3de21050-…`) and `@dibs-tech/everyday-ballet` (`10359ad8-…`), one per studio. Ids recorded in each studio.json; `eas.json` has development/preview/production profiles |
| H | Sentry DSN | not needed until P8 |

## P0 — Foundation

| Item | Status |
|---|---|
| 0. Store enrollment kickoff | **superseded** for 210/88 by §0.1-A. Replaced by two questions for Alicia (ASC account access; did Android ever ship). Backend Lane 5 kickoff — **not-started, still needed before P3's card path** |
| 1. Deps + `app.config.ts` + dev builds + `eas init` | **done.** Deps installed, `app.json` → `app.config.ts` per studio, `eas init` complete for both v1 studios, `eas.json` profiles written, and the **first iOS dev build succeeded on device 2026-08-05** (see the build gotchas in the handoff: a corrupt `react-native-worklets` install and a missing iOS 26.2 runtime both had to be cleared) |
| 2. API client + zod schemas + endpoint re-verify | **done for the core.** Client, error normalization, query keys, 4 endpoint modules (`get-basic-config`, `get-schedule`, `get-user-account` + `create-new-dibs-user`, `get-upcoming-appts`) with schemas captured from live responses, and the wired singleton at `src/api/index.ts`. Endpoint re-verify: all 26 P1/P2 routes confirmed present. **Remaining:** P2's money endpoints (`get-passes`, `get-credit`, `stripe/get-all-payments`) |
| 3. Auth wiring | **done.** `src/lib/firebase.ts` (project-id assertion + AsyncStorage persistence), `sessionStore` (live session only, never persisted), `AuthProvider` (identity resolution + 401 → sign-out), `useAuthActions` (sign in / sign up / reset / complete-setup), and the three-mode `AuthScreen` at `/sign-in`. **Not yet done:** biometric re-entry (P8, as planned) and the booking-time auth gate (there is nothing to gate until P3) |
| 4. Theme system | **done** — `tokens.ts` (Layer 1 DNA: type scale, spacing, radii, motion), `theme.ts` (DNA + studio merge), `ThemeProvider` with bundled Fraunces + DM Sans, and 8 components: Text, Button, Card, Chip/StatusTag, Input, Sheet, Skeleton/SkeletonList, EmptyState/ErrorState. 37 theme tests |
| 5. White-label config loader | **done** — schema, loader, 3 studios + template, 42 validation tests |
| 6. Error/loading grammar | **done** — Skeleton, EmptyState, ErrorState + a `BookingUnavailableNotice` for the degraded studio-lifecycle state |
| 7. CI | **done** — typecheck + lint + jest + per-studio config resolution + 4 grep guardrails |
| 8. Full design mock set | **in-progress** — Home options reviewed and **A chosen + built**. Booking walkthrough + Account reviewed and approved ("all looks good"). **Auth added 2026-08-06 and built** (`design/mockups/auth.html`) — built alongside the mock rather than after approval, per P0 item 3's "functional, unstyled OK until design gate"; it needs your eyes but is not blocking. Remaining mocks: packages storefront, membership detail, system-states reference |

## Bonus (not a numbered P0 item)

| Item | Status |
|---|---|
| §3.7 `studioNow()` + `docs/time-semantics.md` | **done** — 29 tests incl. DST round-trips. Discharged the P6 flash-credit frame gate: `expires_at` is a **real instant**, so its countdown uses `Date.now()`, not `studioNow()` |

## Needs Alicia's eyes (added 2026-08-06)

Nothing below was verified on a device this session — no simulator run happened, so every visual
claim is "it compiles and the logic is tested", not "I saw it".

1. **The hero photo question is now answerable, and my recommendation is to change it.**
   Home renders `heroUrl` from `get-basic-config`, which for both studios is the old **landscape
   web banner** (`cvyoga_hero.png`, `eb-hero.png`) — cropped to a 360px-tall portrait frame, a
   landscape composition loses its subject. The good **vertical** assets are bundled at
   `whitelabel/studios/<slug>/assets/hero.jpg` and are currently used only for the splash.
   Three options: (a) update the S3 `heroUrl` to the vertical asset — keeps the studio-editable
   promise and needs no code; (b) bundle-first with the remote as fallback — better crops today,
   but a studio can no longer change their photo without a release; (c) leave as-is.
   **(a) is the right answer** if you can replace the S3 files; it is a data change, not a code one.
2. **The scrim on Everyday Ballet** (carried from the last handoff, now judgeable). Its dancer
   photo is high-key; darkening may read as a smudge. The fix, if so, is the greeting BELOW the
   photo for that studio — not a deeper scrim. Same question applies to the auth screen.
3. **`design/mockups/auth.html`** — the auth composition, both studios plus the hostile-accent
   stress test. Built already (P0 item 3 sanctions functional-before-gate), so this is a review,
   not a block.
4. **Home now falls back to "Coming up" when the studio's day is over.** The approved Option A
   mock has an empty state there whose only action is a screen that does not exist yet. Tell me
   if you would rather keep the empty state once the schedule screen lands.

## Open questions for Alicia

1. ~~App Store Connect access~~ **confirmed 2026-08-04.**
2. ~~Google Play~~ **resolved:** never submitted; v1 is iOS-only.
3. ~~Android toolchain~~ **resolved:** deferred with the platform.
4. ~~210's app icon~~ **shipped 2026-08-04** from the supplied 774² square: badge cropped out,
   flattened to opaque, upscaled 1.61× to 1024². **Confirm Option B** (badge only) over Option A
   (full lockup) — preview at `whitelabel/studios/carlsbad-village-yoga/icon-options-preview.html`.
   *Optional polish:* a native 1024² badge export from the `.eps` would remove the slight
   softness visible only on the App Store listing.
5. ~~210's hero photo~~ **shipped 2026-08-04** — `new-background-image.png`, 1800×3194 vertical,
   resized to 1440×2555 JPEG.
6. ~~App/short names~~ **confirmed;** "Everyday Ballet" may truncate under the icon.
7. ~~Flash credits~~ **deferred.**
8. ~~Which EAS account~~ **resolved: `dibs-tech`.** Both projects created.
9. **Off-laptop backend** for device testing / TestFlight: Railway staging, or LAN-only for now?
10. **Staging test user** (§0.5-D) — still open.
11. **Apple credentials for EAS Submit** — configured per project via `eas credentials`, using
    either an App Store Connect API key (recommended, non-interactive) or an Apple ID. Needed
    before the first real build, not before development builds. `appleTeamId` and `merchantId`
    fill themselves in from that step; do not hand-write them.
12. **The privacy policy page does not exist yet.** `https://dibsonline.com/apple/privacy-policy`
    is recorded in all three configs, but it currently returns **HTTP 200 with the widget SPA
    shell** — as does every other path on `dibsonline.com` and `ondibs.com`, because of the
    catch-all rewrite. Nothing 404s, so a status-code check cannot detect this. The release gate
    therefore requires `legal.privacyPolicyLive: true`, flipped by hand after someone loads the
    URL and sees a policy.

## Design decisions made

**Home composition: Option A, "The Cover"** — chosen by Alicia 2026-08-05, with a request that
the app feel dynamic on open. Built at `src/features/home/HomeScreen.tsx` and live at `/`.
Motion: hero settles 1.08→1.0 over 900ms while fading in, content blocks stagger up at 70ms
intervals, then the hero drifts 1.0↔1.045 on a 14s cycle. All of it disabled under the OS
reduce-motion setting. Primitives in `src/components/motion.tsx` (Reanimated).

~~Background colour~~ **settled 2026-08-04:** `#FFFFFF`. The `dibs-brand` skill states the cream
`#FDFBF7` page background is retired platform-wide, which overrides `DESIGN_BRIEF.md`'s older
"never pure white" line. Still a single token in `src/theme/tokens.ts` if it ever changes.

## Two things worth knowing that were not asked for

- **The plan's claim that 263's `#1A92E4` "passes AA with white text" is wrong** — it measures
  3.35:1, which clears large-text and UI-component contrast but not the 4.5:1 body-text bar. The
  derivation guard handles it; the number is pinned in `src/theme/__tests__/color.test.ts`.
- **`get-basic-config` is unauthenticated and returns the studio's `stripeId` / `stripeIdTest`.**
  Not directly exploitable without keys, but it belongs on the 7.3 auth-hardening list.

## Design mock approvals (P0 item 8)

| Screen | 210 variant | 88 variant | Stress variant | Status |
|---|---|---|---|---|
| (populate from DESIGN_BRIEF.md when mocks are generated — note the 263 variant is dropped from v1) | | | | not-started |

## Blockers log

- 2026-07-26 · §0.5-B: staging URL unconfirmed → **resolved 2026-08-04**: no remote staging exists; local API is the dev target. Residual decision on off-laptop testing remains.
- 2026-07-26 · §0.5-D: staging test user — still needs Alicia.
- 2026-07-26 · §0.5-G: Expo/EAS — **logged in 2026-08-04**; only the account choice remains.
- 2026-08-04 · §0.5-F: Android toolchain absent — **closed**, v1 is iOS-only.
- 2026-08-04 · Brand assets: **both v1 studios resolved.** 88 has a native 1024² icon, a vertical hero and a designed splash. 210 now has a vertical hero and an icon derived from its 774² square (badge cropped, flattened, upscaled 1.61×). No studio ships the placeholder icon any more. Only 263 remains in the gap registry, and it is deferred.
- 2026-08-04 · Backend Lane 5 (7.8 endpoint + widget migration) not started; blocks P3's card path.
- 2026-08-06 · §0.5-D staging test user **now actually blocking**: auth is built and cannot be
  exercised end-to-end without a login. The local DB is a prod restore, so a real client's email
  plus their real Firebase password would work — name one, or approve creating a test account
  through the app's own sign-up (which writes a real `dibs_user` row and a real Firebase
  credential in `dibs-studio-clients`, since Firebase is hosted and shared with the widget).

## Backend findings worth recording (2026-08-06, verified by reading the source)

None of these are the app's to fix; all were hit while wiring against live endpoints.

- **`POST /get-upcoming-appts` is unauthenticated and takes `userid` from the body** — anyone can
  read anyone's bookings. Belongs on the 7.3 auth-hardening list. The app already sends its token.
- **`services/shared/add-data-to-appts.js` silently drops a booking** whose `attendees.attendeeID`
  does not parse as an integer (`parseInt` → NaN → `return null`). The same synthetic-id problem
  that cost Revenue by Class 47% of studio 263's June rows. A client's booking can genuinely be
  missing from their own list.
- **The same file reads `classinfo.instructor.firstname` with no null guard**, so an event whose
  instructor row is missing rejects inside a `.then()`, the route's catch does `return err` without
  ever calling `res.json`, and the request hangs until it times out.
- **`get-schedule` and `get-user-account` answer HTTP 200 with an error body** on failure (the
  service catch returns the error and the controller sends it). Every endpoint wrapper in
  `src/api/endpoints/` therefore validates the shape and raises, or an outage renders as "no
  classes today".
- **`get-user-account` looks the client up with `where: { email }` — case sensitive**, unlike
  `middleware/widget-auth.js`, which lowercases. A mixed-case Firebase email whose `dibs_user` row
  is lowercased (or vice versa) authenticates fine and then reports `hasAccount: false`.
- **`create-new-dibs-user` never reads the `newpwd` the widget sends it.** The mobile app does not
  send a password.

# Execution State — dibs-mobile-app white-label build

> Single source of truth for app-side progress. See `MOBILE_MASTER_PLAN.md` § "Session protocol."
> Backend (dibs-api) items are tracked in `backend-workstream/STATUS.md`, not here.
> The executor updates this file at the end of EVERY session. Statuses: `done` / `in-progress` / `blocked-on-Alicia (reason)` / `not-started`.

**Last updated:** 2026-08-04 (session 1 — first build session, + Alicia's answers)
**Gate status:** `npm run typecheck` clean · `npx jest` 446/446 · `npm run lint` 0 errors (2 pre-existing warnings)
**Next up:** P0 item 3 (auth wiring) → P0 item 8 (design mocks) → first `npx expo run:ios` dev build

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
| 1. Deps + `app.config.ts` + dev builds + `eas init` | **done except the first dev build.** Deps installed, `app.json` → `app.config.ts` per studio, `eas init` complete for both v1 studios, `eas.json` profiles written. **Not done:** first `npx expo run:ios` — no screens exist yet to look at, so it lands with the theme work |
| 2. API client + zod schemas + endpoint re-verify | **done for the core.** Client, error normalization, query keys, `get-basic-config` schema, 40 tests. Endpoint re-verify: all 26 P1/P2 routes confirmed present. **Remaining:** schemas for the other P1/P2 endpoints, and the TanStack hooks (need auth first) |
| 3. Auth wiring | **not-started** |
| 4. Theme system | **done** — `tokens.ts` (Layer 1 DNA: type scale, spacing, radii, motion), `theme.ts` (DNA + studio merge), `ThemeProvider` with bundled Fraunces + DM Sans, and 8 components: Text, Button, Card, Chip/StatusTag, Input, Sheet, Skeleton/SkeletonList, EmptyState/ErrorState. 37 theme tests |
| 5. White-label config loader | **done** — schema, loader, 3 studios + template, 42 validation tests |
| 6. Error/loading grammar | **done** — Skeleton, EmptyState, ErrorState + a `BookingUnavailableNotice` for the degraded studio-lifecycle state |
| 7. CI | **done** — typecheck + lint + jest + per-studio config resolution + 4 grep guardrails |
| 8. Full design mock set | **not-started** — the largest remaining P0 item, and a design gate. Scope shrank: 2 studios (210, 88), classes only, no flash-credit surface |

## Bonus (not a numbered P0 item)

| Item | Status |
|---|---|
| §3.7 `studioNow()` + `docs/time-semantics.md` | **done** — 29 tests incl. DST round-trips. Discharged the P6 flash-credit frame gate: `expires_at` is a **real instant**, so its countdown uses `Date.now()`, not `studioNow()` |

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

## Open design question

**Background colour: `#FFFFFF` or the warm `#FDFBF7`?** `DESIGN_BRIEF.md` (2026-07-21) specifies
the warm off-white and says "never pure white"; shared `CLAUDE.md` records Alicia retiring
`#FDFBF7` for `#FFFFFF` the next day, platform-wide. Implemented as `#FFFFFF` (the newer
decision) but isolated in ONE token at the top of `src/theme/tokens.ts` — flipping that line
changes every screen. Worth settling before the mock set is generated, since the brief's
argument (warm ground reads better under a full-bleed hero photo) is a good one for this surface
specifically.

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

# Execution State — dibs-mobile-app white-label build

> Single source of truth for app-side progress. See `MOBILE_MASTER_PLAN.md` § "Session protocol."
> Backend (dibs-api) items are tracked in `backend-workstream/STATUS.md`, not here.
> The executor updates this file at the end of EVERY session. Statuses: `done` / `in-progress` / `blocked-on-Alicia (reason)` / `not-started`.

**Last updated:** 2026-08-06 (session 3 close — handoff at `DevAssist/Aug6/HANDOFF-session3.md`)
**Gate status:** `npm run typecheck` clean · `npx jest` **635/635** · `npm run lint` 0 errors (2 pre-existing warnings) · all 4 CI grep guardrails clean · iOS bundle exports for both v1 studios
**Next up:** **run it.** P2 is code-complete. What it has never had is a native rebuild and a
signed-in session, and both are now unblocked — Alicia supplied the staging backend, the test
login `alicia.ulin@gmail.com`, and its password. Point at **studio 88**, where that client holds
two live passes:

```bash
EXPO_PUBLIC_API_URL=https://dibs-api-staging-production.up.railway.app/api/v2 \
  STUDIO_SLUG=everyday-ballet npx expo run:ios --device "iPhone 17 Pro"
```

After that: P3 checkout (classes only, card path last, per §0.1-B and the build order in §4).

✅ **The two `get-passes` defects reported last session are FIXED** in dibs-api (`90dc7fcc` on
`staging`): unlimited passes come back and placeholder ones do not. Verified by reading the
source and calling the local endpoint.

✅ **§0.5-B is CLOSED and the data half of §0.5-D with it (2026-08-06, Alicia).** A remote staging
backend does exist — **`https://dibs-api-staging-production.up.railway.app`** — the 2026-08-04
probe only tried the dead Heroku hosts and concluded wrongly. It holds **87,222 `passes` and
594,231 `dibs_transactions`** (local restore: 0 and 0), runs **sandbox** Stripe consistently, and
its deployed build carries the `get-passes` fix. Test client `alicia.ulin@gmail.com` = **userid
2502**, with two live passes at **studio 88** and none at 210 — so point dev at 88. Full detail and
the run command: `docs/environments.md`. It is HTTPS, so it also answers open question 9
(off-laptop device testing).

✅ **§0.5-D is CLOSED.** Test login `alicia.ulin@gmail.com` (userid 2502), password supplied by
Alicia 2026-08-06 and held out of this repo. Use **studio 88** — two live passes there, none at 210.

⚠️ **No screen has yet been rendered by a signed-in client.** Every endpoint was exercised
directly with curl and its real response validated against the app's schemas end to end — which
caught two bugs (below) — but the app itself has not been run this session. **A native rebuild is
owed** (`npx expo run:ios`): the splash image changed in `app.config.ts` two sessions ago, and
`@stripe/stripe-react-native` is now mounted, so the PaymentSheet needs native code that a Metro
reload cannot deliver. Restart Metro too — `metro.config.js` changed.

⚠️ **`POST /update-profile` is being hardened by another agent** (Alicia, 2026-08-06) — see
finding 1 below. Do not touch that route from this workstream; the app already sends its token, so
it keeps working the moment an auth mount lands.

## Session 3 (2026-08-06) — what landed

Four commits, local and unpushed. All of P2 except the card write paths.

1. **The three wallet reads** — `get-passes`, `get-credit`, `stripe/get-all-payments`, each
   validating that what arrived is the success shape. All three answer HTTP 200 on failure and
   `get-credit` answers with a bare number, so a caller trusting the status code renders an
   outage as an empty wallet.
2. **`domain/payments`** — the widget's card merge, ported. A saved card exists twice in Stripe
   (platform + connected customer) and the client has one card. `card_` ids are chargeable
   alongside `pm_`, with a test that says so.
3. **`domain/wallet`** — every section carries a status instead of inferring one from its own
   length, so "you have none" and "we could not ask" never look alike.
4. **Account hub + wallet screens**, to the approved mock, at `/account` and `/account/wallet`.
   Home's account action now goes to the account rather than back to sign-in.
5. **Profile editing** at `/account/profile` — name and mobile number.

## P2 — Account core & billing info

| Item | Status |
|---|---|
| Account hub | **done, unverified on device** — `/account` |
| Wallet: passes | **done, unverified.** Cannot be verified locally at all: zero `passes` rows |
| Wallet: credit | **done, unverified on device.** Endpoint exercised live (userid 10 @ 210 → `900`) |
| Wallet: saved cards | **done, unverified on device.** Endpoint exercised live; the merge is unit-tested against the five-copies-of-4242 case the sandbox actually holds |
| Profile edit | **done, unverified.** Name + phone. Email is deliberately NOT editable — see the findings below |
| Add a card (PaymentSheet) | **done, needs a device.** Approved by Alicia 2026-08-06. `create-setup-intent` verified against staging returning a real `seti_…`, **with the `stripeid` columns confirmed untouched** because the existing customer id was passed. The PaymentSheet itself is the one step curl cannot reach — it needs a native rebuild |
| Remove card / set default | **done.** `set-default-card` exercised live on staging (success AND the `invalid_payment_method_id` refusal). `remove-card` is wired and unit-tested but **deliberately not fired against staging** — it detaches from both Stripe accounts and there was no reason to destroy a real test card to prove a request shape |
| Communication preferences | **not-started.** `/user/update-communication-preferences` exists; no design for it yet, and P8's notification work is its natural home |
| Delete account | **not-started — RELEASE GATE.** Apple requires it for any app with sign-up. Backend item 7.7. Not stubbed, because a delete-account row that does not delete the account is the worst version of it |
| Tab bar | **still not-started, still deliberate.** Account now exists, so three of the mock's four tabs do — but adding one restructures Home's approved app-open sequence (the panel's travel is computed from the full screen height). Worth doing once Packages lands in P4, as one change rather than two |

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
5. **The app-open sequence** — the photograph holds the WHOLE screen, then the white panel
   travels up from off-screen and lands at the hero band. Timing **B, chosen by Alicia**: 620ms
   hold, 560ms rise, chrome fading in 140ms after the panel starts. Once per launch, not per
   mount. Preview: `design/mockups/home-entrance.html`.
6. **P1 browse — schedule screen + class detail**, both to the approved
   `booking-and-account.html` mock. The cancellation window is now stated as a moment
   ("Free to cancel until 6:00 AM tomorrow") from the studio's own configured notice.

## P1 — Browse

| Item | Status |
|---|---|
| Home | **done** — live config + schedule + next booking |
| Schedule screen | **done** — day strip, one shared query with Home, `/schedule` |
| Class detail | **done** — `/class/[eventId]`, resolves from the schedule cache |
| Appointment browsing | **out of v1** (§0.1-B) |
| Tab bar | **not-started, deliberately.** The approved mock has four tabs; two of them (Packages, Account) have no screens, and a tab that leads nowhere is a dead end. Add it when P2/P4 land. Navigation today is Home → Schedule → Detail with a real back affordance. |
| Pass-coverage on class rows | **blocked on P2.** Rows show a list price and never claim a pass covers the class — knowing that needs the client's passes AND the same coverage decision checkout will make. A label promising what checkout refuses is the widget bug that charged a member for an unlimited class. |

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
| B | Staging URL | **done 2026-08-06** — `https://dibs-api-staging-production.up.railway.app` (named by Alicia, probed the same day). The 2026-08-04 "no remote staging exists" finding was WRONG: it only tried the dead Heroku hosts. HTTPS, sandbox Stripe, and its DB has real passes. Also answers off-laptop device testing (open question 9). `docs/environments.md` |
| C | Firebase client config | **done** — lifted into gitignored `.env`, names in `.env.example`. Project `dibs-studio-clients` |
| D | Staging test user + studio state | **half done 2026-08-06.** Alicia named `alicia.ulin@gmail.com` = **userid 2502**, and staging has the data: two live passes at **studio 88** (a 1-use comp session and a 10-class package with 9 left), 5 sandbox cards, $862 credit at 210. **Still needed: the Firebase password**, without which nothing can be signed into |
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
   mock has an empty state there whose only action is a screen that does not exist yet. Now that
   the schedule screen exists, the empty state would work again — say the word if you prefer it.
5. **The hero asset requirement CHANGED with the full-screen opening.** What stays on screen at
   rest is the top 43% of a **full-screen** crop; previously only the middle of a 360px band ever
   showed. The hero must now be composed for the full frame with its subject high. The remote
   `heroUrl` is worse for this than it was before: Carlsbad's is a 1961×1258 landscape banner
   (2.7 MB PNG) and Everyday Ballet's is **689×459** — under a third of the 1170px the frame
   needs at @3x, so it will visibly upscale. `home-entrance.html` shows the sequence running on
   the real remote asset for comparison.
6. **The native splash is now the seam.** Expo shows its own splash before Home's full-screen
   photograph. If the splash were that same photo the handoff would be invisible and the app
   would appear to open in one continuous move — a one-line change per studio in
   `app.config.ts`. Everyday Ballet has a designed wordmark splash you may want to keep, so this
   is your call.

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
13. ~~May I build the card paths?~~ **APPROVED and BUILT 2026-08-06.** Everything except the
    PaymentSheet step was exercised against staging. The env-blind write is sidestepped by always
    passing the client's existing platform customer id, verified by confirming the `stripeid`
    columns were untouched after a live `create-setup-intent` call. **The underlying dibs-api bug
    is NOT fixed** — it is simply never triggered by this caller — so it stays on the backend list.
14. **Delete account is an App Store release gate, not a nice-to-have (NEW, 2026-08-06.)** Apple
    requires it for any app that offers sign-up, backend item 7.7 is what would implement it, and
    nothing on either side exists yet. Flagging it here because it is the kind of item that gets
    discovered during review rather than before it.

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
- 2026-08-06 (session 3) · The two `get-passes` defects — **CLOSED.** Fixed in dibs-api
  `90dc7fcc`, verified against the running local API.
- 2026-08-06 (session 3) · §0.5-D is now blocking a SECOND phase. Everything in P2 is written and
  none of it has been seen by a signed-in client. The pass list additionally cannot be verified
  even with a login, because the local database holds zero `passes` rows — it needs a data source
  that has them, which is the "at a studio with real pass data" half of §0.5-D.
- 2026-08-06 (session 3) · P2's card write paths **held pending Alicia** (open question 13).

## Two bugs that only real staging data could show (2026-08-06)

Both were in code that typechecked, passed its own tests, and was wrong. Recorded because the
mechanism repeats: a fixture written from a schema agrees with the schema.

1. **`studio_packages.autopay` is a Postgres ENUM — `'NONE' | 'ALLOW' | 'FORCE'` — not a boolean.**
   Aliased to `autopayStatus` by the `get-passes` include. Typed as `boolean` in
   `src/api/schemas/passes.ts`, which would have thrown on every pass in development
   (`strictSchemas: __DEV__`). The membership check read it too, and `'ALLOW' === true` is a dead
   comparison that reads like a working one. **The membership signal is `passes.autopay`, the
   row's own boolean** — the two disagree in live data (24 live passes flagged `true` on a `NONE`
   package, 5 `false` on a `FORCE` one), so the package field would call a one-off purchase a
   membership and miss real ones.
2. **Every saved card rendered as "Default".** The backend flags `is_default` by FINGERPRINT,
   which is correct for its purpose — the platform and connected copies of one card are the same
   card, and either may survive the merge — but a fingerprint identifies a card NUMBER, so any
   client who re-saved a card after an expiry update has several rows sharing one. Five cards on
   staging, five Default badges, and the badge exists to answer *which card gets charged*. Now an
   exact `defaultPaymentMethodId` match wins, with the fingerprint as the fallback it was meant to
   be, and the flag is assigned once over the surviving list rather than per card.

Also **confirmed correct** by the same data: pass 88912 expires `2027-07-17T03:59:59.999Z` at a
`America/New_York` studio and renders **"Expires Jul 16"** — the day the client actually has.
Verbatim-UTC would have said Jul 17. See the `passes.expiresAt` note in the shared `CLAUDE.md`.

## Backend findings — session 3 (2026-08-06, verified by reading the source)

Ordered by how much damage each can do. None are the app's to fix.

1. **`POST /update-profile` is unauthenticated and takes `userid` from the body — and it writes
   `email`.** Anyone can rewrite any client's name, phone AND email address. Pointing a
   stranger's Dibs row at your own email address associates their booking history, passes and
   credit with your Firebase session, because `get-user-account` resolves the Dibs identity by
   email. **This is the most serious auth gap this workstream has found.**
   (`services/shared/update-client-profile.js`, `routes/routers.js:419`.)
   **→ ASSIGNED to another agent, 2026-08-06.** Not this workstream's to fix. When the auth mount
   lands, the mobile app needs no change — it already sends its Firebase token on this call.
2. **Editing an email in Dibs silently locks the client out.** The Dibs row and the Firebase
   credential are separate systems and `update-profile` moves only one of them; `get-user-account`
   then matches them case-sensitively. The widget's profile form makes this reachable without any
   deliberate edit, because it **lowercases the address on save** — so any client whose Firebase
   email has a capital letter can lock themselves out by saving their profile. The mobile app
   does not offer email editing and writes the address back unchanged.
3. **`update-profile` throws mid-write when `phone` is absent.** It reads `phone.length` with no
   guard, *after* the name and email have already been written. The catch only `console.log`s, so
   the controller sends `undefined` as an empty HTTP 200 — the write happened, the client is told
   nothing, and a retry looks like the first attempt failed. The app always sends a string.
4. **`create-setup-intent` writes `dibs_users.stripeid` with no env branch** when called without a
   `customerid` — planting a sandbox `cus_` in the column the production charge paths read raw.
   Already catalogued in the shared `CLAUDE.md`; recorded here because **the mobile app's
   add-a-card flow would be a new caller of it**, which is part of open question 13.
5. **`update-communication-preferences`'s catch block references an undefined `user`**, so any
   failure there throws a `ReferenceError` out of the catch instead of answering.
   (`services/users/update-communication-preferences.js`.)
6. **`get-passes` filters `expiresAt >= now`**, which means a pass with a NULL expiry never comes
   back at all (`NULL >= now` is NULL, not true). Not observed at either pilot studio; recorded so
   the next person does not spend an hour hunting a missing row.

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

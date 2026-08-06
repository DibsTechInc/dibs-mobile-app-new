# Handoff — dibs-mobile-app, 2026-08-06

**Read `MOBILE_MASTER_PLAN.md` first** — §0.1 (direction changes that override later sections),
then §9 (invariants) and the session protocol in §4. **`EXECUTION_STATE.md` is the live status
file**; this document is a point-in-time snapshot of one session. Supersedes
`DevAssist/Aug5/HANDOFF.md`, which is now history.

Branch `feature/modernize-dibs-mobile-app`. **13 commits this session, all local and unpushed** —
operator policy is that Alicia reviews in GitKraken and pushes. Never push, never merge.

**Gate:** `npm run typecheck` clean · `npx jest` **579/579** · `npm run lint` 0 errors (2
pre-existing warnings in `src/domain/pricing`) · all 4 CI grep guardrails clean.

---

## 1. Start here

**Two things must happen before the app looks right, and one of them is not a Metro reload.**

1. **Rebuild natively.** `STUDIO_SLUG=carlsbad-village-yoga npx expo run:ios --device "iPhone 17 Pro"`.
   The splash image changed (`app.config.ts`), and splash config is baked into the binary. A
   Metro reload will NOT pick it up, and until it is rebuilt the splash→Home handoff still cuts.
2. **Restart Metro.** `metro.config.js` changed (the `@studio/hero` resolver). Metro reads its
   config once at startup.

Then: **P2 — account hub and wallet.** But read §4 first; the pass endpoint is defective and the
local database cannot exercise it.

---

## 2. What shipped this session

| | |
|---|---|
| **Home wired to live data** | `get-basic-config` + `get-schedule`, both public, so a signed-out client sees a full screen |
| **Auth** (P0 item 3, complete) | Firebase against `dibs-studio-clients`, session store, Dibs-identity resolution, token injection, 401 → sign-out, and the sign-in / create / reset screen at `/sign-in` |
| **Your next class** on Home | from `get-upcoming-appts` |
| **The app-open sequence** | photo full screen, held, then the panel rises from off-screen — see §3 |
| **Schedule + class detail** | `/schedule`, `/class/[eventId]`, to the approved mock |
| **Cancellation window as a moment** | "Free to cancel until 6:00 AM tomorrow", from the studio's own configured notice |
| **`domain/passes`** | the unlimited/placeholder/coverage rules, 25 tests — see §4 |

---

## 3. The app-open sequence (Alicia's design, settled)

The studio's photograph fills the WHOLE screen, held. Then the white panel carrying the schedule
travels up from entirely below the bottom edge and lands at the hero band.

**Timing is B, chosen 2026-08-06:** 620ms hold, 560ms rise, chrome fading in 140ms after the panel
starts. Constants live in `src/components/motion.tsx` (`COVER_HOLD`, `PANEL_RISE`).

Four things hold it together. Break any one and it stops reading as the app opening:

- **The photo layer never resizes.** It is full-window and stationary; only the panel moves.
  Animating the photo's height makes its crop crawl during the reveal, which gives the trick away.
- **Nothing sits on the photograph during the hold.** Scrim, greeting and account action fade in
  *after* the panel starts. A darkening ramp across the middle of a full-screen picture reads as
  a smudge; it only becomes a legibility treatment once there is a band for it to belong to.
- **The scrim runs the full screen height**, holding its final value below the band. Confined to
  the 360px band it terminated in a hard edge that the rising panel exposed as a line drawn
  across the picture (reported and fixed 2026-08-06).
- **The panel is opaque and square-edged.** Fading white in over a photo reads as haze settling on
  the picture; rounded top corners would promise it can be dismissed, and it is the page.

**It runs once per launch, not per mount** (`useAppOpenEntrance`). Home remounts on every return
and re-renders on pull-to-refresh; an entrance that replays reads as lag rather than arrival.

Preview with three timings + the current remote asset: `design/mockups/home-entrance.html`.

### The splash handoff is now invisible — and that changed the hero contract

The native splash shows the **same file at the same fit** as Home's opening frame, and the splash
is held until the first frame is drawable (`ThemeProvider` releases it once fonts resolve).

**This required Home's hero to become the BUNDLED file, not `heroUrl`.** A remote image cannot be
on screen at frame zero, so the splash would have handed off to an empty wash while it downloaded
— a worse seam than the one being removed. The old promise ("a studio can change their photo
without a store release") is preserved as an opt-in: `assets.heroSource: 'remote'` in a studio's
config goes back to the live URL and accepts the visible cut.

**Consequence for design: the hero must now be composed for the FULL frame with its subject high.**
What stays on screen at rest is the top ~43% of a full-screen crop. Previously only the middle of
a 360px band ever showed.

Mechanism: Metro resolves `@studio/hero` by reading `assets.hero` out of the current studio's
`studio.json` (`metro.config.js`). Resolved by filename from config rather than a fixed
`hero.jpg`, because the extension genuinely varies — 263's is a PNG. **Verified by exporting all
three studios: each bundles exactly its own hero and nothing belonging to anyone else.**

---

## 4. ⚠️ Read this before building any pass surface

Three findings, in descending order of how much they will cost you.

### 4.1 `get-passes` never returns an unlimited pass

`dibs-api/services/shared/get-passes.js` builds its `where` as:

```js
[Op.or]: {
    totalUses: { [Op.eq]: null },
    totalUses: { [Op.gt]: { [Op.col]: 'usesCount' } },   // ← same key, overwrites the line above
}
```

A JavaScript object literal with a duplicate key keeps the last one, so the `null` branch is
discarded before Sequelize ever sees it. What survives is `totalUses > usesCount`, and in SQL that
is `NULL` — not true — for an unlimited pass. **Every membership is silently filtered out.**

This is the **seventh** surface the `totalUses === null` trap has hit (six are catalogued in the
shared `CLAUDE.md`). Backend fix, needs Alicia's approval; not the app's to make.

### 4.2 `get-passes` returns placeholder passes and gives you no way to filter them

`is_placeholder` is in neither the `where` clause nor the `attributes` list. So hold passes for
unpaid reservations come back, AND the app has no field to exclude them by. The platform invariant
is that they must never appear in any client-facing list — they mark an outstanding charge, not an
entitlement.

`src/api/schemas/passes.ts` types `is_placeholder` as optional, and `domain/passes` filters on it,
so **the app starts behaving correctly the day the backend returns it, with no client release.**

### 4.3 The local database has no passes and no transactions

```
dibs_users        381,254        passes                 0
events          1,348,022        dibs_transactions      0
attendees       2,318,560        credits           25,130
studio_packages    10,616
```

So `get-passes` returns `[]` locally no matter what, and anything transaction-shaped is
unexercisable. **§0.5-D (a staging test user) is now a harder blocker than it looked** — it is not
just "a login", it is "a login at a studio whose pass and transaction data actually exists."

**What this means for the next session:** `domain/passes` is built and fully tested (pure logic,
no DB needed). Wiring it to a screen can be done, but **cannot be verified** until either the
backend defects are fixed or there is a data source that has passes. Build the account/wallet
screens against fixtures, and mark them unverified rather than claiming they pass.

---

## 5. Other backend findings (recorded, none fixed)

All verified by reading the source in `dibs-api`.

- **`POST /get-upcoming-appts` is unauthenticated** and takes `userid` from the body — anyone can
  read anyone's bookings. Belongs on the 7.3 hardening list. The app sends its token anyway, so it
  keeps working the day that mount lands.
- **`services/shared/add-data-to-appts.js` silently drops a booking** whose `attendees.attendeeID`
  does not parse as an integer (`parseInt` → NaN → `return null`). Same synthetic-id problem that
  cost Revenue by Class 47% of studio 263's June rows. A client's booking can genuinely be missing
  from their own list.
- **The same file reads `classinfo.instructor.firstname` with no null guard**, so an event with no
  instructor row rejects inside a `.then()`, the route's catch does `return err` without ever
  calling `res.json`, and the request hangs until it times out.
- **`get-schedule`, `get-user-account` and `get-passes` all answer HTTP 200 with an error body**
  on failure (the service catch returns the error and the controller sends it). Every wrapper in
  `src/api/endpoints/` validates the shape and raises — otherwise an outage renders as "no classes
  today".
- **`get-user-account` matches `where: { email }` — CASE SENSITIVE**, unlike
  `middleware/widget-auth.js`, which lowercases. A case-mismatched email authenticates fine and
  then reports `hasAccount: false`.
- **`create-new-dibs-user` never reads the `newpwd` the widget sends it.** The mobile app does not
  send a password.

---

## 6. Architecture notes worth knowing

- **`src/api/` is pure TypeScript except `src/api/index.ts`**, which wires the live client. Nothing
  in the jest roots may import it. Everything else takes its dependencies as arguments so it stays
  testable in the Node project.
- **Endpoint functions live in `src/api/endpoints/`** and take an `ApiClient`. They are where the
  "HTTP 200 with an error body" defence lives.
- **Domain logic is in `src/domain/`** and is the only thing with tests: `pricing`, `time`,
  `schedule`, `home`, `bookings`, `cancellation`, `auth`, `passes`.
- **One query serves Home, the schedule and class detail** — `useSchedule`. Slicing happens in
  `domain/schedule/`, never in a second request, so no two surfaces can disagree about a class.
- **The session store holds a live Firebase session and nothing else.** Not persisted, no userid,
  no profile. Those live in TanStack Query keyed on the signed-in email. A persisted userid on a
  shared phone is the previous client's identity.
- **No tab bar yet.** The approved mock has four tabs; Packages and Account have no screens, and a
  tab leading nowhere is a dead end. Add it when P2/P4 land.

---

## 7. Needs Alicia

1. **The hero photograph.** Strongest open item, and §3 sharpened it. What stays on screen is the
   top 43% of a full-screen crop. The app now uses the **bundled** vertical assets, which are the
   right ones — so this is mostly resolved in code. What remains: confirm the bundled crops read
   well on device, particularly Everyday Ballet's dancer.
2. **The scrim on Everyday Ballet.** High-key photo; darkening may read as a smudge. The fix, if
   so, is the greeting BELOW the photo for that studio, not a deeper scrim.
3. **Approve the two backend fixes in §4.1 and §4.2** — both are in `dibs-api`, both need your
   sign-off, and P2 is blind without them.
4. **A staging test user, at a studio with real pass data** (§0.5-D, and §4.3 above).
5. `design/mockups/auth.html` — review, not a block.
6. **Apple credentials** via `eas credentials`; the privacy-policy page still does not exist.

---

## 8. Running it

```bash
# The local API — REQUIRED, the app targets http://localhost:3001/api/v2
cd ../dibs-api && npm run dev        # nodemon; or `node index.js` to run it detached

# Native rebuild — needed after app.config.ts or any native dependency change
STUDIO_SLUG=carlsbad-village-yoga npx expo run:ios --device "iPhone 17 Pro"

# Fast iteration once the dev build is installed
STUDIO_SLUG=carlsbad-village-yoga npx expo start

# Gate — all three before reporting anything complete
npm run typecheck && npx jest && npm run lint
```

Routes: Home `/` · schedule `/schedule` · class `/class/[eventId]` · auth `/sign-in` ·
component gallery `/dev-shell`.

---

## 9. Working agreements

- **One phase-item per commit, local, never pushed.**
- **Verify, do not assume.** Every claim in this document is traceable to something that was run:
  endpoint shapes came from live responses, the pass counts from a SQL query, the asset isolation
  from three `expo export` runs.
- **Declare before use, even across separate edits.** Metro watches the working tree, so the
  intermediate states between edits are real states the app can run. A JSX edit that referenced a
  prop before the destructure landed broke the running bundle mid-session.
- **Never run prettier on this repo.** There is no prettier config, so it reformats everything to
  its own defaults (double quotes) and buries a real change in hundreds of lines of churn.
- **Stop and ask** on: DB schema changes, new dibs-api endpoints, anything touching billing or
  Stripe, deleting files or features, anything affecting live bookings.
- **Report honestly.** Nothing in this session was verified on a device by me. Visual claims are
  "it compiles and the logic is tested", not "I saw it".

# Handoff — dibs-mobile-app, 2026-08-06 (session 3)

**Read `MOBILE_MASTER_PLAN.md` first** — §0.1 (direction changes that override later sections),
then §9 (invariants) and the session protocol in §4. **`EXECUTION_STATE.md` is the live status
file**; this is a point-in-time snapshot of one session. Supersedes `DevAssist/Aug6/HANDOFF.md`,
whose §4 is now largely resolved — see §2 below before acting on it.

Branch `feature/modernize-dibs-mobile-app`. **4 commits this session, all local and unpushed** —
operator policy is that Alicia reviews in GitKraken and pushes. Never push, never merge.

**Gate:** `npm run typecheck` clean · `npx jest` **616/616** · `npm run lint` 0 errors (2
pre-existing warnings in `src/domain/pricing`) · all 4 CI grep guardrails clean · `expo export`
builds the iOS bundle and each studio still bundles only its own hero.

**Nothing in this session was run on a simulator or a device.** Every visual claim below is "it
compiles, the logic is tested, and the endpoint was called with curl" — not "I saw it."

---

## 1. Start here

1. **Rebuild natively.** `STUDIO_SLUG=carlsbad-village-yoga npx expo run:ios --device "iPhone 17 Pro"`.
   Still owed from two sessions ago: the splash image changed in `app.config.ts` and splash config
   is baked into the binary. A Metro reload will not pick it up.
2. **Restart Metro** — `metro.config.js` changed (the `@studio/hero` resolver) and Metro reads its
   config once at startup.
3. **Answer open question 13** in `EXECUTION_STATE.md` — whether to build P2's card write paths.
   It is the only thing left in P2, and it is an ask because it is a Stripe write on a path with
   a known env-blind bug. Everything else in P2 is built.

New routes to look at: `/account` · `/account/wallet` · `/account/profile`. Reach them by tapping
your own name over the hero photograph on Home.

---

## 2. The previous handoff's §4 is mostly resolved

| Last session's blocker | Now |
|---|---|
| §4.1 `get-passes` never returns an unlimited pass | **FIXED** in dibs-api `90dc7fcc` (branch `staging`). `[Op.or]` is an array. |
| §4.2 `get-passes` returns placeholder passes with no field to filter them by | **FIXED** in the same commit. Filtered server-side on the row AND the `$studioPackage.is_placeholder$` join, and `is_placeholder` is in `attributes`. |
| §4.3 the local database has no passes and no transactions | **STILL TRUE.** `passes` 0, `dibs_transactions` 0. `credits` is real: 272 rows at studio 88, 355 at 210, balances to $900. |

Both fixes verified by reading `dibs-api/services/shared/get-passes.js` and by calling the running
local endpoint, not by trusting the commit message.

**The app still filters placeholders client-side**, and should keep doing so. `is_placeholder` was
written inconsistently across the three hold-creation paths for years and pre-backfill rows exist;
a defence that costs one function call does not get removed because one endpoint was fixed.

**What §4.3 means in practice:** the pass list is the one thing in P2 that cannot be verified even
with a login, because there is nothing to show. `domain/passes` and `domain/wallet` are unit-tested
against fixtures; the screen is unverified and marked so.

---

## 3. What shipped this session

All of P2 except the card write paths.

| | |
|---|---|
| **The three wallet reads** | `get-passes`, `get-credit`, `stripe/get-all-payments`, each validating the success shape. All three answer HTTP 200 on failure; `get-credit` answers with a **bare number**. |
| **`domain/payments`** | The widget's card merge, ported — see §4. |
| **`domain/wallet`** | Every section carries a status rather than inferring one from its own length. |
| **`domain/money`** | Prices drop empty cents; balances never do. One implementation, re-exported by `schedule/entry`. |
| **Account hub** | `/account`. Home's account action now goes here rather than back to sign-in. |
| **Wallet** | `/account/wallet` — passes, credit, saved cards. |
| **Profile** | `/account/profile` — name and mobile number. Email deliberately not editable, see §5. |
| **`formatInstantInStudioZone`** | For the handful of values that are genuine instants rather than wall-clock readings. See §6. |

---

## 4. `domain/payments` — read this before touching a card surface

A saved card exists **twice** in Stripe: on the Dibs platform customer and on the studio's
connected-account customer. `get-all-payments` returns two arrays; the client has one card.
`mergeSavedCards` is a deliberate port of `dibs-widget-new/src/hooks/usePaymentMethodsOwner.js`,
because invariant #6 is that numbers must match the web — if the app collapsed two rows the widget
shows separately, a client would remove "the card" here and find it still charging them there.

Three rules are load-bearing:

- **The de-duplication key is `brand + last4 + exp_month + exp_year + fingerprint`, not the
  fingerprint alone.** A fingerprint identifies a card NUMBER, so re-saving a card after an expiry
  update makes two chargeable payment methods sharing one number. The local sandbox has exactly
  this — **five copies of 4242, one fingerprint, five different expiry dates.** (The widget's
  appointment path dedupes on `last4` alone; that is a known bug there, not a pattern to copy.)
- **Connected-account cards are added first, so a studio-side copy wins the tie.** `platform` is
  not a label, it is part of the charge contract: the backend clones a `'Dibs'` card onto the
  connected account before charging it and skips that for `'Studio'`. The exact casing matters.
- **`card_` ids are chargeable alongside `pm_`.** Narrowing that to `pm_` was a two-day production
  outage in July that hit 91% of studio 210's active roster. There is a test asserting it; if that
  test ever fails, the outage is back.

**`lookupFailed` is the reason `get-all-payments` needs a wrapper at all.** Confirmed live: userid
10 at studio 210 returns `lookupFailed: true` with an empty list, because their stored customer id
is a live `cus_` being read with a sandbox key. `resource_missing` does not mean "this client has
no cards" — it means "not on the account we asked about". A partial failure shows the cards it did
get and says the list may be incomplete.

---

## 5. Three findings about `POST /update-profile`, in descending order of damage

All verified by reading `dibs-api/services/shared/update-client-profile.js`.

1. **It is unauthenticated, takes `userid` from the body, and writes `email`.** Anyone can rewrite
   any client's name, phone and email address. Pointing a stranger's Dibs row at your own address
   associates their booking history, passes and credit with your Firebase session, because
   `get-user-account` resolves identity by email. **This is the most serious auth gap this
   workstream has found.** Top of the 7.3 list.
2. **Editing an email in Dibs silently locks the client out.** Firebase and Dibs are separate
   systems; `update-profile` moves only one of them, and `get-user-account` then matches them
   case-sensitively. Worse: the widget's own profile form **lowercases the address on save**, so
   any client whose Firebase email has a capital letter can lock themselves out by saving their
   profile without editing anything. The mobile app does not offer email editing and writes the
   address back unchanged — an identity write.
3. **It throws mid-write when `phone` is absent.** `phone.length` with no guard, *after* the name
   and email have been written. The catch only `console.log`s, so the controller sends `undefined`
   as an empty HTTP 200: the write happened, the client is told nothing, a retry looks like the
   first attempt failed. The app always sends a string.

Two smaller ones: `update-communication-preferences`'s catch references an undefined `user` (a
`ReferenceError` out of the catch), and `get-passes` filters `expiresAt >= now`, so a pass with a
NULL expiry never comes back at all.

---

## 6. Pass expiries are real instants, and that is not how the rest of the app works

Everything else stored is a wall-clock reading wearing a `Z` and is printed verbatim. Pass expiry
is not: `Pass.createNewPass` writes `moment().tz(studio.mainTZ).endOf('day').add(…)`, a genuine
UTC instant. End of Nov 30 in Los Angeles is `2026-12-01T07:59:59Z`.

So both of the app's usual habits are wrong for it — verbatim-UTC would say **Dec 1** for a pass
the studio considers good through Nov 30, and device-local would say Nov 30 at home and Dec 1 from
a phone in London. `formatInstantInStudioZone` reads it back in the studio's zone, which is the
only rendering that says what the studio says from anywhere on earth. There is a test pinning it.

---

## 7. What the mock has that these screens do not, and why

Nothing is stubbed. Every one of these is absent because the data behind it does not exist yet,
and a wrong number on a money surface is worse than one section short.

| Missing | Why |
|---|---|
| **"Your journey"** (23 classes, 2 to go, member since) | Nothing in P2 returns a lifetime class count, and the milestones backend carries a **STATUS UNVERIFIED** banner in the shared `CLAUDE.md` — the code could not be located on any branch. P6. |
| **Upcoming payment** ("charged on the 25th") | Needs subscription data. P5. A date and an amount are the two things a client must never be wrong about. |
| **Recent** (transaction history) | P5 — and `dibs_transactions` is empty locally anyway. |
| **"Give $10, get $10"** | Referral endpoints, not in P2's list. |
| **"Your classes"** | Needs a bookings list screen; Home shows the next one today. |
| **Delete account** | **Apple requires it for any app with sign-up.** Backend 7.7. Recorded as a release gate in `EXECUTION_STATE.md` open question 14. Not stubbed, because a delete-account row that does not delete the account is the worst possible version of it. |
| **Tab bar** | Three of the mock's four tabs now exist. Adding one restructures Home's approved app-open sequence (the panel's travel is computed from the full screen height), so it is worth doing once Packages lands in P4 — as one change rather than two. |

---

## 8. Needs Alicia

1. **Open question 13 — the card write paths.** The only thing left in P2. See §9.
2. **A staging test user, at a studio with real pass data** (§0.5-D). Now blocking a second phase:
   everything in P2 is written and none of it has been seen by a signed-in client.
3. **The hero photograph on device** — carried forward. What stays on screen at rest is the top
   43% of a full-screen crop; the bundled vertical assets are the right ones, but Everyday
   Ballet's dancer needs eyes on it.
4. **The scrim on Everyday Ballet** — high-key photo; if darkening reads as a smudge the fix is
   the greeting BELOW the photo for that studio, not a deeper scrim.
5. `design/mockups/auth.html` — review, not a block.
6. **Apple credentials** via `eas credentials`; the privacy-policy page still does not exist.

---

## 9. The one open decision

**Should the next session build add-a-card (PaymentSheet), remove-card and set-default-card?**

They are P2 scope and there is no guesswork in the shape — the widget's exact sequence is traced in
`docs/verified-widget-sequences.md` (SetupIntent on the Dibs **platform** account with
`onDibs: true`, client-side confirm, then `POST /stripe/create-user-connected` to clone it onto the
connected account, then refresh the list).

What makes it an ask rather than a build:

- They are Stripe **writes**, which `MOBILE_MASTER_PLAN` §9 puts in the stop-and-ask list.
- They cannot be verified without both a test login and a native rebuild, so building them now
  means shipping unverified code into an unverified phase.
- `create-setup-intent` writes `dibs_users.stripeid` **with no env branch** when called without a
  `customerid` — it can plant a sandbox `cus_` in the column the production charge paths read raw.
  The app would become a new caller of that path. Passing the client's existing `stripeIdAtDibs`
  avoids the branch entirely, which is what the widget does and what I would do.

`toRemoveCardPayload` is already built and tested against the endpoint's attribute-matching
contract (it matches by `brand`/`last4`/`exp_month`/`exp_year`, not by id, which is what lets it
detach both copies) — so the domain side is ready either way.

---

## 10. Working agreements

- **One phase-item per commit, local, never pushed.**
- **Verify, do not assume.** Every claim here traces to something that was run: the backend fixes
  from reading the source and calling the endpoint, the row counts from SQL, the card shapes from
  a live `get-all-payments` response, the bundle from `expo export`.
- **Declare before use, even across separate edits.** Metro watches the working tree, so the
  intermediate states between edits are real states the app can run.
- **Never run prettier on this repo.** No prettier config exists, so it reformats everything to
  its own defaults and buries a real change in hundreds of lines of churn.
- **Stop and ask** on: DB schema changes, new dibs-api endpoints, anything touching billing or
  Stripe, deleting files or features, anything affecting live bookings.
- **Report honestly.** Nothing this session was verified on a device.

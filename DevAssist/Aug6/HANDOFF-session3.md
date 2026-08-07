# Handoff — dibs-mobile-app, 2026-08-06 (session 3)

**Read `MOBILE_MASTER_PLAN.md` first** — §0.1 (direction changes that override later sections),
then §9 (invariants) and the session protocol in §4. **`EXECUTION_STATE.md` is the live status
file**; this is a point-in-time snapshot of one session. Supersedes `DevAssist/Aug6/HANDOFF.md`,
whose §4 is now largely resolved — see §2 below before acting on it.

Branch `feature/modernize-dibs-mobile-app`. **7 commits this session, all local and unpushed** —
operator policy is that Alicia reviews in GitKraken and pushes. Never push, never merge.

**Gate:** `npm run typecheck` clean · `npx jest` **635/635** · `npm run lint` 0 errors (2
pre-existing warnings in `src/domain/pricing`) · all 4 CI grep guardrails clean · `expo export`
builds the iOS bundle for both v1 studios, each bundling only its own hero.

**P2 is code-complete.** Every endpoint was exercised against real staging data and validated
through the app's own schemas — which caught two bugs. **But the app itself was never run.** No
simulator, no device, no signed-in session. Every visual claim below is "it compiles, the logic is
tested, and the endpoint answered with the shape the code expects."

---

## 1. Start here — run it

Everything that was blocking this is now unblocked. Alicia supplied the staging backend, the test
login and its password mid-session.

```bash
# Native rebuild — REQUIRED. Two reasons a Metro reload cannot cover:
#   • the splash image changed in app.config.ts two sessions ago (baked into the binary)
#   • @stripe/stripe-react-native is now mounted, and the PaymentSheet is native code
EXPO_PUBLIC_API_URL=https://dibs-api-staging-production.up.railway.app/api/v2 \
  STUDIO_SLUG=everyday-ballet npx expo run:ios --device "iPhone 17 Pro"
```

**Studio 88 (everyday-ballet), not 210** — `alicia.ulin@gmail.com` (userid 2502) holds two live
passes at 88 and none at 210, so it is the only place the wallet has anything to show.

Restart Metro as well; `metro.config.js` changed (the `@studio/hero` resolver) and Metro reads its
config once at startup.

**What to look at:** `/account` · `/account/wallet` · `/account/profile`, reached by tapping your
own name over the hero photograph on Home. In the wallet, expect two passes (a 1-use
`[Admin] Comp Session` and a 10-class package with 9 left), $0 credit at 88, and six saved cards
with **exactly one** marked Default.

**The one step no curl could reach is the PaymentSheet.** Everything either side of it is verified;
tapping "Add a payment method" on a device is what proves the middle.

---

## 2. The previous handoff's §4 is fully resolved

| Last session's blocker | Now |
|---|---|
| §4.1 `get-passes` never returns an unlimited pass | **FIXED** in dibs-api `90dc7fcc` (branch `staging`). `[Op.or]` is an array. |
| §4.2 `get-passes` returns placeholder passes with no field to filter them by | **FIXED** in the same commit. Filtered server-side on the row AND the `$studioPackage.is_placeholder$` join, and `is_placeholder` is in `attributes`. |
| §4.3 no pass or transaction data | **RESOLVED by the staging backend** — see §2b. It has 87,222 passes and 594,231 transactions. Still 0 and 0 in the local restore, which is now the second-choice target. |

Both fixes verified by reading `dibs-api/services/shared/get-passes.js` and by calling the
endpoint, not by trusting the commit message.

### 2b. A remote staging backend exists — `dibs-api-staging-production.up.railway.app`

Named by Alicia mid-session. **The 2026-08-04 conclusion that no remote staging existed was
wrong** — it probed the dead Heroku hosts and stopped there. Full detail in `docs/environments.md`.

| | local restore | **staging** |
|---|---|---|
| `passes` | 0 | **87,222** |
| `dibs_transactions` | 0 | **594,231** |
| Stripe | sandbox | **sandbox** (`pk_test_…`, `livemode: false`) |
| `get-passes` fix deployed | yes | **yes** |

It is a **different database** from the local restore — the same client has $862 credit at studio
210 there and $786 locally. Never reason across the two. It runs in dev mode consistently (it
resolved `stripeid_test`, and its Stripe key is a test key), which is what makes card work safe;
re-check that pairing after any redeploy, because a test key with prod account ids is the trap in
`.claude/CLAUDE.md` § "Stripe IDs — Dev vs Prod".

Being HTTPS, it also answers open question 9 — device testing no longer needs the laptop's LAN.

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
| **Card write paths** | Add via PaymentSheet, remove, set default. Approved by Alicia mid-session. See §4b. |
| **`formatInstantInStudioZone`** | For the handful of values that are genuine instants rather than wall-clock readings. See §6. |

### Two bugs that only real staging data could show

Both were in code that typechecked and passed its own tests. The mechanism repeats and is worth
internalising: **a fixture written from a schema agrees with the schema**, so neither could have
been caught by the tests covering it.

1. **`studio_packages.autopay` is a Postgres ENUM** — `'NONE' | 'ALLOW' | 'FORCE'` — not a
   boolean. Typed as boolean, it would have thrown on every pass in development. Worse, the
   membership check read it, and `'ALLOW' === true` is a dead comparison that reads like a working
   one. The real signal is `passes.autopay`, the row's own boolean: live data has 24 passes flagged
   `true` on a `NONE` package and 5 `false` on a `FORCE` one.
2. **Every saved card rendered "Default".** Observed live at studio 88 — the backend returned
   `is_default: true` on all six, because it flags by FINGERPRINT and all six are test card 4242.
   That is correct for its purpose (either copy of one card may survive the merge) and wrong as a
   per-row answer. An exact `defaultPaymentMethodId` match now wins, with the fingerprint as the
   fallback it was meant to be. The badge answers "which card gets charged"; six answers is none.

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

## 4b. The card write paths, and the one bug they had to route around

Sequence, ported from `docs/verified-widget-sequences.md` § A1 rather than guessed:

1. `POST /stripe/create-setup-intent` with `onDibs: true` → a SetupIntent on the **Dibs platform**
   account.
2. PaymentSheet in setup mode. The card attaches to the **platform** customer.
3. `POST /stripe/create-user-connected` → makes sure a customer exists on the **studio's connected**
   account. It does **not** move the card.
4. Re-read the list from Stripe.

**A card saved on the platform is not chargeable by the connected account as it stands** — it is
cloned across immediately before the charge, which is what `platform: 'Dibs' | 'Studio'` on a
merged card row is for. Every charge happens on the connected account. Verified by reading
`create-user-on-stripe-connected.js` and the widget's `chargeSavedCardCheckout.js`.

**The env-blind write, and how this routes around it.** `create-setup-intent` mints a new platform
customer when called without `customerid`, and writes it to `dibs_users.stripeid` **with no
environment branch** — a sandbox `cus_` landing in the column production charge paths read raw, on
top of whatever pointer was there. So the app always passes the client's existing platform
customer id, which comes back environment-correct from `get-user-account`
(`isProduction ? stripeid_prod : stripeid_test`). Verified against staging: a real `seti_…` came
back and the `stripeid` columns were untouched. **The dibs-api bug itself is NOT fixed** — it is
simply never triggered by this caller, and stays on the backend list.

**Step 3 is advisory.** By the time it runs the card is already attached to the platform customer,
and the charge path creates the connected customer itself if it is still missing. Reporting a
failure there as a failed card-add would send a client back to add a card they already have.

**What was and was not exercised against staging.** `get-stripe-publishable-key`,
`create-user-connected` and `create-setup-intent` were all called for real, as was
`set-default-card` — both its success shape and its `invalid_payment_method_id` refusal. Every
fixture in `src/api/__tests__/cards.test.ts` is one of those real responses. **`remove-card` was
deliberately NOT fired**: it detaches from both Stripe accounts, and destroying a real test card to
prove a request shape is not a trade worth making. It is wired and unit-tested.

---

## 5. Three findings about `POST /update-profile`, in descending order of damage

> **Finding 1 is ASSIGNED to another agent** (Alicia, 2026-08-06). Do not fix it from this
> workstream. The app already sends its Firebase token on this call, so it keeps working the
> moment an auth mount lands.

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

1. **Run it on a device and look at it** — the whole of P2 is unverified visually, and the
   PaymentSheet is the one step that cannot be verified any other way. Command in §1.
2. **The hero photograph on device** — carried forward. What stays on screen at rest is the top
   43% of a full-screen crop; the bundled vertical assets are the right ones, but Everyday
   Ballet's dancer needs eyes on it.
3. **The scrim on Everyday Ballet** — high-key photo; if darkening reads as a smudge the fix is
   the greeting BELOW the photo for that studio, not a deeper scrim.
4. `design/mockups/auth.html` — review, not a block.
5. **Apple credentials** via `eas credentials`; the privacy-policy page still does not exist.
6. **Delete account** — Apple requires it for any app with sign-up, backend item 7.7, nothing
   exists on either side. A release gate, and the kind that gets discovered during review.

---

## 9. Working agreements

- **One phase-item per commit, local, never pushed.**
- **Verify, do not assume.** Every claim here traces to something that was run: the backend fixes
  from reading the source and calling the endpoint, the row counts from SQL, the card shapes from
  a live `get-all-payments` response, the bundle from `expo export`.
- **A fixture written from a schema agrees with the schema.** Both bugs found this session were
  invisible to the tests covering that code and obvious the moment a real response went through
  it. When an endpoint is reachable, put its actual output through the app's own types before
  believing the types.
- **"I probed the hosts in the doc and none answered" is not "it does not exist."** That reasoning
  produced the 2026-08-04 conclusion that there was no staging backend, which cost this workstream
  two sessions of working against a database with no passes in it. Ask.
- **Declare before use, even across separate edits.** Metro watches the working tree, so the
  intermediate states between edits are real states the app can run.
- **Never run prettier on this repo.** No prettier config exists, so it reformats everything to
  its own defaults and buries a real change in hundreds of lines of churn.
- **Stop and ask** on: DB schema changes, new dibs-api endpoints, anything touching billing or
  Stripe, deleting files or features, anything affecting live bookings.
- **Report honestly.** Nothing this session was verified on a device.

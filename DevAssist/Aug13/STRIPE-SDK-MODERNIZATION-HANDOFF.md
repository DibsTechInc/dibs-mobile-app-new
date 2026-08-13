# Stripe SDK modernization — handoff

Written 2026-08-13. Everything below was verified in this session unless marked INFERRED.

**Goal:** finish moving dibs-api onto Stripe SDK 22.5.0 and standardize every call on API version
**`2026-07-29.dahlia`** (Alicia's call, 2026-08-13). Then the mobile card-booking flow gets tested
once, against the stack it will actually ship on.

**Not the goal:** making anything work on the old SDK. That was proposed mid-session and rejected —
correctly. Testing against a version we are about to delete is work done twice.

---

## Where things stand

| Branch | stripe | State |
|---|---|---|
| `origin/staging` | **^22.5.0** | Deployed. Currently **502 on every route** — see below |
| `origin/main` | ^11.1.0 | Not yet caught up |
| `chore/upgrade-stripe-sdk` | ^22.5.0 | The bump + the `new Stripe()` sweep (31 sites, 29 files) |
| `feature/mobile-card-booking` | ^11.1.0 | The two checkout endpoints, webhook, sweep script, tests |
| `dibs-mobile-app@feature/card-booking` | — | App side: booking flow, PaymentSheet, price display |

Staging boots but **every connected-account call fails at request time.** The card-booking
endpoints, memberships, retail, gift cards and card management are all affected. That is the work
below, and there is no useful testing until it is done.

---

## The two things that must not be confused again

This tripped up both of us for most of a session. Write it down, keep it written down.

**API version** — the `Stripe-Version` header. Controls what **Stripe's servers** do: which fields
come back, which parameters they accept.

**SDK version** — the `stripe` npm package. Controls what **our code** does before the request
leaves: which methods exist, how arguments are parsed, whether a value becomes a header or a body
field.

Consequences worth holding on to:

- **The Stripe Dashboard's "API version" is the ACCOUNT DEFAULT**, and almost every call in this
  repo overrides it with an explicit header. So "the dashboard says we're on something ancient" and
  "our calls use modern infrastructure" are both true. Not a contradiction, and not a problem.
- **Most of the API-version modernization is already done.** The codebase absorbed Basil in August
  2026 — `subscription-period.js`, the defensive `sub.x || item.x` reads. That is why the SDK jump
  did not produce a wave of undefined fields.
- **The bug that broke staging had nothing to do with API versions.** It was purely SDK argument
  parsing. No `Stripe-Version` could have changed the outcome.

> ⚠️ **"stripe-node" and "stripe" are the same package.** `stripe-node` is the GitHub project name;
> npm ships it as `stripe`. Earlier notes in this session used both as if they were different
> things. There is only one.

---

## What actually broke, and why the tests said it was fine

SDK 22 stopped inferring whether your second argument is params or options. From the release notes:
*"To supply options without params, pass `undefined` as the first argument explicitly."*

```js
// v11 — stripeAccount recognised as an option
stripe.paymentIntents.retrieve(id, { stripeAccount })   →  header  Stripe-Account: acct_88   ✓

// v22 — stripeAccount treated as a request PARAMETER
stripe.paymentIntents.retrieve(id, { stripeAccount })   →  body    stripeAccount=acct_88     ✗
```

Live failure, staging, 2026-08-13:

```
[class-card] create-payment-intent failed: {
  "code": "parameter_unknown",
  "message": "Received unknown parameter: stripeAccount",
  "param": "stripeAccount",
  "request_log_url": ".../acct_1Rqmyf3fZx2YZEAV/test/workbench/logs?object=req_w4SWtPQLgVFwfW"
}
```

Note the account in that URL: `acct_1Rqmyf3fZx2YZEAV` is the **platform sandbox**, not the studio's
connected account. With `stripeAccount` swallowed into the body, the `Stripe-Account` header was
never sent, so the call went to the wrong account *and* carried a junk field.

### The part that matters more than the bug

**The full test suite reported "no new failures" for this change.** It was reported as evidence the
upgrade was safe. It was not evidence of anything — **Stripe is mocked in every test in this repo**,
so the suite is structurally incapable of seeing request shape. One real request from the simulator
found in seconds what 2,145 tests could not.

This is the CLAUDE.md rule about mocked tests validating only the functions you point them at.
**Do not accept a green suite as proof that an SDK change is safe.** Only a real sandbox call is.

---

## Step 1 — verification strategy (decided)

**Use the real Stripe sandbox. Do not add stripe-mock.**

A mock server was proposed and dropped: this repo already has the better instrument — a sandbox
platform account, a sandbox connected account for studio 88, and a staging deploy. Real test-mode
calls verify everything a mock would, plus everything it would not.

### ⭐ But this ENTIRE bug class is detectable offline — use this

The SDK is an EventEmitter, and its `request` event exposes the `Stripe-Account` header it is about
to send. **No network, no mock server, no deploy, and a fake key is fine** — the request never has
to succeed, because the header is decided before it leaves. Verified on 22.5.0:

```js
const Stripe = require('stripe');
const s = new Stripe('sk_test_fake', { maxNetworkRetries: 0 });
const seen = [];
s.on('request', (r) => seen.push(r.account));   // r.account === the Stripe-Account header

await Promise.allSettled([
  s.paymentIntents.retrieve('pi_x', { stripeAccount: 'acct_88' }),             // BROKEN
  s.paymentIntents.retrieve('pi_x', undefined, { stripeAccount: 'acct_88' }),  // FIXED
  s.paymentIntents.create({ amount: 100, currency: 'usd' }, { stripeAccount: 'acct_88' }), // already OK
]);
```

```
broken   retrieve(id, {opts})             → account = undefined   ← the bug, caught
fixed    retrieve(id, undefined, {opts})  → account = acct_88
correct  create(params, {opts})           → account = acct_88
```

**This is the verification loop for the whole sweep.** For every one of the 39 sites, an assertion
that `r.account` equals the expected connected account proves the fix — deterministically, in CI,
without touching Stripe. It also settles the `.list()` question empirically instead of by
reading signatures: if `account` comes back populated, that call was already correct, leave it alone.

Build it as a small helper (e.g. `services/shared/stripe/__tests__/helpers/capture-request.js`) and
use it in a guard test per money surface. That converts "39 unverifiable edits in money paths" into
39 verified ones, and leaves a permanent tripwire for the next SDK upgrade.

Also worth adding, for prevention rather than detection:

- **An ESLint rule** (or a `scripts/check-*.sh` in the CI pattern of `lint:studio-scope`) flagging
  `{ stripeAccount` as the argument immediately following an identifier in a Stripe call — the same
  shape as the existing `dibs/no-employee-studio-id` rule.

**Real sandbox calls are still required** for the per-surface burn-in in Step 5. The offline check
proves the header is right; only a real call proves the whole operation is.

---

## Step 2 — the argument-shape sweep

**42 candidate sites** found by normalising whitespace and matching
`.<method>(<single-arg>, { stripeAccount` across `services/ lib/ lib-new/ lib-v2/ controllers/
routes/ scripts/`, excluding `__tests__`.

**This is NOT a find-and-replace.** At least 3 of the 42 are already correct:

```js
stripe.subscriptions.list(params, { stripeAccount })   // ✓ list takes (params, options)
```

`list` genuinely takes `(params, options)`, so `params` IS the first argument. The judgement per
site is: **is argument one an ID, or is it a params object?**

- **ID first** (`retrieve`, `cancel`, `capture`, `del`, `detach`, `pay`, `finalizeInvoice`,
  `voidInvoice`, `resume`, `listPaymentMethods`, `listLineItems`) → insert `undefined`:
  `retrieve(id, undefined, { stripeAccount })`
- **params first** (`list`, `create`) → **leave alone**

Re-derive the list rather than trusting this one — the regex over-matched once already:

```bash
cd dibs-api && node - <<'EOF'
const fs=require('fs'),path=require('path');
const roots=['services','lib','lib-new','lib-v2','controllers','routes','scripts'];
const M='retrieve|cancel|capture|del|list|listPaymentMethods|detach|pay|finalizeInvoice|voidInvoice|sendInvoice|resume|listLineItems';
const re=new RegExp(String.raw`\.(${M})\(\s*([^,()]+?)\s*,\s*\{\s*stripeAccount`,'g');
const walk=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
 if(e.isDirectory()){if(!/node_modules|__tests__/.test(p))walk(p);}
 else if(e.name.endsWith('.js')){const flat=fs.readFileSync(p,'utf8').replace(/\s+/g,' ');let m;re.lastIndex=0;
   while((m=re.exec(flat))){console.log(`${p}  .${m[1]}(${m[2].slice(0,40)}`);}}}};
roots.forEach(r=>{try{walk(r)}catch(e){}});
EOF
```

### The 42, grouped by money surface

Every one is a money path. Grouped so each group can be swept, then exercised on staging together.

**Mobile card booking (4)** — `services/shared/checkout/class-card/confirm-booking.js`:
`paymentIntents.retrieve`, `.cancel` ×2, `.capture`

**Memberships (8)** — `cancel-membership-immediately.js` ×2, `pause-membership.js`,
`resume-membership.js`, `reactivate-membership.js`, `reconcile-autopay-with-stripe.js`,
`list-client-stripe-subs.js`, `get-client-available-passes.js`
(+ `get-client-available-passes-backup.js`, likely deletable)

**Cards / payment methods (8)** — `remove-card-connected.js`, `studio-admin/remove-card-connected.js`,
`remove-card-matches.js`, `resolve-payment-method.js`, `set-default-card.js`,
`get-stripe-payments-all.js`, `create-user-connected-stripeid.js`, `lib-new/stripe/get-card-details.js`

**Checkout / charges (5)** — `charge-card-new.js` ×2, `charge-connected-account.js`,
`create-payment-intent-new.js`, `retrieve-payment-intent.js` ×2

**Retail + gift cards (5)** — `purchase-gift-card.js` ×2, `checkout-retail-sale.js` ×2,
`purchase-retail-product.js`

**Memberships admin (2)** — `preview-membership-price-change.js` (one `retrieve` to fix, one `list`
to LEAVE), `services/stripe/updateMembership.js` (`list` — LEAVE)

**Scripts (7)** — `bill-unpaid-sessions.js` ×2, `create-test-invoices.js` ×3,
`sync-pass-dates-from-stripe.js`, `reconciliation/fetch-production-invoices.js` (`list` — LEAVE)

---

## Step 3 — standardize on `2026-07-29.dahlia`

Alicia's decision. That is also SDK 22.5.0's own default, so unpinned clients land there anyway;
pinning makes it a choice rather than an inheritance.

Current state — **50 client constructions, five different API versions**:

| Pinned | Sites |
|---|---|
| `2026-02-25.clover` | 1 — `globals/index.js`, the main charge path |
| `2025-06-30.basil` | ~20 |
| `2024-04-10` | 3 — incl. `lib-new/stripe/client.js` |
| none (→ SDK default) | ~25 |

⚠️ **Two things to check before flipping, not after:**

1. **`globals/index.js` moves from `2026-02-25.clover` → `2026-07-29.dahlia`.** That is the client
   behind checkout, the class-card endpoints and most charges. Read the dahlia changelog for
   anything touching PaymentIntent, Charge, Customer or PaymentMethod before moving it.
2. **`lib-new/stripe/client.js` pins `2024-04-10`, and `list-recurring-subscriptions.js` is
   documented as working BECAUSE of that pin.** Moving it to dahlia crosses Basil for that file.
   CLAUDE.md § "when does this membership renew" has the history — that file had three independent
   bugs producing the same empty dashboard section. Verify it against live Stripe after the change,
   not just by reading it.

---

## Step 4 — dead code to delete, not migrate

These use methods removed in later SDKs (`customers.retrieveCard`, `createSource`, `deleteCard`,
`fileUploads.create`). Verified **0 importers** each:

```
lib/stripe/update-portal-user-credit-card.js
lib/stripe/update-studio-credit-card-helper.js
lib/stripe/update-credit-card-helper.js
lib/stripe/update-credit-card-helper-v-four.js
lib/stripe/studio-client.js          (1 importer — check it)
lib/stripe/studio-admin.js           (1 importer — check it)
services/shared/stripe/remove-card-platform.js   (0 importers)
services/shared/get-client-available-passes-backup.js
```

`lib/stripe/client.js` has **11 importers** — that one is live, keep it.

Deleting files is an approval gate per CLAUDE.md. Confirm with Alicia before removing.

---

## Step 5 — staging burn-in, per surface

A mocked suite cannot vouch for any of this. Exercise each surface on staging against the sandbox:

- [ ] **Class card booking** — the 12 scenarios in `DevAssist/Aug12/card-booking-tests.md`
- [ ] **Membership**: enroll → pause → resume → cancel
- [ ] **Card management**: add → set default → remove (verify BOTH Stripe copies detach)
- [ ] **Retail sale** and **gift card purchase**
- [ ] **Invoice**: draft → finalize → pay (studio 263 flow)
- [ ] **Refund** through `charge-connected-account`

Then verify no `parameter_unknown` errors in Railway logs across the run.

---

## Step 6 — then, and only then, the mobile app

Once staging is green:

1. `dibs-mobile-app/.env`:
   ```
   STUDIO_SLUG=everyday-ballet
   EXPO_PUBLIC_API_URL=https://dibs-api-staging-production.up.railway.app/api/v2
   ```
   **Do not delete the API URL line** — `app.config.ts:231` falls back to `studio.json`, which is
   **production** (`api.dibsonline.com`).
2. `npx expo prebuild --clean` — mandatory when `STUDIO_SLUG` changes, per the whitelabel trap in
   CLAUDE.md. Otherwise you get Carlsbad's native shell running Everyday Ballet's config.
3. Nothing Stripe goes in the app's `.env`. The publishable key is fetched from whatever API the app
   points at, so the environment follows `EXPO_PUBLIC_API_URL` automatically.
4. Run on a **real device**, not the simulator — 3DS returning to the app cannot be tested otherwise.
5. Keep `npx expo start`'s terminal open. That is where front-end `console.log` and errors appear;
   there were no app-side logs available this session, which slowed diagnosis.

---

## Still outstanding, unrelated to the SDK

- **`dibs-payment-intent-success`** — created 2026-08-13 in **sandbox**, on the **Connect** tab,
  event `payment_intent.succeeded` only, pointed at
  `https://dibs-api-staging-production.up.railway.app/api/v2/stripe/webhooks/payment-intent`.
  Still to do:
  - Confirm `STRIPE_PAYMENT_INTENT_WEBHOOK_SECRET` is set on the dibs-api **staging** service. The
    controller has no fallback secret and fails loudly without it — deliberately.
  - **Verify delivery with `stripe.webhookEndpoints.list()` once staging is back up.** Mounting a
    handler proves nothing about whether Stripe is sending to it; that is the
    `dibs-connect-subscription` three-month lesson. A test send will fail while staging is 502.
  - **Create the separate LIVE-mode destination before production.** Test and live destinations are
    independent in Stripe — the sandbox one does not carry over — pointed at
    `https://api.dibsonline.com/api/v2/stripe/webhooks/payment-intent`, with its own secret on the
    production service.

  Bookings work without any of this; it is the net that catches a captured payment whose booking
  failed to save.
- **`get-admin-invoice-history.js:57`** — `invoice.charge?.receipt_url` becomes null on modern API
  versions. Cosmetic; `hostedInvoiceUrl` and `invoicePdf` still work.
- **The pass-coverage gate** (`covered_by_pass`) in `create-payment-intent.js` should be RETIRED
  when the app can book with a pass. It exists only because the app cannot yet.

---

## Session mistakes worth not repeating

Recorded because they cost real time here.

1. **Quoting a green test suite as evidence an SDK change was safe.** The suite mocks Stripe and
   could not have seen it. One real call found it immediately.
2. **Leaving a known branch conflict for "when they merge."** The customer-session shim used
   `StripeResource.extend`, which SDK 22 removed, at module load — so merging the two branches
   502'd every route in the API. It was known and not acted on. Fixed: resolution now happens per
   call and tolerates both SDK generations (`services/shared/stripe/customer-session.js`).
3. **`npm install`-ing a different version and only reverting `package.json`.** Left `node_modules`
   at 11.18.0 while the manifest said 22.5.0 — anything run in between tested a version the manifest
   disagreed with. Always re-run `npm install` after reverting a dependency change.
4. **Proposing process instead of doing analysis.** "Pin 25 sites first" was suggested before
   checking whether the codebase already handled the API-version jump. It mostly did.
5. **Suggesting stripe-mock** when a working sandbox already existed.

---

## Addendum 2026-08-13 (second session) — caller-liveness audit

Everything below verified against dibs-api `main` @ `c00fb838` by tracing requires and route mounts,
then grepping dibs-widget-new / new-studio-admin / dibs-mobile-app / dibs-scheduled-jobs for the
endpoints. Purpose: mark which sweep/pin sites are DEAD so Step 2 and Step 3 don't spend effort on
them, and correct two counts above.

### The unpinned-client behavior change, stated precisely

Under SDK 11, a client constructed without `apiVersion` sent **no** `Stripe-Version` header →
account default (ancient). Under 22.5.0, the same client sends **`2026-07-29.dahlia`**
(`stripe.core.js`: `version: props.apiVersion || DEFAULT_API_VERSION`). The SDK does NOT validate
or warn on explicitly-pinned old versions — pinned clients keep their exact wire behavior across
the SDK jump. So the apiVersion risk is confined to the unpinned sites; for pinned sites the only
SDK-jump risk is removed methods / argument parsing (Step 2).

### Unpinned clients in service code — live or dead

| File | Verdict | Evidence |
|---|---|---|
| `services/shared/appointments/create-recurring-appointment-enhanced.js:8` | **LIVE** — pin it | `POST /appointments/recurring/enhanced`, called by dibs-widget-new (`completeAppointmentBooking.js`) AND new-studio-admin (`bookRecurringWithPassAssignments.js`) |
| `services/studio-admin/subscriptions/add-client-to-recurring-subscription.js:10` | **LIVE** — pin it | `POST /studio-admin/add-client-to-recurring-subscription`, called by new-studio-admin (`addClientToRecurringSubscription.js`) |
| `services/shared/stripe/remove-card-connected.js:1` | **DEAD** — 0 importers | The mounted `/stripe/remove-card-connected` route uses `services/shared/stripe/studio-admin/remove-card-connected.js` (global.stripe) instead. Skip in the Step 2 sweep too — its `.detach(id, { stripeAccount })` hit is in dead code. Add to Step 4 delete list. |
| `services/shared/stripe/remove-card-platform.js:1` | **DEAD** — 0 importers | Already on the Step 4 list ✓ |
| `services/studio-admin/update-account-field.js:22` (`require('stripe')(accessToken)`) | **DEAD route** | Mounted at `POST /stripe/update-field`; zero callers in all four consumer repos. Express-account era. |
| `lib/stripe/studio-admin.js`, `lib/stripe/studio-client.js` | **DEAD** — 0 importers each | Corrects the "1 importer — check it" note above: re-grepped with loose patterns, there are none. Safe for the Step 4 delete list (still approval-gated). |
| `diag210.js`, `scripts/generate-stripe-onboarding-link.js`, `create-test-invoices.js`, `generate-billing-report.js`, `invoices.js:1103`, `find-missed-renewals.js:51`, `create-draft-invoices.js:42` | Operator scripts | Not called by any repo; pin opportunistically when standardizing (Step 3). NOTE `scripts/bill-unpaid-sessions.js` is ALREADY pinned (basil, line 143) despite appearing in earlier greps — its line-32 `require('stripe')` is uninstantiated. |

Both LIVE files read only `paymentIntent.id` and `paymentIntent.latest_charge` from
`paymentIntents.create` — both present on dahlia — and their `statement_descriptor_suffix` param is
already exercised in prod by pinned siblings (gift-card / retail / complete-appointment-booking).
So pinning them per Step 3 is low-risk; the params/reads survive dahlia.

### `lib/stripe/client.js` — importer recount + reachable surface

**8 importer files** (corrects "11" above): `connect-standard-account.js`, `test-integration.js`,
`validate-account.js`, `get-account-status.js`, `payouts/get-payouts.js` (orphaned page),
`lib/portal/checkout.js`, `lib/portal/drop.js`, `lib/purchasing/shared/stripe/index.js`.

- The four live services call ONLY `client.stripe.accounts.retrieve` / `paymentIntents.create` /
  `paymentIntents.cancel` — all present in SDK 22. The class constructor pins basil. **Keep = correct.**
- `lib/portal/checkout.js` + `drop.js`: **0 runtime importers** (only referenced in comments as
  "legacy refund writers"). Dead.
- `lib/purchasing/shared/stripe/index.js#subscribeUserToPlan`: **0 callers anywhere in dibs-api**
  (the live NULL-writer twin was dibs-server's, decommissioned ~2026-07-22). Its error path calls
  `cancelSubscriptionPlan` → `this.stripe.subscriptions.del(...)` (`lib/stripe/client.js:574`) —
  `subscriptions.del` is REMOVED in SDK 22 (only `cancel` exists). Unreachable today, but if this
  file is ever resurrected as the widget-enrollment path, the orphan-subscription compensation
  throws `TypeError` and a client keeps billing with no local record. Prefer deleting alongside the
  Step 4 batch, or at minimum swap `.del` → `.cancel` on any resurrection.

### SDK-22 method existence, verified against installed 22.5.0

| Used in repo | v22 status |
|---|---|
| `invoices.del` (`delete-draft-invoice-263.js`) | ✓ exists |
| `oauth.token` / `oauth.deauthorize` (Connect flow) | ✓ exists (special-cased: `this.oauth = new OAuthResource(this)`) |
| `plans.*`, `tokens`, `charges`, `invoiceItems`, `coupons`, `accountLinks` | ✓ exist |
| `subscriptions.del` | ✗ REMOVED — only in `lib/stripe/{client,studio-admin,studio-client}.js` (dead paths, above) |
| `setApiVersion` | ✗ REMOVED — same three files, inside the custom-account create methods (dead since Express/Custom removal 2026-08-06) |
| `fileUploads.*` | ✗ REMOVED (renamed `files`) — same three files, dead paths |

### Step 2 list re-derived on `main` @ `c00fb838`

The script above yields **39 sites** on main (the 42 figure includes
`services/shared/checkout/class-card/confirm-booking.js` ×4, which lives on
`feature/mobile-card-booking` — re-run the script on the merged branch). Of the 39: skip
`services/shared/stripe/remove-card-connected.js` (dead, above);
`get-client-available-passes-backup.js` already flagged deletable;
`reactivate-membership.js` is the retired deploy-buffer service (route still mounted, frontend
action deleted 2026-05-16) — deleting it per its in-file TODO beats sweeping it.

### Live-account version telemetry (Stripe Workbench, checked by Alicia 2026-08-13)

- **The platform account default is `2017-04-06`.** That is the version every unpinned client has
  been riding on under SDK 11. Do NOT press the Dashboard "Upgrade" button on the account default
  until every client construction is explicitly pinned — flipping it would instantly move any
  remaining unpinned caller (including the old Heroku dibs-api-v2 slug and local scripts) across
  nine years of API changes.
- Version usage over the trailing week: essentially **all production traffic is
  `2026-02-25.clover`** (global.stripe). `2025-12-15.clover` (invoice client), `2025-11-17.clover`
  (`services/stripe/stripeClient.js` — the price/product writes from updateMembership), basil ×2,
  and `2024-04-10` are all trace-volume. The `2017-04-06` traffic observed 8/12–8/13 (GET
  payouts / subscriptions / webhook_endpoints, NodeBindings/11.18.0) came from a **residential
  IP** — local operator scripts and session verification, not the Railway deploy. The only
  prod-server unpinned emitters remain the two recurring-booking services (addendum above), which
  simply had no traffic in the window.
- Recent Health errors are 3 low-volume setup_intent failures (`invalid_request_error - customer`,
  `resource_missing - intent`, Aug 7–10) — consistent with the documented publishable-key-roll /
  stale-customer issues, unrelated to the SDK work.
- **When creating the two missing webhook destinations** (`dibs-connect-subscription`,
  `dibs-payment-intent-success`): set their API version explicitly at creation. A Dashboard-created
  endpoint inherits the account default — which is 2017-04-06.

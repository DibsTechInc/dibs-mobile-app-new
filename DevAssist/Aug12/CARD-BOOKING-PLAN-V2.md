# Booking a class with a card, from the app — V2

Status: **contract agreed, not yet built. This file supersedes `CARD-BOOKING-PLAN.md` in this
folder.** Rewritten 2026-08-13 after a line-by-line critique verified against the code and the live
Stripe docs. The core decisions survive: manual capture instead of a holds table, two endpoints,
the Scenario 5 money model, server-side pricing. What changed is everything the critique showed
would bite — each change is named in the next section so the deltas can be reviewed fast.

**Do NOT build the legacy `start-dibs-transactions` rail as a stopgap** — that instruction stands.
**The widget is not part of this** — it is being tested on its own track (Alicia, 2026-08-11).

---

## Decisions changed or made in this revision — Alicia to confirm

1. **A price mismatch now REFUSES the charge instead of charging and alerting.** The 8/11 decision
   was "server compares, charges its own, raises a mismatch alert." The critique's closing question
   exposed the hole: when the server's price is *higher* than what the app displayed, "charge and
   notify" means the client saw $20 and was charged $22 — a chargeback, not a footnote. V2: any
   disagreement at endpoint 1 returns `409 price_changed` with the fresh server-priced breakdown;
   the app re-renders the number and the client confirms it. No PaymentIntent is created, so no
   money can ever move at a figure that was not on screen. The alert still fires on the first
   occurrence (see the alert section). This also gracefully handles the legitimate case — an
   off-peak pricing-rule window expiring between render and tap.
2. **v1 is card-only inside the sheet: `payment_method_types: ['card']`.** The V1 plan enabled
   `automatic_payment_methods` and scoped manual capture to cards, describing that as a feature. It
   is the hole: verified against the docs, `payment_method_options[card][capture_method]=manual`
   holds only *card* payments — Link, Cash App Pay, Klarna, anything else enabled in the Dashboard
   would confirm with **automatic** capture, land on `succeeded`, and endpoint 2 would reject a
   payment that already took money. Card-only closes it. Adding wallets later means deciding the
   capture story for each method, deliberately.
3. **Cards save to the studio's CONNECTED customer, and that is accepted for v1.**
   `setup_future_usage: 'off_session'` + save-enabled in the sheet stores a newly typed card on the
   connected account only. For white-label per-studio apps that per-studio card store matches the
   product, and the widget's merged list does surface connected-account cards for that studio. The
   known cost: multi-studio mode later needs the platform+clone story revisited. Flagged, not
   hidden. (Card *removal* stays disabled in the sheet — see the CustomerSession section for why.)
4. **Partial credit is NOT applied to card bookings in v1.** A client with $10 credit and a $22
   class pays $22 by card and keeps the credit. Credit that FULLY covers the class books through
   the existing credit endpoint and never opens a sheet. This mirrors the widget, where mixed
   card+credit exists only for recurring. Saying it out loud so it is a decision, not an oversight.
5. **A new Connect webhook destination + a sweep script ship WITH the endpoints, not after.** The
   capture-succeeded-then-DB-write-failed window takes money with no booking and nothing today
   would ever notice. This platform just learned `dibs-connect-subscription` sat undelivered for
   three months: webhooks are the fast path, reconciliation is the guarantee. A card-money endpoint
   ships with both. This adds a controller, an env var, and a manual Stripe Dashboard step — named
   in the deploy section. (New webhook destination = approval gate per the standing boundaries.)

---

## Why a new endpoint exists at all

`services/shared/stripe/create-payment-intent-new.js` creates the PaymentIntent with
**`confirm: true`** — the server confirms it. A server-confirmed PI cannot present a 3D Secure
challenge, because the challenge must happen on the client. Any European cardholder, and a growing
share of US ones, would simply be declined with nothing they could do about it.

This is the conclusion recorded as **§7 item 7.8, Option B (Alicia, 2026-07-21)**: the backend
creates the PI *unconfirmed*, hands back a client secret, and the app confirms through the Stripe
SDK so PaymentSheet owns 3DS end to end.

**`services/shared/stripe/create-payment-intent-connected.js` already exists** — mounted at
`/stripe/create-payment-intent-connected`: unconfirmed, connected account, env-aware account id,
`setup_future_usage: 'off_session'`. It does most of endpoint 1's Stripe half, and it carries the
same client-names-the-price hole this plan exists to avoid. **Do not leave two connected-PI
creators to drift.** First step of the build: read it and its callers, then either (a) extract its
account-resolution + PI-creation core into a shared helper both use, or (b) if it has no live
callers, fold endpoint 1 onto it. Document which, and why, in the PR.

---

## The money model: CHECKOUT.md Scenario 5 — a CHOICE, and here is the divergence

A card booking creates a **paid pass** and immediately redeems it. Be honest about what this is:
the closest live analog, `create-payment-intent-new.js`, writes ONE transaction with
`amount_charged` = gross and no pass at all — both shapes exist in production. Scenario 5 is
chosen deliberately because it is what `revenue-attribution.js`'s single-session bucket expects and
what makes the row consistent with pass-based bookings. The PR should say it is diverging from the
admin path's shape, on purpose.

| Table | Operation |
|---|---|
| `passes` | CREATE — the paid pass. `studio_package_id` **must** be populated (hard rule — resolve it the way `create-pass-after-charge.js` does for a single-session purchase, and verify against a real row from a widget single-class card booking before writing code). `totalUses: 1`. **`passValue` = the amount paid for the single use** — it drives credit-back on cancellation; get it wrong and an early drop returns nothing. Mirror the current widget writer's tax treatment exactly. |
| `dibs_transaction` (purchase) | CREATE — `type='pack'`, `for_passid`, `stripe_charge_id` = the PI's `latest_charge`, **`amount_charged` = gross**. `purchasePlace` ≤ 32 chars — use `'mobile-app'` (the column is VARCHAR(32); a longer literal rolls back the whole transaction, the 2026-07-06 lesson). |
| `dibs_transaction` (redemption) | CREATE — `with_passid`, `eventid`, `amount_charged = 0` (correct and deliberate — see the `amount_charged` note in the shared CLAUDE.md; stamping both rows double-counts every naive SUM). |
| `attendees` | CREATE — **`attendeeID = String(REDEMPTION transaction id)`**, `source: 'dibs'`. |
| `event` | reconcile `spots_booked` / `isFull` via `updateEventsSpotsBookedNew` (see capacity). |

**The attendee links to the REDEMPTION row, not the purchase row.** V1 of this plan had it
backwards. Every live writer uses the redemption row (`complete-appointment-booking.js:902`,
`record-booking-with-pass.js`, `add-client-to-attendees`, `create-recurring-appointment-enhanced.js`),
and every reader bridges `Number(attendeeID)` expecting `with_passid` on the other side. The
purchase-row id belongs in the mismatch/ops tooling, where the money is — never on the attendee.

Reuse `services/shared/passes/create-pass-after-charge.js` and the machinery behind
`routes/checkout/record-booking-with-pass.js` (record transaction → deduct pass → add attendee →
update spots → notify). Do not reimplement any of it.

---

## Pricing has exactly ONE owner: `priceClassForClient()`

"Price it server-side" is a build, not a line. Nothing in dibs-api prices a class server-side
today — `create-payment-intent-new.js` takes `costToCharge` and `taxAmount` straight from the body.
Meanwhile the schedule feed the app renders applies **dynamic pricing rules**
(`get-schedule.js:120-146` → `getApplicableDiscountMatcher` / `applyPricingRule` →
`pricing_rule.discounted_price`) on top of `events.price_dibs`, and tax comes off
`dibs_studio_locations.tax_rate`. An endpoint that prices from `price_dibs` + tax and forgets the
rule **overcharges every off-peak class** and fires the mismatch refusal on every single booking.

Deliverable: **`services/shared/pricing/price-class-for-client.js`** — one function that both the
schedule feed and endpoint 1 call. Extract it from the `get-schedule.js` logic; the refactor must
be behavior-preserving (the schedule feed's numbers must not move — pin them with a test against a
studio-88 event that has a pricing rule and one that does not). Its return is the `breakdown`:

```
{ listPriceCents, pricingRuleId | null, discountedPriceCents | null, taxCents, totalCents }
```

That shape is what endpoint 1 returns to the app and what the mismatch comparison runs on. Anything
less and we have built a second pricing brain, which is the thing this plan exists to prevent.

---

## Endpoint 1 — `POST /checkout/class/create-payment-intent`

Mounted with `requireWidgetAuth` (client Firebase project — `dibs-studio-clients`).

**Auth trap, written down so it survives:** `requireWidgetAuth` is
`[isWidgetUserAuthenticated, isRequestingOwnData]`, and the second only compares when
`req.body.userid !== undefined`. These handlers read the id from the verified token
(`req.authenticatedUserId`) and the body carries **no `userid` field at all** — correct today, but
a future dev who adds `userid` to the body silently changes the gate. Never add it.

Request `{ dibsStudioId, eventId, displayedTotalCents }`.

Server, in order:

1. **Studio gates — refuse cleanly, never 500.** Distinct error codes for each: `dibs_studio.live`
   is false; studio 226 (does not collect fees through Dibs — booking-only); trial soft-lockout
   (new bookings blocked — check whether a server-side predicate exists yet per
   `.planning/STUDIO_SUBSCRIPTION_PHASE1_PLAN.md`; if none does, gate on `live` alone and leave a
   named TODO tied to that rollout); no `stripe_account_id` for the current env (a studio with no
   sandbox account must not 500 in dev).
2. Load the event. Reject cancelled, deleted, full, and **already-started — computed against
   `getStudioWallClock`** (`services/shared/time/studio-wall-clock.js`), never `NOW()`: the
   documented trap where every ET evening class reads as already started after 8pm UTC-time.
3. Reject if this client already has a live (non-dropped) attendee row for the event — a double
   booking is a double charge.
4. **Price it with `priceClassForClient()` and compare to `displayedTotalCents`.** On ANY
   disagreement: log the greppable `[PRICE-MISMATCH id=<uuid>]` line, fire the alert (see below),
   and return **`409 price_changed`** carrying the fresh `breakdown`. No PI is created. The app
   re-renders the true price and the client confirms it. The server's figure is the only one that
   can ever reach Stripe, and it is also always the figure on screen at confirm time.
5. Resolve the connected-account customer via `create-user-connected-stripeid.js`.
6. **Clone platform-saved cards down to the connected customer, fail-soft.** The Account tab (P2)
   saves cards on the PLATFORM customer; the sheet lists the CONNECTED customer's payment methods.
   Without this step, a returning client who saved a card in the Account tab opens the sheet and
   sees nothing — the two-tap promise dies. List both sides, dedupe by fingerprint, clone what is
   missing (`paymentMethods.create({ customer, payment_method }, { stripeAccount })`). A failed
   clone must not block the booking (the client can type the card) — catch, log, continue. Known
   caveat from the shared CLAUDE.md: whether a legacy `card_` id works as a clone source is
   unverified; skip-and-log is the correct behavior if it fails.
7. **Create a CustomerSession on the connected account** — not an ephemeral key. Ephemeral keys
   must be minted with the exact API version the mobile SDK expects, and `globals/index.js` pins
   `2026-02-25.clover`; a mismatch means PaymentSheet fails to load. CustomerSession has no version
   pin and gives explicit feature control. Per the verify-before-implementing rule, re-read the
   current RN PaymentSheet docs for the exact `components[mobile_payment_element]` shape at build
   time. Features: `payment_method_save: enabled` (decision 3 above),
   `payment_method_redisplay: enabled`, **`payment_method_remove: disabled`** — a card cloned from
   the platform exists in two places, and a sheet-remove would detach only the connected copy,
   leaving a zombie that still renders in the widget; removal stays in the Account tab, whose
   `/stripe/remove-card` detaches both copies by attribute match.
8. Create the PaymentIntent **unconfirmed**, on the connected account:
   - `amount` = the server's own `totalCents` — never anything derived from the request
   - `currency: 'usd'`
   - **`capture_method: 'manual'`** (top-level — this is the whole capacity design; V1 buried it
     in a later section and an executor building from the numbered list would have shipped
     automatic capture)
   - **`payment_method_types: ['card']`** (decision 2 — no `automatic_payment_methods`)
   - `customer`, `setup_future_usage: 'off_session'`
   - `metadata: { dibs_mobile_booking: '1', userid, dibsStudioId, eventId, pricedTotalCents }` —
     this metadata is **the booking contract endpoint 2 executes**, not decoration. Server-written,
     so endpoint 2 can trust it.

Returns `{ paymentIntentClientSecret, customerSessionClientSecret, customerId, amountCents,
currency, breakdown }`.

## Endpoint 2 — `POST /checkout/class/confirm-booking`

Request `{ dibsStudioId, paymentIntentId }` — **and nothing else.** V1 took `eventId` from the
body while claiming "never trust the client's word that it paid," and the critique showed the
attack: authorize a $12 PI on the 7am class, call confirm with the $45 class's eventId; the PI is
real, the status check passes, the client attends the $45 class for $12. The booking facts —
`userid`, `eventId`, the studio, the amount — come from `pi.metadata`, which the server itself
wrote at endpoint 1. `dibsStudioId` in the body exists ONLY to resolve which connected account to
retrieve the PI from; it is then verified against the metadata like everything else.

1. Resolve the studio's connected account from the body's `dibsStudioId`; retrieve the PI **on that
   account**. Reject unless `metadata.dibs_mobile_booking === '1'`,
   `metadata.userid === req.authenticatedUserId`, and `metadata.dibsStudioId` matches the resolved
   studio. From here on, `eventId` means `metadata.eventId`. A client who lies about the studio
   either fails the retrieve (PI not on that account) or fails the metadata match.
2. **Idempotency + crash repair, keyed on the charge id.** There is no PaymentIntent column on
   `dibs_transactions`, and `stripePaymentId` is already spoken for
   (`link-transactions-to-payout.js:74` joins payouts through it) — and a new column is an
   approval-gated migration this design does not need. A confirmed PI (authorized OR captured)
   carries its charge in `pi.latest_charge`, and the id survives capture unchanged. So:
   `findOne({ stripe_charge_id: pi.latest_charge })` on the purchase transaction.
   - **Found** → this booking already recorded. Walk `for_passid` → redemption row → attendee and
     return the existing booking summary. A retry after a dropped response returns the booking, it
     never books twice.
   - **Not found, PI status `succeeded`** → the crash window: money captured, booking never
     recorded. Repair: record the Scenario 5 rows now WITHOUT re-running the seat gate (the money
     moved; an oversell-by-one is the lesser harm than money-for-nothing), reconcile, alert ops
     that a repair happened.
   - **Not found, PI status `requires_capture`** → fresh booking, continue.
   - Anything else → clean error through `describe-stripe-charge-error.js` semantics.
3. **Take the seat atomically.** See the capacity section — the gate is the ClassPass-style
   conditional UPDATE, not a conditional insert. Gate fails → `paymentIntents.cancel()` → return
   "class just filled". The authorization is released; **no charge ever happened, so there is
   nothing to refund.**
4. **`paymentIntents.capture()`.** If capture itself fails (rare — card died between auth and
   capture): release the seat (decrement the gate / reconcile) and return the decline through
   `describe-stripe-charge-error.js`.
5. Record the Scenario 5 rows, `attendeeID = String(redemption tx id)`, then reconcile
   `spots_booked`/`isFull` via `updateEventsSpotsBookedNew`, then send the client confirmation and
   the ops notification.

Returns the booking summary the app shows on success.

### Capacity: authorize first, capture once the seat is secured

The gap is real — money must not move for a class that filled while the client was paying — but
Stripe already solves it. `capture_method: 'manual'` means confirming in the sheet AUTHORIZES the
card: status `requires_capture`, funds held by the issuer, 3DS runs during authorization exactly as
it otherwise would. Authorizations are valid ~7 days (verified against the live docs 2026-08-11) —
an eternity against the seconds this needs.

**This replaces the `class_spot_holds` design, which was built and then deleted (2026-08-11).**
Manual capture gets the same guarantee with no new table, no migration, no expiry, no sweeper, and
no refunds. **Do not reintroduce a holds table without first explaining what manual capture cannot
do.** One honest caveat stands: a released authorization can briefly show as a pending line on some
bank statements. No money moves; same trade every hotel makes.

**The seat gate (corrected — V1's version was not atomic).** V1 specified
`INSERT … WHERE (SELECT count(*) FROM attendees …) < seats`. Under READ COMMITTED that does not
serialize — rows that don't exist yet can't be locked, so two concurrent bookings both count N and
both insert, and the last seat double-books in exactly the test this plan lists. The gate must be a
lock on something that exists. Use the pattern ClassPass reservations already run in production:

```sql
UPDATE events SET spots_booked = spots_booked + 1
WHERE eventid = :eventId AND canceled = 0 AND deleted = 0 AND spots_booked < seats
```

Row count 1 = seat claimed; 0 = full. The row lock serializes concurrent claimants. **The update is
the lock, not the bookkeeping** — after the attendee row is inserted, `updateEventsSpotsBookedNew`
recounts from attendees and overwrites `spots_booked` with the truth, which is what that function
is actually for. (Known residual: `spots_booked` is a derived cache and can be momentarily stale
between another path's insert and its recount; the gate inherits that same small exposure ClassPass
has today. If the executor finds real staleness in practice, the stricter alternative is
`SELECT … FOR UPDATE` on the event row + live count inside one transaction — but start with the
production-proven pattern.)

**Why `updateEventsSpotsBookedNew` cannot BE the gate (checked 2026-08-13, still true):** it
recounts unconditionally — SELECT every non-dropped attendee, set `spots_booked` to that count. It
neither checks capacity nor reserves anything, and calling it to "take a seat" writes
`spots_booked` past `seats` without complaint. Attendees are the source of truth; `spots_booked` is
cache. Never trust `spots_booked` alone in a capacity *decision*; the gate above is safe only
because a claim that sneaks past it is corrected by the recount and bounded at one.

### The window the tests didn't cover: capture succeeds, the DB write throws

"Kill the app between the sheet and endpoint 2" is the SAFE case — the auth lapses on its own,
nothing captured, no seat consumed. The unsafe window is **inside endpoint 2**: `capture()`
succeeds, the DB write throws, money is gone and nothing sweeps it. The inverse (seat claimed,
capture fails) self-heals — the recount frees the phantom claim and the auth lapses.

Stripe's own docs for this integration say to listen for events rather than waiting on the client.
And this platform's freshest lesson (`dibs-connect-subscription`, undelivered for three months) is:
**webhooks are the fast path, reconciliation is the guarantee — ship both.**

- **New Connect webhook destination `dibs-payment-intent`** → `POST
  /api/v2/stripe/webhooks/payment-intent`, env `STRIPE_PAYMENT_INTENT_WEBHOOK_SECRET`, subscribed
  to **`payment_intent.succeeded` only** (per the discipline: a destination gets only the events
  its controller processes). Handler: if `metadata.dibs_mobile_booking` and no purchase transaction
  with `stripe_charge_id = pi.latest_charge` exists after a short grace period, run the same
  idempotent repair-record as endpoint 2 step 2; on repair failure, alert. Outer catch routes
  through `sendWebhookFailureAlert` like every other webhook controller.
- **Sweep: `scripts/sweep-captured-unbooked.js`** — dry-run default, `--apply` to write. Searches
  the connected account's recent succeeded PIs carrying the metadata marker and verifies each has a
  purchase transaction; repairs or reports. Ships as a script now; promotion to the
  internal-endpoint + thin-cron pattern is a later step if volume warrants.
- **Deploy step, manual, easy to forget:** create the destination in Stripe Dashboard → Webhooks →
  **Connect** tab, set the signing secret env var, and then **verify delivery with
  `stripe.webhookEndpoints.list()`** — mounting the handler proves nothing about whether Stripe is
  delivering to it. That is the exact failure mode of the three-month gap.

Only the card path needs any of this. Pass, credit and free bookings record in one atomic step with
no gap to protect.

---

## Price-mismatch alert (simplified by the refusal design)

Because a mismatch now refuses before any PI exists, the V1 two-phase alert (detect at endpoint 1,
email after endpoint 2 minted ids) is gone — there are never any transaction or attendee ids,
because there is never a booking at the wrong price. One phase, at endpoint 1:

| Field | Where it comes from |
|---|---|
| Amount shown to the customer | `displayedTotalCents` on the request |
| Amount the server priced | `priceClassForClient()`'s `totalCents` |
| Difference, and which way | computed — the sign is the first thing you want to see |
| Full `breakdown` | names whether a pricing rule was involved, which is the likeliest bug |
| Event id, userid, studio | context — enough to find it in the DB |
| Promo id | `null` until promo lands; the field ships now so the template never changes |

**Do not send it through the routine ops mailer alone.** `opsMailService.sendOpsNotification` is
the channel every "Invoice paid" notice uses, and a CRITICAL email once sat unread in that traffic
for three days (July 2026). Route it through the `services/shared/notifications/webhook-alert.js`
pattern: distinct subject, SMS to `ESCALATION_PHONE`, per-event dedupe so a systematic pricing bug
alerts once that night, not once per refused booking. The greppable `[PRICE-MISMATCH id=<uuid>]`
log line is written on every occurrence regardless of dedupe.

---

## App side

### Stripe global state — the part that can silently break the Account tab

`initStripe` is a **global native call — the last init wins app-wide**. `StripeSdkProvider.tsx`
mounts one root provider on the platform key (correct for P2's card saving). Pointing the SDK at
the connected account for booking is therefore not "add a nested provider"; it re-points the
Account tab's platform SetupIntent flow too, silently.

Strategy — one owner, restore-on-exit:

- A single hook (e.g. `useConnectedStripeSession(studio)`) is the only code in the app allowed to
  call `initStripe`. The booking flow calls it to point the SDK at
  `{ publishableKey, stripeAccountId: studio's env-aware account id, urlScheme }` before
  `initPaymentSheet`, and it restores the platform configuration in a `finally` — on success,
  cancel, and error alike.
- Defensively, the Account tab's card flows also init what they need at their own start rather than
  assuming the global state — a crash mid-booking must not leave the next SetupIntent pointed at a
  connected account.
- **`urlScheme` is required for 3DS to return to the app.** The per-studio scheme already exists in
  `app.config.ts` (e.g. `dibs-carlsbad-village-yoga`) — read it from `Constants.expoConfig` at
  runtime, never hardcode. No new native config is needed, but remember the standing whitelabel
  trap: anything that does touch native identity requires `npx expo prebuild --clean` per studio.

### Flow, in as few steps as the money allows

1. Row's **Book** button → if a pass covers it, or credit FULLY covers it, book with the existing
   endpoints and never open a sheet. **One tap.** (Partial credit: decision 4 — not applied in v1.)
2. Otherwise the app shows the price it computed, calls endpoint 1, `initPaymentSheet` (PI client
   secret + CustomerSession client secret), `presentPaymentSheet`. A returning client sees their
   saved card already selected and confirms — **two taps.**
3. On `409 price_changed`: re-render the returned breakdown, let the client confirm the fresh
   number, retry endpoint 1. Not an error state — copy should read as "the price updated," because
   that is what happened.
4. On sheet success call endpoint 2, then invalidate the schedule and my-calendar queries.
5. `Canceled` from the sheet is a decision, not an error — say nothing, exactly as `useCardActions`
   already does for card entry.
6. On endpoint 2's "class just filled": say so plainly. Nothing was charged, and the copy can say
   that too.

New bookings write **`source: 'dibs'`** (the rebuild convention — never `'zf'`).

---

## What must be verified, not assumed

Test cards, on sandbox studio 88 (`acct_1U1fXzQTOTKua6cH` in `stripe_account_id_test`; userid 2502
holds two live passes there, so the pass path and the card path are testable on one account):

- `4242424242424242` — plain success, two-tap flow end to end.
- `4000002500003155` — **forces 3DS.** The challenge must present, complete, and return to the app
  via the url scheme. If this cannot complete, the entire reason for the new endpoint has not been
  delivered.
- `4000000000009995` — decline. The message must come through `describe-stripe-charge-error.js`;
  a raw Stripe error on the wire dumps the whole failed PaymentIntent at the client.

Concurrency and crash:

- Fill the last seat from a second device while the first is mid-payment. The loser sees "just
  filled," and Stripe shows that PI **canceled with zero captured — no refund object anywhere.**
  (V1's test list said "one is refunded" — leftover from the holds draft; if a refund object ever
  appears in this flow, the design has been violated.)
- Two devices confirm the true last seat within the same second — exactly one attendee row exists
  after both settle. This is the test the V1 conditional-insert would have failed.
- Kill the app between sheet success and endpoint 2; reopen, retry → exactly one booking, one
  charge (idempotency via `latest_charge`).
- Force-quit between authorizing and confirming → auth lapses on its own; nothing captured, no
  seat consumed, and the recount frees any phantom claim.
- Simulate the DB write throwing AFTER `capture()` → the webhook handler (or the sweep in dry-run)
  finds and repairs it, and the repair is idempotent when both run.

Contract attacks:

- Authorize a PI for a cheap class, call endpoint 2 with a different studio / with a `userid` added
  to the body / after tampering nothing else — booking facts must come from metadata, the userid
  from the token, and each mismatch must reject.
- Call endpoint 1 with a stale `displayedTotalCents` → `409 price_changed`, alert fired once,
  deduped on the second occurrence.
- A pricing-rule (off-peak) class prices identically on the schedule feed and at endpoint 1 —
  the one-owner test for `priceClassForClient()`.

Gates:

- Studio 226, a non-`live` studio, and a studio with no env-appropriate Stripe account each refuse
  with their distinct code, no 500s.
- An ET studio's 6:30 PM class is still bookable at 6:00 PM ET after 8 PM UTC (the
  `getStudioWallClock` test).

---

## Executor guardrails

- **Split every claim into VERIFIED (file read, test run, flow executed) and INFERRED**, and aim
  critique at the inferences. No "the flow works" without having run it once, for real.
- **Answer both, out loud, at the end:** what did this change make unreachable, and what did it
  make REACHABLE for the first time — and what runs it now? Walk one full request through every
  file that newly receives a value, down to the DB write.
- Grep for each trap class in the repo the request LANDS in (dibs-api), not just the app.
- Tests runnable with `npm test` (dibs-api Jest, `services/**/__tests__/` pattern) and
  `npm run typecheck && npx jest` in the app. Golden-master pricing tests for
  `priceClassForClient()` are the canary — pin real numbers from studio 88.
- Branches: dibs-api `feature/mobile-card-booking`; app `feature/card-booking`. Commit locally,
  never push.
- **Doc back-flow (blocking):** this file is a working artifact. On shipping, update `CHECKOUT.md`
  (the new card-booking scenario + the metadata contract), the shared `CLAUDE.md` (the new webhook
  destination row in the destinations table; the `priceClassForClient` one-owner rule), and
  `MOBILE_MASTER_PLAN.md` §7.8. A plan doc is not a substitute for the canonical docs.
- **Approval gates before build:** the two new endpoints and the webhook destination are already
  named here, but per the standing boundaries anything touching billing/payment logic gets
  Alicia's explicit go-ahead on this plan — including the five changed decisions at the top.

---

## Appendix: promo codes — what is actually wrong on the widget (checked 2026-08-11, unchanged)

**Promo codes are OUT of v1** (Alicia, 2026-08-11): get card booking working first. Adding a
`promoCode` parameter later changes `priceClassForClient()`, not the contract.

The master plan lists three widget promo problems; two are already fixed (`atStudioLimit` read with
tests; `applyPromoCode.js` handles `PERCENT_OFF` and `FIXED_PRICE`). The real one is not about
promo codes: `services/shared/stripe/charge-card.js:218` charges `amount: req.body?.total` — the
server bills whatever number the browser hands it. That is a widget/backend fix on its own track.
It matters here only as the cautionary shape: this endpoint takes an event id and works out the
money itself, so the app is never in a position to name its own price. Retrofitting that later is
how the current hole happened.

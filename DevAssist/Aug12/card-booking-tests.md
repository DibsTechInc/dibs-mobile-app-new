# Booking a class with a card, from the app — Test Plan

Covers `CARD-BOOKING-PLAN-V2.md` as built on `dibs-api@feature/mobile-card-booking` and
`dibs-mobile-app@feature/card-booking`, 2026-08-13.

**Test account:** sandbox studio 88 (`acct_1U1fXzQTOTKua6cH` in `stripe_account_id_test`).
userid 2502 holds two live passes there, so the pass path and the card path are testable on one
account. Staging API: `dibs-api-staging-production.up.railway.app`.

---

## Automated — written and passing

### dibs-api (`npx jest`, from `dibs-api/`)

| Suite | Count | Covers |
|---|---|---|
| `services/shared/pricing/__tests__/price-class-for-client.test.js` | 17 | Golden master: list price + percentage tax in cents, percentage and flat rules applied BEFORE tax, discount capped at the price, missing/zero tax rate, explicit rate override, free vs. unpriced, the wall-clock read the rule matcher gets, Sequelize instance vs. plain row, studio toggle off |
| `services/shared/checkout/class-card/__tests__/booking-contract.test.js` | 6 | Metadata written as strings and round-tripped; a widget PI is never claimed; unparseable ids come back null, not NaN |
| `…/gates.test.js` | 25 | Sandbox vs. live account column; `live: false` refused but `live: null` allowed; 226 refused; no account for this env refused cleanly (never a 500); unknown studio 404; bad ids rejected without a DB call; canceled/deleted; **already-started measured against `getStudioWallClock`**; repair path skips that check; duplicate booking refused; dropped attendee ignored; full class refused; unusable capacity columns do NOT refuse; cross-studio event id cannot resolve |
| `…/claim-event-seat.test.js` | 6 | The capacity condition is INSIDE the UPDATE; increment/decrement literals; NULL-safe canceled/deleted; release never throws |
| `…/record-class-card-booking.test.js` | 13 | Pass + purchase + redemption + attendee + recount; `totalUses: 1`; **`passValue` is PRE-tax**; package resolution delegated; gross on the purchase row only; **attendee links to the REDEMPTION row**; the use consumed without `deduct-pass`; `purchasePlace` fits the column; `type='class'`; idempotent replay; notification shape; a failed redemption write does not leave a half-booking |
| `…/confirm-booking.test.js` | 21 | Seat claimed BEFORE capture before record; capture on the connected account; **body `eventId`/`userid` ignored — the cheap-authorization attack**; wrong user / wrong studio / not-ours PI rejected; a PI on another account reads as not-found; idempotent replay; `succeeded` repair skips the seat gate; seat lost → cancel + `nothingCharged` + **no capture, so nothing to refund**; class cancelled mid-payment → cancel; capture failure → seat released + described decline, no raw Stripe error on the wire; every non-`requires_capture` status; authorized-with-no-charge-id refused; captured-then-write-threw releases the seat and says the payment went through |
| `…/create-payment-intent.test.js` | 21 | **Unconfirmed, `capture_method: 'manual'`, `payment_method_types: ['card']`, no `automatic_payment_methods`**; server's amount; the booking contract in metadata; userid from the token even when the body names one; both client secrets + connected account returned; **409 `price_changed` creates NO PaymentIntent**; mismatch alert fired; missing/NaN/null `displayedTotalCents` treated as a mismatch; free and unpriced refused; studio and event refusals pass through before any Stripe call; connected-customer failure; card mirroring — clone, fingerprint dedupe, legacy `card_` accepted, fail-soft both ways |
| `controllers/webhooks/__tests__/stripe-payment-intent-webhook.test.js` | 10 | No secret → 500; bad signature → 400; unhandled type acked; **widget payment acked untouched**; already-recorded acked; grace window returns 500 so Stripe retries rather than racing the endpoint; repair after the window; alert fires even though it self-healed; no charge id skipped; repair failure 500s and names the sweep |

### dibs-mobile-app (`npx jest`)

| Suite | Count | Covers |
|---|---|---|
| `src/domain/pricing/__tests__/class-charge.test.ts` | 15 | The same studio-88 numbers as the server's golden master — **a failure here is a cross-repo drift alarm**; discounted price taken from the backend, never re-derived; tax on the discounted price; label formats (price drops cents, charged totals never do); free vs. unknown; `free_class` checked first; server-breakdown adoption after `price_changed` |
| `src/api/__tests__/class-booking.test.ts` | 8 | Both secrets + connected account parsed; **request body carries NO `userid`**; `price_changed` lifted into a refusal carrying the breakdown; the server's sentence survives; a genuine 500 stays an ordinary retriable `ApiError`; confirm sends only studio + PI id; `class_full` carries `nothingCharged`; a decline arrives described; a replayed booking reads as success |

Full-suite state at time of writing: dibs-api **2146 passed**, and the 21 failing suites are
**pre-existing on `main`** (verified by running both trees — `Sequelize is not a constructor`, an
environment issue, no new failures introduced). App: **705 passed, 24 suites, typecheck and eslint
clean.**

---

## Manual — REQUIRED before this is enabled for real clients

The app's jest project is Node-only (`src/domain`, `src/theme`, `src/api`, `whitelabel`), so
`useBookClass`, `stripeSession` and `ClassDetailScreen` have **no automated coverage** and the
whole PaymentSheet leg is unexercised. Nothing below can be inferred from a green suite.

### 1. Two-tap happy path — `4242424242424242`

**Steps:** signed-in client with a saved card → schedule → a $22 class at studio 88 → the price
card shows Drop in / Tax / **Total** → tap **Book · $23.82** → the sheet opens with the saved card
already selected → pay.

- [ ] The button carried the TOTAL, and it matched what was charged
- [ ] The saved card appeared already selected (this is the CustomerSession working)
- [ ] Booking confirmed; the class appears in My Calendar
- [ ] Stripe: ONE PaymentIntent, `succeeded`, amount 2382, metadata carries
      `dibs_mobile_booking=1` + the right event/user/studio
- [ ] DB: pass (`totalUses` 1, `usesCount` 1, `passValue` **22.00** — the PRE-tax figure),
      purchase transaction (`type='pack'`, `amount_charged` **23.82**, `purchasePlace='mobile-app'`),
      redemption transaction (`type='class'`, `with_passid`, `amount_charged` **0**), attendee whose
      `attendeeID` = the **redemption** transaction id, `source='dibs'`
- [ ] `events.spots_booked` incremented by exactly one
- [ ] Client confirmation email + ops email both fired

### 2. 3DS — `4000002500003155` ⚠️ the reason this endpoint pair exists

- [ ] The challenge presents inside the sheet
- [ ] Completing it RETURNS TO THE APP (this is the `urlScheme` fix — the old
      `${studio.slug}://` was a scheme nothing on the device handles)
- [ ] The booking completes exactly as scenario 1

**If this cannot complete, the entire reason for the new endpoint has not been delivered.**

### 3. Decline — `4000000000009995`

- [ ] The message is a sentence ("The Visa card ending in 9995 was declined — …"), not a wall of JSON
- [ ] Nothing was booked; `spots_booked` is unchanged (the claimed seat was released)
- [ ] The client can try again from the same screen — no dead end

### 4. Concurrency — the last seat

**Steps:** a class with ONE seat left. Device A opens the sheet and holds. Device B books and
completes. Device A then pays.

- [ ] A sees "That class just filled up. Your card was not charged."
- [ ] Stripe shows A's PaymentIntent **`canceled` with zero captured — and NO refund object
      anywhere.** If a refund appears, the design has been violated
- [ ] Exactly one attendee row exists

### 5. Concurrency — two devices confirm the true last seat within the same second

- [ ] Exactly one attendee row after both settle (this is the test a conditional INSERT would fail)
- [ ] The loser gets the "just filled" copy, not an error

### 6. Crash and retry

- [ ] Kill the app between sheet success and confirm; reopen and retry → **exactly one booking,
      one charge** (idempotency on `latest_charge`)
- [ ] Force-quit between authorizing and confirming, then leave it → the authorization lapses on
      its own, nothing captured, no seat consumed

### 7. The dangerous window — captured, then the write throws

Simulate by making `recordClassCardBooking` throw after capture (a temporary throw, or a DB
disconnect).

- [ ] The client is told their payment went through and the studio has been notified — never
      "booking failed"
- [ ] `node scripts/sweep-captured-unbooked.js --target staging` (dry-run) FINDS it
- [ ] `--apply` repairs it, and the rows match scenario 1's
- [ ] With the webhook destination live, it repairs itself within a minute and alerts
- [ ] Running the sweep afterwards is a no-op (both paths idempotent)

### 8. Price mismatch

- [ ] Change `price_dibs` (or toggle a pricing rule) between the schedule load and the tap →
      `409 price_changed`, the card re-renders with the SERVER's figure, the button reads
      **Confirm · $X**, and confirming books at the new price
- [ ] The copy reads as news ("the price updated"), not as an error
- [ ] The alert fires ONCE and is deduped on the second attempt for the same class
- [ ] No PaymentIntent exists in Stripe for the refused attempt

### 9. Pricing parity — the one-owner test

- [ ] An off-peak (pricing-rule) class prices **identically** on the schedule feed and at
      endpoint 1 — same discounted subtotal, same tax, same total
- [ ] A class with no rule likewise

### 10. Gates — each with its own message, none a 500

- [ ] Studio 226 → "takes payment in person"
- [ ] A non-`live` studio → "not taking bookings right now"
- [ ] A studio with no `stripe_account_id_test` → "not set up to take card payments yet"
- [ ] A class the client is already booked into → "You're already booked into this class"
- [ ] **An ET studio's 6:30 PM class is still bookable at 6:00 PM ET after 8 PM UTC**
      (the `getStudioWallClock` test — the trap that empties Upcoming Sessions every evening)

### 11. You already own this — the `covered_by_pass` refusal

userid 2502 holds two live passes at studio 88, so this is testable on the same account.

- [ ] A client holding a **public** pass with uses left taps Book on a class → refused with a
      calm, non-red sentence naming the package, the CTA comes down, and **no PaymentIntent is
      created in Stripe**
- [ ] The same client on a class with `can_apply_pass = false` → the card booking proceeds normally
- [ ] A client whose ONLY pass is a **private** appointment pack → the card booking proceeds
      normally (this is the check that the refusal is not a dead end)
- [ ] An unlimited membership holder → refused, message names the membership

### 12. Stripe global state — the Account tab must survive booking

- [ ] Book a class, then immediately add a card in Account → the SetupIntent still works
      (the platform configuration was restored)
- [ ] Cancel out of a booking sheet, then add a card → same
- [ ] Force an error mid-booking, then add a card → same

**This is the check nothing automated covers.** `initStripe` is global native state and the last
init wins app-wide; a leaked connected-account configuration 400s every Elements call on the
platform account.

---

## Deploy checklist

1. Deploy dibs-api.
2. **Create the `dibs-payment-intent` destination** — Stripe Dashboard → Webhooks → **Connect**
   tab (NOT the platform tab) → `https://api.dibsonline.com/api/v2/stripe/webhooks/payment-intent`,
   subscribed to **`payment_intent.succeeded` ONLY**.
3. Set `STRIPE_PAYMENT_INTENT_WEBHOOK_SECRET` on the dibs-api service.
4. **Verify delivery with `stripe.webhookEndpoints.list()`** — mounting the handler proves nothing.
   This is the exact failure mode of the `dibs-connect-subscription` three-month gap.
5. Set the alert threshold on the destination to ~5% so a secret/route mismatch surfaces in hours.
6. Confirm `ESCALATION_PHONE` is set (the price-mismatch and repair alerts SMS it).
7. Run `node scripts/sweep-captured-unbooked.js --target prod` (dry-run) once after the first live
   booking, as a delivery check that does not depend on Stripe calling us.

---

## Known gaps, stated rather than hidden

- **Pass- and credit-covered bookings are not wired in the app** (P3 items 1–3). Until they are,
  endpoint 1 REFUSES with `covered_by_pass` when the client holds a pass that would cover the class
  (Alicia, 2026-08-13), so nobody can be charged for something they already own. **Retire that gate
  when the pass path ships.** Credit is not covered by it: a client with partial credit pays the
  full amount by card and keeps the credit, which is the documented v1 decision.
- **Trial soft-lockout has no server-side predicate** (checked 2026-08-13). The studio gate keys on
  `dibs_studio.live` alone, with a named TODO in `gates.js` tied to
  `.planning/STUDIO_SUBSCRIPTION_PHASE1_PLAN.md`.
- **`stripe.customerSessions` does not exist in the pinned SDK (stripe-node 11.18.0)**, so
  `services/shared/stripe/customer-session.js` calls the endpoint through
  `Stripe.StripeResource.extend` — stripe-node's own escape hatch. Delete that file and call the
  resource directly when the SDK is upgraded. **The CustomerSession HTTP call itself is unexercised
  by any test** (mocked everywhere); scenario 1's "saved card already selected" is what proves it.
- **Whether a legacy `card_…` id works as a CLONE SOURCE is undocumented by Stripe and unobserved.**
  The mirroring step skips and logs if it fails, which is the correct behaviour; the client can
  still type their card.

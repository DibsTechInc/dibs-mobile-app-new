# Studio credit as a payment path, and membership enrollment — build plan

Approved by Alicia 2026-08-14. Written after reading the existing services, so the next session
starts from findings rather than from a search.

---

## STATUS — read this first

| Section | State |
|---|---|
| **1. Studio credit** | **Backend BUILT and tested.** App side NOT started. See "What is already done" below. |
| **2. Membership enrollment** | Not started. Plan below is current. |
| **3. Cancelling a session** | Not started. Investigated; findings below are current. |

### What is already done on credit (dibs-api, 2026-08-14)

All of this exists — **do not rebuild it**:

- `services/shared/checkout/class-credit/resolve-credit-split.js` — the single owner of the split.
  10 tests.
- `services/shared/checkout/class-credit/claim-credit.js` — the atomic balance claim. 10 tests.
- `services/shared/checkout/class-credit/read-credit-balance.js`
- `services/shared/checkout/class-credit/book-with-credit.js` — the credit-only endpoint, mounted
  at `POST /checkout/class/book-with-credit` (`requireWidgetAuth`).
- `class-card/create-payment-intent.js` — resolves the split, sizes the PI to the remainder,
  writes `creditAppliedCents` to the metadata, refuses `credit_covers_class` and `credit_changed`.
- `class-card/confirm-booking.js` — claims the credit after the seat and before capture, releases
  it on every failure path.
- `class-card/record-class-card-booking.js` — writes the split onto the rows and the ledger.
- `class-card/booking-contract.js` — carries `creditAppliedCents`; reads pre-credit PIs as 0.
- `services/shared/passes/create-pass-after-charge.js` — new `creditAlreadyClaimed` opt-out.

**Still to do:**

1. **The app side, all of it.** A credit toggle (default ON), the "$12.50 credit · $28.26 card"
   line in the checkout summary, routing the credit-only case to `book-with-credit`, and handling
   the `credit_changed` refusal as a re-render rather than an error.
   `src/domain/payments/checkout-method.ts` already has the slot — it deliberately says nothing
   about credit today because there was no credit path to describe.
2. **Endpoint tests for `book-with-credit`.** The pure helpers under it are covered; the
   orchestration (seat-then-credit ordering, both release paths) is not.
3. **Verification caveat.** dibs-api HEAD moved during the session this was written in
   (`62ce505b` → `76498bd0`), so the "21 pre-existing failing suites" baseline is stale. Those
   suites need a live DB and are genuinely flaky — two consecutive full runs gave 96 and 97
   failures on identical code. Verify by running the suites that cover the files you touch, not by
   diffing the full-run count.

---

## 1. Studio credit for a class booking

### Do NOT reuse `services/shared/checkout-credit-only.js`

It is the widget's legacy path and it carries two problems the mobile endpoints exist to avoid.

**It takes the PRICE from the request body.** `const { amountToCharge } = howtopay` — the client
tells the server what the class costs, and the server deducts that much credit. This is the same
hole as `charge-card.js:218` billing `req.body.total`, and it is exactly what
`priceClassForClient()` was created to close. The mobile credit path must price the class itself,
like `class-card` and `class-pass` already do.

It does guard the balance (`if (creditAvailable < creditApplied) return 0`), so it cannot overspend
— but a client could under-report the price and book a $40 class for $5 of credit.

**The balance decrement is read-then-write, not atomic.** It reads `credit.credit`, computes
`creditAvailable - credittochargeshortened` in JS, and writes the result back. That is the shape
this platform's own docs warn about for seats and pass uses: *"The read-then-write shape is how a
ten-class pack gets spent eleven times."* Two devices booking at once both read $40 and both write
$0, so $40 of credit buys $80 of classes.

Note also that `services/actions/deduct-credit-new.js` does **not** decrement the balance at all —
it writes the `credit_transaction` ledger row and flips `dibs_transaction.status`, taking
`beforecredit`/`aftercredit` as arguments. The caller owns the decrement. Any new path must not
assume that helper protects the balance.

### The shape to build

`POST /checkout/class/book-with-credit` — sibling of `book-with-pass`, in
`services/shared/checkout/class-credit/`. One call, no PaymentSheet.

1. Identity from the verified token. **No `userid` in the body** — same `requireWidgetAuth` trap
   the other two endpoints carry.
2. `resolveChargeableStudio` + `resolveBookableEvent` (with `allowDuplicate`) — the same gates, so
   capacity, cancellation, already-started and duplicate behave identically across all three
   payment paths.
3. `priceClassForClient()` for the amount. Verify `displayedTotalCents` and refuse
   `409 price_changed` on disagreement, exactly as the card path does.
4. Refuse `covered_by_pass` — a pass is already paid for and should be spent before credit is.
5. **Claim in this order, each atomically, each released on failure:**
   - the seat (`claimEventSeat`, existing)
   - the credit — a NEW `claim-credit.js`, modelled on `claim-pass-use.js`:
     `UPDATE credits SET credit = credit - :amount WHERE id = :id AND credit >= :amount`.
     The conditional UPDATE is the lock; a JS comparison is not.
6. Rows: `dibs_transaction` (type `class`, `credits` = amount applied, **`amount_charged` = 0** —
   the dollar was counted when the credit was bought; see the `amount_charged` bullet in the shared
   CLAUDE.md), `credit_transaction` via the existing `deduct-credit-new.js`, `attendees` bridged by
   `attendeeID = String(transaction id)`, then `updateEventsSpotsBookedNew`.
   `calculatePaidComped.js` splits paid vs comped credit portions — reuse it, do not re-derive.

> **The rest of section 1 is the DESIGN, and it describes what was built.** Read it to understand
> why the pieces are shaped as they are before changing any of them — particularly the claim
> ordering and the two double-deduction traps. It is no longer a to-do list.

### v1 includes PARTIAL credit (Alicia, 2026-08-14)

$12.50 of credit against a $40.76 class means $12.50 off the balance and **$28.26 on the card**.
This is a deliberate step past what the widget does for single classes, so the app is ahead of the
web here rather than behind it; the numbers still agree because both derive from
`priceClassForClient`.

**Two paths, because Stripe rejects a $0 PaymentIntent:**

| Credit covers… | Path | Shape |
|---|---|---|
| the whole total | `POST /checkout/class/book-with-credit` | one call, no sheet |
| part of it | the existing two-call card flow, with a credit split | sheet charges the remainder |

#### When the credit is claimed — at CONFIRM, never at PI creation

Claiming at PI-creation time takes the money before the client has completed the sheet, and there
is no reliable moment to give it back if they dismiss it, background the app, or lose signal. The
balance would sit short with nothing to release it.

So the split is *decided* at endpoint 1 and *taken* at endpoint 2, which is the same shape the
capture design already uses for the seat:

1. **`create-payment-intent`** prices the class, reads the live balance, decides how much credit
   applies, creates the PI for `total − creditApplied`, and writes `creditAppliedCents` into the
   PI **metadata** (server-written, like every other booking fact — see `booking-contract.js`).
   Nothing is deducted.
2. Client authorizes the remainder in the sheet.
3. **`confirm-booking`** claims the seat → claims the credit atomically for the metadata amount →
   captures → writes rows. A credit claim that fails (spent on another device in between) releases
   the seat, cancels the PI, and refuses with the fresh split so the app re-renders. **Nothing is
   captured before the credit is secured**, so the client can never be charged the discounted
   remainder without having actually received the discount.

#### The app never names the split

Same rule as the price. The app sends `displayedTotalCents` (full class price) **and**
`displayedCreditCents` (what it showed as being applied); the server recomputes both from the live
balance and refuses `409 credit_changed` with the fresh figures if either disagrees. A balance
spent elsewhere between screens therefore re-renders rather than silently charging a different
number — the `price_changed` pattern, applied to the second funding source.

#### ⚠️ `createPassAfterCharge` already deducts credit, and it must not do it twice

`services/shared/passes/create-pass-after-charge.js:539` calls `services/actions/deduct-credit.js`
whenever `calculatedAmounts.studio_credits_spent > 0` — and that helper **decrements the balance
itself**, read-then-write (`findOne`, then `credit: roundToN(creditamount - creditUsed, 2)`).

So passing `studio_credits_spent` naively, after the atomic claim, deducts the money a second time.
The fix is an explicit opt-out: **`creditAlreadyClaimed: true`** on `createPassAfterCharge`, which
skips its internal deduction while still writing the transaction columns
(`studio_credits_spent`, `amount`, `amount_charged`) from `calculatedAmounts`. The caller then
writes the `credit_transaction` ledger row itself via `deduct-credit-new.js`, using the
before/after figures the atomic claim returned.

Not fixed here, and worth knowing: `deduct-credit.js`'s read-then-write race is live on every
existing credit path (widget class checkout, package purchases). Routing around it is in scope;
changing it is not — it would alter widget behaviour and belongs in its own pass.

#### The rows

One booking, Scenario 5 shape, unchanged except for the money columns:

- `passes` — the paid pass. **`passValue` stays the FULL pre-tax subtotal.** The client paid full
  value; it merely came from two sources, and an early drop returns a class, not a part-class.
- `dibs_transaction` PURCHASE — `amount` = full total, `studio_credits_spent` = credit applied,
  **`amount_charged` = the CARD portion only** (the documented meaning: gross Stripe charge
  attributable to this row). The credit half contributes $0 to lifetime volume because that dollar
  was already counted when the credit was bought.
- `dibs_transaction` REDEMPTION — `amount_charged` 0, as today.
- `credit_transaction` — the ledger row, referencing the PURCHASE transaction.
- `attendees` — bridged to the REDEMPTION row, as today.

If the ledger write fails after a successful claim the balance is correct but unexplained, so that
path logs loudly and ops-alerts. It must never unwind the booking: the class is paid for and on the
roster.

### App side

`describeCheckoutPayment` in `src/domain/payments/checkout-method.ts` already has the slot — credit
was deliberately left out of it because there was no credit path to describe. Adding one means a
`kind: 'credit'` branch plus the balance in the checkout summary.

---

## 2. Membership enrollment

`services/shared/checkout/enroll-membership.js` already exists and already handles enrollment WITH
credit (studio-admin, shipped; "Phase 1 of credit-on-memberships — cycle 1 only"). Read it before
writing anything: the mobile endpoint should be a thin authenticated wrapper over the same service,
not a second enrollment brain.

Rules that must hold, all from the shared CLAUDE.md § Memberships:

- **`dibs_user_autopay_packages.dibs_studio_id` MUST be set.** NULL rows are invisible to
  `list-client-stripe-subs.js` and surface as phantom "Stripe-only" memberships. Two writers
  already leaked this; a third would be the fourth.
- **Attach the studio's TaxRate** as `default_tax_rates` via `get-or-create-tax-rate.js`. The
  membership price is PRE-tax (Option B, 2026-08-10). Fail-soft: a sub without tax plus an ops
  alert, never a blocked enrollment.
- **Resolution order for the price is `stripe_price_id_recurring || stripe_plan_id`**, and on prod
  `stripe_plan_id` is the only populated column on every real membership.
- **Block duplicate active enrollments** at the entry point.
- `front_desk_only` must be honoured — that is the flag deciding whether it appears in the app at
  all.
- Commitment terms (`commitment_period`) belong on the card BEFORE enrolling. `build-packages.ts`
  already computes `commitmentLabel`; the app currently renders it and then refuses to sell.

The app change is small once the endpoint exists: `build-packages.ts` sets `isPurchasable: false`
for every membership with the copy "Memberships are set up with the studio directly." That becomes
conditional on `front_desk_only`.

---

## 3. Cancelling a session (not yet approved as a design, but investigated)

`POST /drop-event` → `services/shared/drop-event/drop-event-service.js` **trusts `earlyDrop` from
the request body**: line 110, `if (earlyDrop && !isUnpaid) { returnPassUse(...) }`. The controller
destructures it straight off `req.body` and the route has no auth middleware. So a late drop sent
with `earlyDrop: true` returns the pass use. It is the decision, not a hint.

The newer siblings do it correctly — `drop-event-service-new.js` and `drop-client-from-event.js`
both route through `resolve-return-mode.js`, which documents "every input read from the DB, never
the request body". The legacy path was never migrated.

So the mobile endpoint computes early/late server-side from `getStudioWallClock` and the studio's
window, ignores any flag in the body, and delegates to the existing drop machinery. Pointing the
widget at the same route later would close it there too.

# Booking a class with a card, from the app

Status: **contract agreed, not yet built.** Written 2026-08-11 after Alicia asked for the card path
rather than a pass-only Book button. Verified against the live Stripe Connect direct-charges docs
(React Native) the same day — every parameter named below was checked, not remembered.

---

## Why a new endpoint exists at all

The app cannot reuse what is already there.

`services/shared/stripe/create-payment-intent-new.js` creates the PaymentIntent with
**`confirm: true`** — the server confirms it. A server-confirmed PI cannot present a 3D Secure
challenge, because the challenge has to happen on the client. Any European cardholder, and a
growing share of US ones, would simply be declined with nothing they could do about it.

This is the same conclusion recorded as **§7 item 7.8, Option B (Alicia, 2026-07-21)**: the backend
creates the PI *unconfirmed*, hands back a client secret, and the app confirms through the Stripe
SDK so PaymentSheet owns 3DS end to end.

**The widget is not part of this.** §7.8 imagined the widget moving onto the same endpoints first,
so they would be production-proven before the app used them. Dropped (Alicia, 2026-08-11): the
widget is being tested on its own track and merging the two is not a today problem. This endpoint
is the app's, and nothing in it assumes the widget ever adopts it.

**Do NOT build the legacy `start-dibs-transactions` rail as a stopgap** — that instruction stands.

---

## The money model: CHECKOUT.md Scenario 5

A card booking creates a **paid pass** and immediately redeems it. That is the platform's intended
shape for a single-session class purchase, and it is what makes the row consistent with every other
way a class gets booked.

| Table | Operation |
|---|---|
| `passes` | CREATE — the paid pass, `amount_charged` set on its purchase transaction |
| `dibs_transaction` (purchase) | CREATE — `type='pack'`, `for_passid`, `stripe_charge_id`, **`amount_charged` = gross** |
| `dibs_transaction` (redemption) | CREATE — `with_passid`, `eventid`, `amount_charged = 0` |
| `attendees` | CREATE — `attendeeID = String(purchase transaction id)`, **`source: 'dibs'`** |
| `event` | UPDATE — `spots_booked++`, `isFull` when it reaches `seats` |

`amount_charged = 0` on the redemption row is **correct and deliberate** — see the `amount_charged`
note in the shared `CLAUDE.md`. Stamping the price on both rows double-counts every naive
`SUM(amount_charged)`.

Reuse `services/shared/passes/create-pass-after-charge.js` and the machinery behind
`routes/checkout/record-booking-with-pass.js` (record transaction → deduct pass → add attendee →
update spots → notify). Do not reimplement any of it.

---

## Endpoint 1 — `POST /checkout/class/create-payment-intent`

Mounted with `requireWidgetAuth` (client Firebase project — `dibs-studio-clients`).

Request `{ dibsStudioId, eventId, promoCode? }`. **`userid` comes from the verified token, never
the body** — the same rule the `POST /update-profile` hardening just established.

Server:

1. Load the event. Reject cancelled, deleted, already-started, and full.
2. Reject if this client already has a live attendee row for the event — a double booking is a
   double charge.
3. **Compute the price server-side.** The client sends a promo *code*, never a total — see the
   promo note at the bottom for the live hole this is avoiding.
4. Resolve the connected-account customer via `create-user-connected-stripeid.js`.
5. Create an **ephemeral key** for that customer, on the connected account. Nothing in dibs-api
   creates ephemeral keys today — this is genuinely new.
6. Create the PaymentIntent **unconfirmed**, on the connected account:
   `automatic_payment_methods: { enabled: true }`, `customer`, `setup_future_usage: 'off_session'`,
   and metadata carrying `{ userid, dibsStudioId, eventId }` so a stray PI is traceable.

Returns `{ paymentIntentClientSecret, ephemeralKeySecret, customerId, amountCents, currency,
breakdown }`.

## Endpoint 2 — `POST /checkout/class/confirm-booking`

Request `{ dibsStudioId, eventId, paymentIntentId }`; `userid` from the token.

1. Retrieve the PI from Stripe **on the connected account**. Require `status === 'succeeded'`.
   Never trust the client's word that it paid.
2. **Idempotency keyed on the PaymentIntent id**, not on status — the same lesson as the
   `paid_transaction_id` fix in the invoice pipeline. A retry after a dropped response must return
   the existing booking, not book twice.
3. Record the Scenario 5 rows above, then send the client confirmation and the ops notification.

Returns the booking summary the app shows on success.

### Capacity: hold the seat BEFORE charging (Alicia, 2026-08-11)

The seat is reserved when the client taps Book, not when the money lands. Charge against a held
seat, then convert the hold into a real booking. This is the right instinct and it removes almost
all of the exposure — a client cannot pay for a class that filled while they were typing a card.

**Holds are rows, not a counter.** The proposal was a `events.temp_held_spots` column, incremented
on Book and decremented on success. The arithmetic is right; a bare counter is the part to avoid,
because a counter cannot expire. Every way a checkout dies — force-quit, dead battery, lost signal,
a 3DS challenge abandoned in a banking app — leaves it incremented with nothing left running to
decrement it. That seat is then gone **permanently**, the class shows full with an empty spot, and
there is no way to work out which increment was the orphan because a number records neither who
took it nor when.

Rows fix that by construction:

```
class_spot_holds
  id, event_id, userid, dibs_studio_id
  payment_intent_id      -- so confirm-booking finds exactly the right hold
  expires_at             -- created_at + HOLD_MINUTES
  released_at            -- set on conversion, cancellation, or expiry sweep
```

Held count is `COUNT(*) WHERE event_id = ? AND released_at IS NULL AND expires_at > now()`. An
abandoned hold stops counting the moment it expires, with nothing needing to run — the leak is
self-healing rather than permanent. A sweeper to stamp `released_at` on dead rows is then tidying,
not correctness. Indexed on `(event_id, expires_at)` the count is cheap; do not denormalise it back
onto `events` until something measured says to, because a cached count is a second source of truth
free to drift from the first.

Rows also buy things a counter cannot: showing the client their own hold and its countdown,
refusing a second hold on the same class by the same person, and seeing abandoned checkouts.

**Creating the hold must itself be atomic.** `spots_booked + held >= seats` is the full test, and
two people tapping Book at the same instant must not both get the last seat — the insert is
conditional on the count, in one statement, the same shape as the ClassPass reservation claim.

**`HOLD_MINUTES = 5`** as proposed, with one caveat: a 3DS challenge that bounces through a banking
app can outlast it. So the hold makes the bad case *rare*; it does not make it impossible, and
**the refund path is still required** as the backstop. At confirm time: hold alive → convert it;
hold expired but the seat is still free → take it and carry on; hold expired and the class filled →
refund immediately and say so plainly.

**Only the card path needs holds.** Pass, credit and free bookings record in one atomic step with no
gap to protect.

**The widget will not know about holds** — it reads `spots_booked`/`isFull` from `events`, so it
will not show a held seat as full. That is acceptable: holds are enforced server-side at claim
time, so the widget cannot overbook. The worst case is a web client tapping a class that has just
been held and being told it is full.

---

## App side

`StripeProvider` currently gets only a publishable key, which points the SDK at the **platform**
account — correct for saving cards, which is what P2 built. A direct charge lives on the
**connected** account, so the booking flow needs a provider configured with
`stripeAccountId = studio.stripeAccountId` and `urlScheme` (**required for 3DS to return to the
app**). Both facts are from the Stripe docs page above.

This is not a conflict to resolve: the platform/connected duality already exists and Dibs already
maintains a customer on both sides (`ensureConnectedCustomer`), with cards cloned across. The
booking sheet simply has to be pointed at the account that owns the PaymentIntent.

Flow, in as few steps as the money allows:

1. Row's **Book** button → if a pass or credit covers it, book with the existing
   `POST /checkout-with-pass-and-or-credit` and never open a sheet. **One tap.**
2. Otherwise call endpoint 1, `initPaymentSheet`, `presentPaymentSheet`. A returning client sees
   their saved card already selected and confirms — **two taps**.
3. On success call endpoint 2, then invalidate the schedule and my-calendar queries.

`Canceled` from the sheet is a decision, not an error — say nothing, exactly as `useCardActions`
already does for card entry.

---

## What must be verified, not assumed

- `4242424242424242` — plain success.
- `4000002500003155` — **forces 3DS.** If this cannot complete, the whole reason for the new
  endpoint has not been delivered.
- `4000000000009995` — decline. The message must come through
  `describe-stripe-charge-error.js`; a raw Stripe error on the wire dumps the entire failed
  PaymentIntent at the client.
- Book the last seat in a class from two devices at once — one succeeds, one is refunded.
- Kill the app between the sheet succeeding and endpoint 2 returning; reopen and confirm exactly
  one booking exists and one charge was made.
- Sandbox studio 88 is `acct_1U1fXzQTOTKua6cH` (`stripe_account_id_test`), and userid 2502 holds
  two live passes there — so both the pass path and the card path are testable on the same account.
- Tap Book, then force-quit before paying. The seat must free itself within `HOLD_MINUTES` with
  nothing having run in between.

---

## Promo codes: what is actually wrong on the widget (checked 2026-08-11)

The master plan lists three widget promo problems. **Two of them are already fixed** — do not go
looking for them:

- `atCodeLimit` vs `atStudioLimit`: fixed. `actions/promo-codes/checkPromoEligibility.js` reads
  `atStudioLimit`, carries a comment naming the old bug, and has tests.
- `applyPromoCode.js` returning 0 for everything except `CASH_OFF`: fixed. `PERCENT_OFF` and
  `FIXED_PRICE` are handled, with the old behaviour described in a comment.

**One is real and unfixed, and it is not really about promo codes:**
`services/shared/stripe/charge-card.js:218` charges `amount: req.body?.total`. The server bills the
number the browser hands it. The promo discount is computed client-side in `applyPromoCode.js`, and
nothing re-derives the price from the event or re-applies the discount before the charge — so the
total is only ever as trustworthy as the client that sent it.

That is a widget/backend fix on its own track. The reason it matters here is the shape: this
endpoint takes an event id and a promo **code** and works out the money itself, so the app is never
in a position to name its own price. Retrofitting that later is how the current hole happened.

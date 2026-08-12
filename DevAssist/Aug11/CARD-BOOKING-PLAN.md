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

Request `{ dibsStudioId, eventId, displayedTotalCents }`. **`userid` comes from the verified token,
never the body** — the same rule the `POST /update-profile` hardening just established.

**Promo codes are OUT of v1** (Alicia, 2026-08-11): get card booking working first. With no promo
the price is just the event's, so client and server can hardly disagree — which is precisely why
this is the cheapest possible moment to establish that the server prices the booking. Adding a
`promoCode` parameter later changes one function, not the contract.

Server:

1. Load the event. Reject cancelled, deleted, already-started, and full.
2. Reject if this client already has a live attendee row for the event — a double booking is a
   double charge.
3. **Price it server-side.** Not because the client should be kept in the dark — the opposite. The
   app MUST show what is about to be charged before the sheet opens, and it computes and displays
   that itself (Alicia, 2026-08-11). Those are two different jobs: the client computes to *show*,
   the server computes to *charge*, and the number that reaches Stripe is the server's own.
   Nothing about that changes what the client sees, because in agreement they are the same figure.
   The point is only that `charge-card.js`'s `amount: req.body?.total` lets a caller name its own
   price; an endpoint that starts from an event id cannot be asked to.

   The app sends the total it displayed. The server compares, charges its own, and logs any
   mismatch loudly — a disagreement is a pricing bug worth knowing about on the first occurrence.
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

1. Retrieve the PI from Stripe **on the connected account**. Require **`status ===
   'requires_capture'`** — authorized, not yet charged. Never trust the client's word that it paid.
   (`'succeeded'` here would mean something already captured it; treat that as the idempotent
   replay in step 2, not as a fresh booking.)
2. **Idempotency keyed on the PaymentIntent id**, not on status — the same lesson as the
   `paid_transaction_id` fix in the invoice pipeline. A retry after a dropped response must return
   the existing booking, not book twice.
3. Take the seat atomically, then `capture()` — or `cancel()` and report the class full. See the
   capacity section below; this ordering is the whole reason there is never a refund.
4. Record the Scenario 5 rows above, then send the client confirmation and the ops notification.

Returns the booking summary the app shows on success.

### Capacity: authorize first, capture once the seat is secured

The gap is real — money must not move for a class that filled while the client was paying — but
Stripe already solves it, so Dibs should not.

Create the PaymentIntent with **`capture_method: 'manual'`** (scoped to cards via
`payment_method_options[card][capture_method]`, so a payment method that cannot authorize
separately is not blocked). Confirming it in the sheet then AUTHORIZES the card rather than
charging it: the status becomes `requires_capture`, the funds are held by the issuer, and 3D Secure
runs during that authorization exactly as it would otherwise.

Then, and only then, take the seat:

- **Seat secured** → `paymentIntents.capture()`. The money moves and the booking is recorded.
- **Class filled first** → `paymentIntents.cancel()`. The authorization is released. **No charge
  ever happened, so there is nothing to refund.**

Verified against the live Stripe docs 2026-08-11: online card authorizations are valid for ~7 days,
which is an eternity against the seconds this needs.

**This replaces the `class_spot_holds` design, which was built and then deleted (2026-08-11).**
That approach reserved the seat in a new table with its own expiry, sweeper and conversion logic —
Alicia's push-back was that it was a lot of machinery for an MVP, and she was right. Manual capture
gets the same guarantee with no new table, no migration, no expiry, no sweeper, and — the part that
actually mattered — no refunds. The seat claim is just the atomic `spots_booked` update the
platform already performs. **Do not reintroduce a holds table without first explaining what manual
capture cannot do.**

One honest caveat: a released authorization can sit as a *pending* line on some bank statements
briefly before it disappears. No money moves and it is not a charge, but a client may glimpse it.
That is the same trade every hotel and car rental makes, and it is far better than taking money and
giving it back.

Only the card path needs any of this. Pass, credit and free bookings record in one atomic step with
no gap to protect.
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
- Fill the last seat from a second device while the first is mid-payment. The loser must see "just
  filled", and Stripe must show that PaymentIntent **canceled with zero captured** — no refund
  object anywhere.
- Force-quit between authorizing and confirming. The authorization lapses on its own; nothing is
  captured and no seat is consumed.

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

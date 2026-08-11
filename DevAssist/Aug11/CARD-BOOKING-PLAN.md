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

**One deliberate departure from the master plan.** §7.8 says the WIDGET migrates onto this rail
first, so the endpoint is proven in production before mobile consumes it. Mobile is going first
instead (Alicia, 2026-08-11 — the app needs card payment and will not send anyone to the browser).
Nothing about the endpoint depends on the widget having moved; the widget migration remains owed,
and until it happens the web still charges through the legacy server-confirmed rail with no 3DS.

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
3. **Compute the price server-side.** The client sends a promo *code*, never a total. The widget's
   trust-the-client promo pattern must not carry onto this rail (explicit §7.8 contract requirement).
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

### Capacity is the sharp edge

Money moves in step 1 of endpoint 2, and the seat is taken in step 3. Between them the class can
fill. The last seat must be claimed with an **atomic conditional UPDATE** (the pattern ClassPass
reservations already use), and if it fails the charge must be **refunded immediately** and the
client told plainly. A taken payment with no seat is the worst outcome this feature can produce.

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

# Verified Widget Checkout Sequences (for mobile parity)

> **Traced from source 2026-07-21; final confirmation = one live staging booking during P3 acceptance.**
>
> Repos traced (read-only): `dibs-widget-new` (React widget) and `dibs-api` (Express backend).
> All endpoint paths below are relative to the API base **`/api/v2`** — the widget's
> `REACT_APP_BASE_URL` already includes `/api/v2` (`dibs-widget-new/.env:4`), and the router
> serving every route below is mounted at `app.use('/api/v2/', ...)` (`dibs-api/index.js:76,156`
> → `dibs-api/routes/routers.js`).

---

## 1. Summary table

| # | Flow | HTTP calls, in runtime order | Confidence |
|---|------|------------------------------|------------|
| A1 | Class booking — **new card, phase 1 (save card)** | `POST /stripe/create-setup-intent` → *client-side* `stripe.confirmSetup()` (Dibs **platform** account) → `POST /stripe/create-user-connected` → `POST /stripe/get-all-payments` (refresh) | HIGH |
| A2 | Class booking — **card charge (new OR saved card), phase 2** | `POST /start-dibs-transactions` → [`POST /stripe/clone-payment-method-only` — only when card lives on the Dibs platform] → `POST /stripe/charge-card` (**server creates + confirms the PaymentIntent**) → `POST /update-dibs-transactions-uuid` → `POST /update-event-counts` → `POST /send-class-email-confirmation` (**backend no-op**) | HIGH |
| A3 | Class booking — pass and/or credit | `POST /checkout-with-pass-and-or-credit` (or `POST /checkout-credit-only` when credit covers everything) — single call does rows + roster + emails | HIGH |
| A4 | Class booking — free class | `POST /checkout-free-event` | HIGH |
| B | Saved-cards listing (checkout AND account screen) | `POST /stripe/get-all-payments` | HIGH |
| C | Promo code at **class** checkout | `POST /verify-promo-code-exists` only — the class-checkout promo UI is a **hard-coded stub**; the functional pattern (appointments/packages) is `verify-promo-code-exists` → `check-promocode-usage-limits` → **client-side** discount math | HIGH (code state), MEDIUM (intended behavior) |

Key architectural answers up front:

1. **No standalone create-PaymentIntent call exists in the class flow.** The PaymentIntent is
   created AND confirmed **server-side** inside `POST /stripe/charge-card`
   (`dibs-api/services/shared/stripe/charge-card.js:101-118`) with
   `off_session: true, confirm: true`, on the studio's **connected** account
   (`{ stripeAccount }` option). Neither `POST /payments/create-payment-intent` nor
   `POST /stripe/create-payment-intent-connected` is called by any mounted widget component
   (see Dead code, §6).
2. The only client-side Stripe.js confirmation in the class flow is **`stripe.confirmSetup()`**
   (saving the new card via a SetupIntent on the **Dibs platform** account) — never
   `confirmCardPayment` / `confirmPayment` for the class total.
3. `POST /passes/create-after-charge` and `POST /checkout/record-booking-with-pass` are **NOT
   part of the group-class flow.** They belong to the appointments flow
   (`dibs-widget-new/src/actions/appointments/createAppt.js:13`,
   `dibs-widget-new/src/actions/appointments/process-recurring/processAppts.js:35`). Both routes
   exist in dibs-api (`routes/routers.js:427-428`) but the class checkout never touches them.
4. **The current "widget v3" class card flow creates NO pass row.** The "single-session pass"
   pattern documented in `.claude/CLAUDE.md` (pack transaction + class redemption within ±60s)
   is produced by the *older* pipeline (`services/actions/start-dibs-transaction.js` family and
   `create-pass-after-charge`), which classes no longer use for card purchases. The live class
   card flow writes a single `dibs_transaction` of `type='class'` per cart item plus an
   `attendees` row — see §2, step B4/B7.

---

## 2. TASK A — Class booked with a NEW CARD (end-to-end)

### Entry point / dispatch chain

- Checkout page: `views/checkout.jsx:121` → `layouts/checkout.jsx:30` →
  `components/checkout/index.jsx:211` → `components/checkout/checkoutList.jsx`.
- The Confirm control: `ConfirmBar` (sticky) `checkoutList.jsx:575` and the "Paying with…"
  summary `SummaryPaymentScreen` `checkoutList.jsx:502-509` both invoke **`buyTheCart`**
  (`checkoutList.jsx:352-412`), which calls **`checkoutGeneral`**
  (`src/actions/checkout/checkout.js`).
- `checkoutGeneral` buckets cart items via `categorizeCartItems` (`checkout.js:6-32`):
  `passid > 0` → passredemptions; `amount === 0` → freeitems; `totalAfterCreditApplied === 0`
  → creditredemptions; else → **cardcharges** (`checkout.js:74-106` is the card branch).
- `howtopay` (which pass covers which item, `amountToCharge` as `number` OR `{ total }`) is
  computed **client-side** by `associatePassesWithEventsNew`
  (imported at `views/checkout.jsx:29`, dispatched at `:73-89`).

### Phase 1 — Add the new card (SetupIntent on the Dibs PLATFORM account)

Trigger: "Add New Card" in the checkout card picker —
`components/account/cc-display/displayCardsCheckout.jsx:433-460` (`handleAddNewCardClick`).
It sets `localStorage.intentPlatform='dibs'`, `intentType='setup'` (`:435-437`).

| Step | Call | Request body | Response | Citations |
|------|------|--------------|----------|-----------|
| 1 | `POST /stripe/create-setup-intent` | `{ customerid, userid, email, name, dibsStudioId, onDibs: true }` | `{ clientSecret, setupIntentId }` | widget `actions/stripe/createStripeSetupIntent.js:16-25`; route `routers.js:391`; controller `controllers/shared/stripe/create-setup-intent-controller.js`; service `services/shared/stripe/create-setup-intent.js:40-52` — platform `setupIntents.create({ customer, payment_method_types:['card'], usage:'off_session' })`. If `customerid` is empty the service creates the platform customer and writes `dibs_user.stripeid` (`:18-38`). |
| 2 | *(client-side, Stripe.js)* `stripe.confirmSetup({ elements, redirect: 'if_required' })` | — | `setupIntent.payment_method` = new `pm_xxx` on the **Dibs platform** | Elements loaded with the platform key (`intentPlatform==='dibs'` → no `stripeAccount` option): `components/stripe/new/loadStripe.jsx:23-27`; confirm at `components/stripe/new/checkoutFormSetup.jsx:108-114`; new pm becomes `cardtocharge` at `:145` |
| 3 | `POST /stripe/create-user-connected` | `{ userid, dibsStudioId }` | `{ msg:'success', stripeConnectedId }` | fired from `checkoutFormSetup.jsx:29-46,150`; widget action `actions/stripe/users/createNewStripeUserConnected.js:11`; route `routers.js:531`; handler `services/shared/stripe/create-user-on-stripe-connected.js:172-175` (get-or-create the customer on the connected account; **no PM clone here** — clone happens at purchase time) |
| 4 | `POST /stripe/get-all-payments` (refresh) | `{ dibsStudioId, userid }` | see §3 | triggered by `setRefreshPaymentOptions(true)` (`checkoutFormSetup.jsx:147`) → `components/checkout/index.jsx:66-203`. The refresh is what tags the new card `platform:'Dibs'` (`index.jsx:104-112`) — needed by Phase 2 step B3. |

The card capture UI is mounted via `showCCCapture` → `CollectCC`
(`checkoutList.jsx:488-492` → `components/stripe/CollectCardInfo.jsx:22` →
`components/stripe/new/loadStripe.jsx:147-151` → `checkoutFormSetup.jsx`).

### Phase 2 — Confirm booking (identical for new-card and saved-card)

User taps **"Confirm booking"** → `buyTheCart` (`checkoutList.jsx:352`) → `checkoutGeneral`
card branch (`actions/checkout/checkout.js:74-106`) → `chargeSavedCardCheckout`
(`actions/stripe/chargeSavedCardCheckout.js`) → `finishTransactionAfterCharge`
(`actions/stripe/finishTransactionAfterCharge.js`).

| Step | Call | Request body | Response | What the handler writes | Citations |
|------|------|--------------|----------|-------------------------|-----------|
| B0 | *(local, may hit backend)* `resolveStudioStripeId` | — | validated connected-customer id or `''` | none | `chargeSavedCardCheckout.js:26-30`; `actions/stripe/resolveStudioStripeId.js` (guards against a connected-customer id cached for a different studio) |
| B1 | `POST /start-dibs-transactions` | `{ cartItems: cartPreparedForCheckout, userid }` | `{ message, uuid, dibsTransactionIds[] }` | one `dibs_transaction` **per cart item**: `type:'class'`, `status:0`, `unpaid:true`, `checkoutUUID=uuid`, `amount = amount_charged = price + itemtax`, `original_price`, `tax_amount`, `purchasePlace:'widget'`, `source:'dibs'`, `event_price`. **No pass row.** | widget `actions/checkout/startDibsTransactionsCheckout.js:5-8`; route `routers.js:528`; handler `services/shared/checkout/start-dibs-transactions.js` + `services/shared/checkout/create-transaction.js:12-32` |
| B2 | *(conditional)* `POST /stripe/create-user-connected` | `{ userid, dibsStudioId }` | `{ stripeConnectedId }` | connected customer if missing | only when the selected card is a Dibs-platform card AND no connected customer id is known: `chargeSavedCardCheckout.js:50-55` |
| B3 | *(conditional)* `POST /stripe/clone-payment-method-only` | `{ dibsId, stripeid: <platform customer>, paymentmethod: <platform pm_xxx>, stripeIdConnected: <connected customer> }` | `{ msg:'success', stripeIdAtThisStudio, newPaymentMethod }` | clones the PM to the connected account and attaches it; **dedupes by card fingerprint** and reuses an existing connected PM when present | fires **only when the card's `platform === 'Dibs'`** (`chargeSavedCardCheckout.js:50-68`); widget action `actions/stripe/clonePaymentMethodOnly.js:4-8`; route `routers.js:532`; handler `services/shared/stripe/clone-payment-method-only.js:36-74` |
| B4 | `POST /stripe/charge-card` | `{ userid, dibsId, stripeid, cartPreparedForCheckout, pmid, total: totalAfterCreditApplied, creditApplied }` | `{ msg:'success', uuid, stripechid }`; on failure `402` (card error) / `500` with `{ error: { code, message, decline_code } }` | **Creates + confirms the PaymentIntent server-side on the connected account**: `stripe.paymentIntents.create({ amount: total*100, currency:'USD', customer, payment_method: pmid, off_session:true, confirm:true, statement_descriptor_suffix, metadata:{uuid} }, { stripeAccount })`. Returns `latest_charge` as `stripechid`. Also fires server-side `sendBookingNotification` (ops + client emails) per class item. | widget `chargeSavedCardCheckout.js:19,80-99`; route `routers.js:509`; handler `services/shared/stripe/charge-card.js:15-23` (body), `:101-118` (PI), `:133-157` (emails), `:159-163` (response), `:165-176` (errors) |
| B5 | `POST /update-dibs-transactions-uuid` | `{ uuid: <uuid from B1>, stripeChargeId: <stripechid from B4>, userid }` | `{ message, numtransactionsupdated }` | for every `dibs_transaction` with `checkoutUUID=uuid, status:0`: set `status:1`, `stripe_charge_id`, `unpaid:false`; **creates the `attendees` row** (`attendeeID = String(transaction.id)`, `source:'dibs'`, `visitDate = event.start_date`, `checkedin:false`, `dropped:false`) | widget `actions/stripe/finishTransactionAfterCharge.js:9` → `actions/checkout/updateDibsTransactions.js:5-8`; route `routers.js:529`; handler `services/shared/checkout/update-dibs-transactions.js:27-67` |
| B6 | `POST /update-event-counts` | `{ uuid }` | `{ message }` | per affected event: recount non-dropped `attendees` → `event.spots_booked` | widget `actions/checkout/updateEventCounts.js:5-8`; route `routers.js:530`; handler `services/shared/checkout/update-event-counts.js:13-42` |
| B7 | `POST /send-class-email-confirmation` | `{ dibsId, userid, cartPrepared, creditApplied, totalAfterCreditApplied }` | `{ message: 'email was sent' }` | **NO-OP** — handler short-circuits; confirmation emails are sent by B4's `sendBookingNotification` | widget `checkoutList.jsx:376-383` → `actions/emails/send-confirmation-class.js:5-14`; route `routers.js:407`; handler `services/shared/email/send_class_confirmation_email.js:12-17` |

Then the widget navigates to `/checkout/confirm/:dibsId` (`checkoutList.jsx:400`).

**Data-feeding between calls:** B1's `uuid` → B5 + B6 payloads (and only those — see the
metadata caveat in §5). B3's `newPaymentMethod` replaces the platform `pm` as `pmid` in B4.
B4's `stripechid` → B5's `stripeChargeId` and is stamped onto the returned cart items
(`checkout.js:100-105`).

**Backend note on B4:** the handler **ignores** the body's `stripeid` — it re-derives the
connected customer from `dibs_user_studio.stripe_customer_id[_test]`
(`charge-card.js:65-75`), and the connected **account** id from
`dibs_studio.stripe_account_id[_test]` (`:34-42`). The charge amount is trusted from the
client-sent `total` (`:104`).

### Task A.4 — SAVED-CARD variant

**Same endpoints, same order.** Phase 1 is skipped entirely. The only branch difference is
inside Phase 2:

- Saved card already on the **connected account** (`platform === 'Studio'` in the deduped card
  list, `components/checkout/index.jsx:95-103`): steps B2/B3 are skipped —
  `chargeSavedCardCheckout.js:50` (`if (platformOfCard === 'Dibs')`) — and the connected-account
  `pm_xxx` goes straight into B4.
- Saved card on the **Dibs platform** (`platform === 'Dibs'`): B2 (if needed) + B3 run each
  time; the clone handler's fingerprint dedupe (`clone-payment-method-only.js:36-51`) makes the
  repeat clone a no-op that returns the existing connected PM.

### Task A (context) — pass / credit / free variants of the same Confirm tap

`checkoutGeneral` fires these in the same `buyTheCart` invocation for mixed carts
(`checkout.js:51-72,108-118`):

- **Pass and/or partial credit:** `POST /checkout-with-pass-and-or-credit`
  `{ userid, cartItems, creditApplied, totalAfterCreditApplied, checkoutUUID (client uuidv4) }`
  → returns `1` (success) / `2` (insufficient pass/credit) / `0` (error).
  Widget `actions/checkout/checkoutWithPassesAndOrCredit.js:11-25`; route `routers.js:420-422`;
  service `services/shared/checkout-with-passes.js` — per item creates `dibs_transaction`
  (`type:'class'`, `with_passid` when pass-paid, `studio_credits_spent`, `unpaid:false` unless
  balance remains — `services/actions/start-dibs-transaction.js:44-77`), decrements
  `passes.usesCount` (`services/actions/deduct-pass.js`), deducts credit, creates `attendees`
  (`services/actions/add-to-attendees.js:10-27`), and sends booking notifications server-side
  (`checkout-with-passes.js:149-173`).
- **Credit covers full total:** same widget action swaps the URL to `POST /checkout-credit-only`
  (`checkoutWithPassesAndOrCredit.js:12-14`; route `routers.js:424`).
- **Free class:** `POST /checkout-free-event` `{ userid, cartItems, dibsId, freeitems,
  checkoutUUID }` (widget `actions/checkout/checkoutFreeEvents.js:11-20`; route
  `routers.js:423`; handler `services/shared/checkout-free-event.js:7`).

---

## 3. TASK B — Saved payment methods listing

### The live endpoint: `POST /stripe/get-all-payments`

- **Checkout:** `components/checkout/index.jsx:69` (`getAllStripePayments(dibsId, userid)`)
  → `actions/stripe/getAllStripePayments.js:5` → `POST /stripe/get-all-payments`
  `{ dibsStudioId, userid }`.
- **Account screen:** `components/account/Billing.js:22,111` — same action, same endpoint.
- Route: `routers.js:502` → `controllers/shared/stripe/get-all-payments-controller.js` →
  `services/shared/stripe/get-stripe-payments-all.js`.

### Exact response shape (from the handler source)

```jsonc
{
  "paymentsDibs": [ /* raw Stripe PaymentMethod objects from the DIBS PLATFORM customer */ ],
  "paymentsConnectedAccount": [ /* raw Stripe PaymentMethod objects from the STUDIO CONNECTED-ACCOUNT customer */ ],
  "stripeidDibs": "cus_xxx",          // platform customer id — present only if dibs_user.stripeid resolves (get-stripe-payments-all.js:49)
  "stripeidStudio": "cus_yyy",        // connected customer id — present only if dibs_user_studio row resolves (:108)
  "defaultPaymentMethodId": "pm_xxx", // OPTIONAL — connected customer's invoice_settings.default_payment_method (:171-178)
  "defaultFingerprint": "abc123"      // OPTIONAL — that PM's card fingerprint (:177-179)
}
```

- Each element of both arrays is an **unmodified Stripe PaymentMethod** (`id`,
  `card.{brand, exp_month, exp_year, last4, fingerprint}`, `billing_details`, …) from
  `stripe.customers.listPaymentMethods(customer, { type:'card' })` — platform call at
  `get-stripe-payments-all.js:50-63`, connected call (with `{ stripeAccount }`) at `:112-127`.
- **Default-card indicator:** the durable default lives on the CONNECTED customer's
  `invoice_settings.default_payment_method` (set via `POST /stripe/set-default-card`,
  `routers.js:503`). The handler stamps **`is_default: true`** onto every PM in either array
  whose card fingerprint matches (or whose id equals) that default (`:180-192`). No default set
  → no flags; the widget falls back to first-card (`displayCardsCheckout.jsx:556`).
- Env-aware: dev reads `stripeid_test` / `stripe_customer_id_test` / `stripe_account_id_test`
  (`:26-28, :42-44, :105-107`).
- **Client-side merge the mobile app must replicate:** the widget dedupes the two arrays by
  `brand+last4+exp_month+exp_year+fingerprint`, keeping the **Studio (connected) copy** when
  both exist, tags each row `platform: 'Studio' | 'Dibs'`, filters expired cards, and sorts
  Studio-first (`components/checkout/index.jsx:92-146`). The `platform` tag drives whether the
  charge path clones (§2, step B3).

### The candidates that are NOT the widget's

- `POST /stripe/get-payment-methods-for-user` (`routers.js:516`) — **studio-admin** surface
  (frontdesk client profile + recurring-booking flow), per its own header comment
  (`services/shared/stripe/studio-admin/get-payment-methods-for-user.js:3-15`). Zero references
  in the widget source (grep over `dibs-widget-new/src`).
- `POST /stripe-get-payment-methods` (`routers.js:582`) — **studio-admin** handler
  (`services/studio-admin/stripe-get-payment-methods.js`). Zero widget references.

### The dead widget file (confirmed)

- `dibs-widget-new/src/actions/stripe/getAllCardOptionsForUser.js:9` targets
  `POST /stripe/get-payment-options`. That route **does not exist** in dibs-api (the only
  similarly named thing is `POST /checkout/payment-options`, `routers.js` — a different,
  appointment-checkout service `services/shared/checkout/get-payment-options.js`). The action
  has **zero importers** in the widget. **DEAD — do not replicate.**

---

## 4. TASK C — Promo codes during class checkout

### What is actually mounted on the class checkout page

`checkoutList.jsx:36,486` mounts `PromoCodeComponent` =
`components/shared/promo-codes/index.jsx`. Its submit handler is a **hard-coded stub**
(`index.jsx:48-71`):

```js
const res = await verifyCode(
    'HOLIDAY50',        // hard-coded promo
    userid,
    'not a pack',       // hard-coded pack arg
    218,                // hard-coded dibs id
    cartPreparedForCheckout,
);
```

- The `TextField` (`:103`) is not bound to state — whatever the user types is ignored.
- On success it only `console.log`s (`:69`); **totals are never recomputed and no discount is
  ever applied on the class checkout page.**
- Net: the ONLY promo call that can fire from class checkout today is
  `POST /verify-promo-code-exists`, with wrong data. `check-promocode-usage-limits` is never
  reached from this surface.

**Conclusion for mobile:** there is no working promo-at-class-checkout behavior to replicate;
this is an unfinished surface. If mobile ships promo-on-class, model it on the functional
pattern below and confirm intended product behavior with Alicia.

### The functional pattern (appointments/packages — the reference implementation)

`components/promo-codes/new/index.js` (mounted by `AppointmentPayment.jsx:23`,
`MonthlySessionsList.js:10`, `SingleSessionsBooking.js:12`), order of operations:

1. **`POST /verify-promo-code-exists`** — `{ promo, userid, pack, dibsStudioId[, cart] }`
   (widget `actions/promo-codes/verifyCode.js:11-16`; route `routers.js:434`; service
   `services/shared/promo-codes/verify-promo-code-exists.js`). Response:
   `{ promoExists, isExpired, displayError, errorMsg, restrictions, product,`
   `promoCodeInfo: <full promo_code row: id, code, amount, type, code_usage_limit,`
   `user_usage_limit, first_time_studio_dibs, product, stripe_coupon_id, expiration>,`
   `promoCodeIsValid, valid, showLogin }` (`:10-22, :80-86`). Lookup is case-insensitive and
   studio-scoped (`:37-42`).
2. Client-side eligibility checks (expired / product-type restrictions) —
   `promo-codes/new/index.js:69-105`.
3. **`applyPromoCode`** (`actions/promo-codes/applyPromoCode.js`):
   a. if `first_time_studio_dibs` → `isUserNew` check (`:45-57`);
   b. if `user_usage_limit > 0 || code_usage_limit > 0` →
      **`POST /check-promocode-usage-limits`** `{ promoinfo: promoCodeInfo, userid }`
      (`:60-80`; route `routers.js:435`; service
      `services/shared/promo-codes/check-usage-limits.js`) → returns
      `{ atUserLimit, atStudioLimit }` (counts prior `dibs_transaction` rows with that
      `promoid`).
4. **Discount math is CLIENT-SIDE.** `applyPromo` (`applyPromoCode.js:5-27`) computes the new
   subtotal/tax/total locally (only `CASH_OFF` is implemented in that helper;
   `calculateDiscountedTax` from `helpers`). The server **never returns a discounted total**,
   and in the legacy class flow the server does not re-validate the promo at charge time —
   `/stripe/charge-card` charges the client-sent `total` verbatim
   (`charge-card.js:104`).

### Bug found (flag for mobile — do not copy)

The widget checks `data.atCodeLimit` (`applyPromoCode.js:73`) but the backend returns
**`atStudioLimit`** (`check-usage-limits.js:38-39`). The code-level usage cap is therefore never
enforced client-side. Mobile should read `atStudioLimit` (and ideally the backend should
enforce limits at charge time).

---

## 5. Rows created (DB reference for parity testing)

Card-paid class (current v3 flow), per cart item:

| Table | Created by | Key fields |
|-------|-----------|-----------|
| `dibs_transactions` | `POST /start-dibs-transactions` (`create-transaction.js:12-32`) | `type:'class'`, `status:0→1`, `unpaid:true→false`, `checkoutUUID`, `amount`/`amount_charged` = price+tax, `original_price`, `tax_amount`, `event_price`, `purchasePlace:'widget'`, `source:'dibs'`, `stripe_charge_id` (stamped by `/update-dibs-transactions-uuid`) |
| `attendees` | `POST /update-dibs-transactions-uuid` (`update-dibs-transactions.js:50-66`) | `attendeeID = String(dibs_transactions.id)` (the canonical legacy join), `source:'dibs'`, `visitDate = event.start_date`, `checkedin:false`, `dropped:false` |
| `event` | `POST /update-event-counts` | `spots_booked` = live recount of non-dropped attendees |
| `passes` | — | **none** (no pass row for a single-class card purchase in this flow) |

Pass/credit-paid class, per item (`checkout-with-passes.js` + `services/actions/*`):
`dibs_transactions` with `with_passid` / `studio_credits_spent`; `passes.usesCount`
incremented; `attendees` with `attendeeID = dibsTransactionId`.

Stripe objects: platform SetupIntent (card save); connected-account PaymentMethod (clone);
connected-account PaymentIntent (`off_session`, auto-confirm) whose `latest_charge` is the
`stripe_charge_id` recorded in Dibs.

---

## 6. Dead / not-live code inventory (do NOT model mobile on these)

| File (dibs-widget-new/src) | Why dead | Evidence |
|---|---|---|
| `actions/stripe/getAllCardOptionsForUser.js` | Targets `POST /stripe/get-payment-options` — route does not exist in dibs-api; zero importers | grep: no importers; `routers.js` has no such mount |
| `actions/checkout/checkoutWithPasses.js` | Targets `POST /checkout-with-pass` — **no such route** in `routers.js` (only `/studio-admin/checkout-with-pass` and `/checkout-with-pass-and-or-credit` exist); zero importers (the live `checkout.js:1` imports `checkoutWithPassesAndOrCredit`) | `routers.js:420-422,451`; grep: no importers |
| `actions/stripe/createStripePaymentIntent.js` (`/stripe/create-payment-intent`) | Only imported by `components/checkout/PayPerClassCard.jsx`, which is only used by `components/checkout/SelectPaymentOption.js`, which has **zero importers** ("no longer used as a gate", `checkoutList.jsx:25`) | grep chain |
| `actions/stripe/createStripePaymentIntentConnected.js` (`/stripe/create-payment-intent-connected`) | Only referenced from a **disabled** test (`components/appointment-types/payment/AppointmentPayment.test.disabled.jsx`) | grep |
| `components/promo-codes/promoField.js` | Zero importers (superseded by `components/promo-codes/new/index.js`) | grep |
| `components/stripe/new/processingCCStatus.jsx` `chargeCard` import | Component renders only a progress bar; the `chargeCard`/`retrieveSetupIntent`/`clonePaymentMethod` imports are unused in its body | file `:10-12` vs render `:58-64` |
| `POST /send-class-email-confirmation` (backend) | Still called by the widget but is a **no-op** on the backend | `services/shared/email/send_class_confirmation_email.js:12-17` |

---

## 7. Residual unknowns to confirm via one staging booking in P3

1. **3DS/SCA handling.** `charge-card.js` uses `off_session: true, confirm: true` with no
   client-side `handleNextAction`/`confirmCardPayment` fallback anywhere in the class flow. A
   card requiring authentication should hard-fail with `authentication_required`. Verify with a
   3DS test card in staging and decide the mobile strategy (likely: surface the decline; or add
   a proper on-session confirm — backend change, ask first).
2. **New-card race on `platform` mapping.** After `confirmSetup`, `cardtocharge` is the platform
   `pm_xxx` immediately, but the `platform:'Dibs'` tag comes from the async
   `get-all-payments` refresh. If the user confirms before the refresh lands,
   `chargeSavedCardCheckout.js:40-46` finds no platform match → the clone step is skipped → the
   platform PM is sent to the connected-account charge, which should fail. Confirm whether the
   UI ordering makes this unreachable in practice.
3. **Email count.** Confirm exactly one client confirmation + one ops email arrive for a card
   booking (`sendBookingNotification` fires inside `/stripe/charge-card`; the widget's separate
   `/send-class-email-confirmation` call is a no-op — verify the deployed backend matches
   source).
4. **PaymentIntent `metadata.uuid` mismatch.** The widget never sends `uuidsent` to
   `/stripe/charge-card`, so the PI metadata carries a backend-generated uuid while
   `dibs_transactions.checkoutUUID` carries the `/start-dibs-transactions` uuid. Confirm nothing
   downstream (refunds/reporting) reconciles on PI metadata before replicating the same
   omission.
5. **Server trust of client totals.** `/stripe/charge-card` charges the client-sent `total`
   and `start-dibs-transactions` records client-sent prices. Verify staging behavior and treat
   as a known constraint (mobile must compute totals exactly as the widget does:
   `associatePassesWithEventsNew` → `getCreditToApply` → `totalAfterCreditApplied`).
6. **Promo product intent.** Class-checkout promo UI is a stub (§4). Confirm with Alicia whether
   mobile v1 should ship promo-on-class at all, and if so whether the backend should own the
   discounted-total computation instead of the widget's client-side math.
7. **`/checkout-credit-only` response/row parity** with `/checkout-with-pass-and-or-credit`
   (not fully traced here — same service family, but verify rows in staging if mobile supports
   credit-only checkout in v1).

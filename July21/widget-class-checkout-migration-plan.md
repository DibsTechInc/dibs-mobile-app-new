# Widget Class Checkout Migration — Pass-Based, 3DS-Capable Rail

**Date:** 2026-07-21
**Status:** Approved by Alicia (decision 7.8 Option B in `dibs-mobile-app/MOBILE_MASTER_PLAN.md`, reordered: widget migrates FIRST, mobile app consumes the same endpoint later at its P3)
**Task level:** L3 (billing path — full cycle: plan → acceptance-criteria file → execute → self-review → report)
**Repos touched:** `dibs-api` (new endpoints), `dibs-widget-new` (class checkout migration)
**Repos NOT touched:** `dibs-mobile-app` (consumer later; no changes now), `new-studio-admin`, `legacy-reference/` anywhere

---

## 1. Why this work exists

The widget's single-class card checkout still runs a legacy pipeline that predates the platform's pass-based booking model. Verified in code 2026-07-21 (full trace with citations: `dibs-mobile-app/docs/verified-widget-sequences.md` — READ IT FIRST):

**Legacy sequence (live today):**
`POST /start-dibs-transactions` (bare `dibs_transaction` type='class', status 0, unpaid true — **no pass row**) → `POST /stripe/clone-payment-method-only` (Dibs-platform cards only) → `POST /stripe/charge-card` (PaymentIntent created **and confirmed server-side** with `off_session: true` on the connected account; sends confirmation + ops emails) → `POST /update-dibs-transactions-uuid` (status→1, stamps `stripe_charge_id`, creates attendee) → `POST /update-event-counts`.

**Three defects this migration fixes:**
1. **No 3DS/SCA capability.** `off_session: true, confirm: true` server-side means a bank challenge hard-fails the charge. No fallback exists (zero `requires_action` handling in the widget).
2. **No pass row.** The platform's intended model (`.claude/CHECKOUT.md` Scenario 5) is: purchase transaction creates a paid pass → redemption transaction immediately uses it → attendee. Every other booking surface (appointments, recurring holds, admin bookings) follows it. The widget class path is the divergence.
3. **`amount_charged` leak.** The legacy pipeline is explicitly called out in shared `.claude/CLAUDE.md` ("the legacy widget pipeline (`start-dibs-transaction.js` family) is still leaking"). The new rail sets `amount_charged` correctly at write time.

The same endpoint will be consumed by the mobile app later (MOBILE_MASTER_PLAN P3), so **the widget migration is also the proving run for the mobile payment rail.**

---

## 2. Required reading (before writing any code — no exceptions)

1. `dibs-mobile-app/docs/verified-widget-sequences.md` — the verified current-state trace, with file/line citations for every claim in §1.
2. `dibs-api/.claude/CHECKOUT.md` — Scenario 5 (group class), "Transaction Types Explained", "Stripe Payment Flow", "Promo Code Handling".
3. `dibs-api/.claude/CANCELLATION.md` — pass return semantics (the new rail creates a real paid pass; cancellation behavior must be verified, see §6 item C7).
4. Shared `.claude/CLAUDE.md` sections: "Key Fields to Know" (`amount_charged` semantics, `is_placeholder`), "How Passes Are Used", "Linking attendees ↔ dibs_transactions" (the `attendeeID = String(dibs_transactions.id)` convention), "Auth & Multi-Tenant Studio Scoping" (context only — these are customer routes, not studio-admin routes).
5. Current official Stripe docs for: PaymentIntents with manual client-side confirmation on Connect connected accounts, and Stripe.js `confirmCardPayment`. Training data is stale — verify signatures.
6. Existing machinery to REUSE (read before designing): `dibs-api/services/shared/passes/create-pass-after-charge.js`, `dibs-api/routes/checkout/record-booking-with-pass.js`, `dibs-api/services/actions/checkoutActions/book-class-with-pass.js`, `dibs-api/services/shared/email/send-booking-notification.js`, the credit-deduction services referenced from `create-pass-after-charge.js`.

---

## 3. Approvals — granted vs. stop-and-ask

**Already approved by Alicia (2026-07-21) — do not re-ask:**
- Building the new class-checkout endpoint pair in dibs-api (new endpoints, billing logic).
- Migrating the widget's class card checkout onto it.
- Mounting `requireWidgetAuth` on the NEW endpoints from day one (they have no legacy callers, so no rollout dance).

**STOP and ask Alicia before proceeding if you hit any of these:**
- Any database schema change (new column, new table, migration). None is expected. If you believe one is needed, stop.
- Any change to the LEGACY endpoints (`/start-dibs-transactions`, `/stripe/charge-card`, `/update-dibs-transactions-uuid`, `/stripe/clone-payment-method-only`, `/update-event-counts`). They stay untouched and mounted — they are the rollback path and the mobile parity-test reference. Do not delete, do not "fix".
- Any change to pass/credit/free class checkout paths (`/checkout-with-pass-and-or-credit`, `/checkout-credit-only`, `/checkout-free-event`). Card path ONLY.
- Anything touching the 20th/25th subscription billing cycle or membership logic.
- A finding that cancellation semantics for the new pass-backed bookings would differ user-visibly from legacy (see §6 C7) — surface the difference, don't pick.

---

## 4. Target design

### 4.1 New dibs-api endpoints (both `requireWidgetAuth`)

**`POST /api/v2/widget/checkout/class/create-payment`**
1. Derive the dibs_user from the Firebase token (`du_firebase_uid`, email fallback — same as `middleware/widget-auth.js`). **Never trust a `userid` from the body for identity.** If the body carries one, verify it matches the token-derived user; 403 on mismatch.
2. Validate the event: exists, `canceled=0`, `deleted=0`, not started, has capacity (`spots_booked < seats`). Reject full events (widget offers waitlist instead).
3. **Compute the total server-side.** Base price from the event row; promo (if `promoCode` present) validated server-side via the existing promo services and applied per CHECKOUT.md discount types; tax from studio config. If the client also sends its computed total and it disagrees with the server's, **reject with a structured error (fail closed) and log the divergence** — this rail does not trust client totals (this is the 7.3-class fix baked in). Note: verify during build whether the widget's class card path ever mixes studio credit with card (check the payment-selection component). If it does, accept `creditToApply`, validate against the live balance server-side, and deduct via the existing credit services in the record step. If it doesn't, explicitly document that and skip.
4. Resolve the payment method: if the chosen saved card lives on the Dibs platform account, clone to the connected account server-side (reuse the existing clone service + fingerprint dedupe). Attach the resulting `pm_xxx` to the PI.
5. Create the PaymentIntent on the **connected account** (`stripeAccount: studio.stripe_account_id`): amount = server-computed total, `payment_method` attached, **NOT confirmed**, `metadata: { userid, eventid, dibsStudioId, source: 'dibs', checkoutContext: 'class-card-v2' }`.
6. Return `{ clientSecret, paymentIntentId, serverTotalBreakdown }`.

**Client confirms** (widget: `stripe.confirmCardPayment(clientSecret)` with the connected-account Stripe.js instance — Stripe.js owns the 3DS challenge; mobile later: PaymentSheet/`confirmPayment`).

**`POST /api/v2/widget/checkout/class/record-booking`**
1. Same token-derived identity check.
2. Retrieve the PI from Stripe on the connected account. Require `status === 'succeeded'`, amount matches, and metadata matches the request (userid, eventid). Reject otherwise.
3. **Idempotency:** if a purchase `dibs_transaction` already exists with this PI's charge id (`stripe_charge_id`), return the existing booking with 200. A client retry after a network blip must never double-book or double-write.
4. Write the CHECKOUT.md Scenario 5 rows, reusing existing services rather than reimplementing (match exactly what the existing pass-based class machinery writes — field-level: types, `for_passid`/`with_passid`, `eventid` on redemption only):
   - Paid single-session pass (real pass, `is_placeholder = false`).
   - Purchase transaction: `for_passid` = new pass, `stripe_charge_id`, **`amount_charged` = gross tax-inclusive total** (per shared CLAUDE.md semantics), `purchasePlace` value ≤ 32 chars, `source: 'dibs'`.
   - Redemption transaction: `with_passid` = new pass, `eventid` set, `amount_charged = 0`.
   - Attendee: `attendeeID = String(<redemption transaction id>)` (the canonical join — STRING), `source: 'dibs'`, `dropped: false`.
   - Event counts: increment `spots_booked` **atomically** (conditional UPDATE, the ClassPass pattern) and set `isFull` when full. If the atomic update fails because the class filled between create-payment and record-booking, refund the PI, write nothing, return a structured "class filled" error. Do not strand a paid, unbooked charge.
   - Promo usage recorded per CHECKOUT.md "Database Records Created" when a promo applied.
5. Send the confirmation + ops emails exactly once via the existing booking-notification services (the legacy path sent them from `charge-card` — the new rail must not double-send and must not zero-send).
6. Return the booking summary the widget renders (server totals are the displayed truth).

**Stranded-payment recovery:** if the user pays and the record-booking call never lands (crash/network), the PI metadata carries everything needed. Ship `dibs-api/scripts/reconcile-class-checkout.js` (dry-run by default, `--apply` to write) that finds succeeded PIs with `checkoutContext: 'class-card-v2'` and no matching transaction, and replays the record step. A `payment_intent.succeeded` Connect webhook backstop is a documented fast-follow (new destination + controller + env var per the webhook discipline in shared CLAUDE.md) — note it in the report, do not build it now.

### 4.2 Widget changes (`dibs-widget-new`)

- In the class checkout flow only (see the trace doc for exact components — `components/checkout/index.jsx` and the card-payment path), replace the legacy 5-call sequence with: `create-payment` → `stripe.confirmCardPayment(clientSecret)` → `record-booking`.
- Handle `confirmCardPayment` outcomes: success → record-booking; `requires_action` is handled inside confirmCardPayment (3DS modal); failure → show the error, no booking, PI abandoned (uncaptured/unconfirmed PIs simply expire).
- Attach the Firebase ID token (`Authorization: Bearer`) on both new calls — users are always signed in at checkout, and the new endpoints require it.
- New-card entry keeps the existing save-card phase (`create-setup-intent` → `confirmSetup` → `create-user-connected`), then proceeds through the new rail like a saved card. Fix the known race noted in the trace doc (card usable before the platform-tag refresh completes) if it surfaces; otherwise document it as pre-existing.
- **Do not touch:** pass/credit/free checkout paths, appointments checkout, the promo components (another agent is actively fixing the class promo stub — see §7 Coordination), any styling. This is a plumbing swap; zero visual change.

---

## 5. Execution protocol (git — both repos)

Operator policy for BOTH repos: **commit locally, NEVER push, never merge to main, never deploy.** Alicia reviews in GitKraken and merges/pushes.

- **dibs-api** (default branch `main` — primary checkout is DIRTY with Alicia's in-flight work, never work in it):
  `git -C /Users/aliciaulin/Desktop/dibs/code/dibs-api worktree add /Users/aliciaulin/Desktop/dibs/worktrees/class-checkout-v2/dibs-api -b feature/class-checkout-v2 main`
  Full protocol: `dibs-api/CLAUDE.md` + MOBILE_MASTER_PLAN.md §7 "dibs-api execution protocol". No migrations are expected in this work; if one becomes necessary, STOP (§3).
- **dibs-widget-new** (default branch `main` — primary checkout is ALSO dirty, never work in it):
  `git -C /Users/aliciaulin/Desktop/dibs/code/dibs-widget-new worktree add /Users/aliciaulin/Desktop/dibs/worktrees/class-checkout-v2/dibs-widget-new -b feature/class-checkout-v2 main`
- Do not fetch/pull remotes in either repo. Branch from local `main` HEAD.
- Backend and widget changes are separate branches in separate repos; note in the report that **deploy order is backend first** (additive routes), widget second.
- On completion, append an entry to `dibs-mobile-app/backend-workstream/STATUS.md` (Lane 5) using its template.

---

## 6. Acceptance criteria

Create `class-checkout-v2-tests.md` (in the dibs-api worktree root) per the Testing Protocol in shared CLAUDE.md, covering at minimum:

- **C1 — Saved card (studio-platform):** staging booking end-to-end. Assert DB rows: pass (`is_placeholder=false`), purchase txn (`for_passid`, `stripe_charge_id`, `amount_charged` = gross), redemption txn (`with_passid`, `eventid`, `amount_charged=0`), attendee (`attendeeID` = String(redemption txn id), `source='dibs'`), `spots_booked` incremented once. Confirmation + ops email fire exactly once.
- **C2 — Saved card (Dibs-platform, clone path):** same assertions; clone deduped on repeat.
- **C3 — New card:** save-card phase then C1 assertions.
- **C4 — 3DS challenge card** (Stripe test card requiring authentication, e.g. `4000 0027 6000 3184`): challenge completes → booking succeeds. Challenge abandoned → no charge, no rows, clean error. **This scenario is the point of the migration — it must pass on staging, not just in unit tests.**
- **C5 — Decline card:** no rows written, clean error, user can retry.
- **C6 — Idempotent retry:** call record-booking twice with the same PI → one set of rows, second call returns the existing booking.
- **C7 — Cancellation parity:** book via new rail, cancel early → verify what the client gets back matches CANCELLATION.md and does not differ user-visibly from a legacy-rail cancellation. If it differs, STOP and surface to Alicia (§3).
- **C8 — Capacity race:** fill the class between create-payment and record-booking → PI refunded, no rows, "class filled" error.
- **C9 — Total mismatch:** client sends a doctored total → create-payment rejects, divergence logged.
- **C10 — Auth:** both endpoints 401 without a token; 403 when body userid ≠ token user.
- **C11 — Promo (if promo lands in this PR window):** server-side validation applied; usage limits enforced server-side (`atStudioLimit` semantics — do not replicate the widget's `atCodeLimit` bug).
- **C12 — Widget regression:** pass, credit, and free class checkouts unchanged; appointments checkout unchanged; visual diff of the checkout sheet = none.

Jest endpoint tests for create-payment/record-booking (mock Stripe; assert row writes and idempotency) runnable via `npm test`. Run the FULL existing dibs-api suite and the widget's checks before declaring done. Report honestly what passed, what needs Alicia's manual eyes (the staging 3DS run needs a human watching the challenge modal), and any concerns.

---

## 7. Coordination & cautions

- **Promo-fix collision:** another agent is fixing the widget's class-promo stub and the `atCodeLimit`/`atStudioLimit` bug. Before touching any file under the widget's checkout/promo components, check `git log`/branches for their in-flight work and coordinate via Alicia if you'd touch the same files. The new endpoint should accept an optional `promoCode` from day one (server-validated) so their UI fix plugs straight in.
- **Legacy rail stays live** for rollback and because OTHER surfaces may share those endpoints. You verified nothing else calls them? No — you didn't. Check for other callers of `/start-dibs-transactions` / `/update-dibs-transactions-uuid` (legacy mobile app, admin) before assuming widget-exclusivity, and note findings in the report.
- **Docs back-flow (BLOCKING, same PR):** update `.claude/CHECKOUT.md` — Scenario 5's endpoint list and the "Stripe Payment Flow" section must describe the new rail (client-side confirm variant) alongside the legacy note; update shared `.claude/CLAUDE.md` if any new convention emerged. This plan file is a working artifact and will rot; the canonical docs are the record.
- **Stripe env discipline:** staging/local uses sandbox keys + `_test` Stripe fields via `global.stripe` — never instantiate Stripe directly (shared CLAUDE.md "Stripe IDs — Dev vs Prod").
- `purchasePlace` ≤ 32 chars (VARCHAR(32) — post-mortem 2026-07-06).
- After completion: update MOBILE_MASTER_PLAN.md P3 to point mobile's class-card row at the now-live endpoints, and STATUS.md Lane 5.

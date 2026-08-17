# Payment Display + `return_classes_as` — Plan & Test Plan (2026-08-16)

Feedback batch from Alicia's simulator run (Carlsbad Village Yoga, studio 210). Six issues, two repos.
dibs-api work lands on `feature/mobile-credit-and-membership`; app work on `feature/card-booking`.

## The design decision Alicia delegated

**"How was this booking paid?" is derived at READ time by one server-side owner, not stored on
`attendees`.** Three reasons: (1) a new column would be NULL on every historical row, so the
derivation is needed anyway; (2) the facts already exist and are already trusted — the purchase
transaction carries `amount_charged` / `stripe_charge_id` / `studio_credits_spent`, and
`get-account-activity.js#derivePaymentMethod` has been classifying card/credit/mixed/pass from them
for months; (3) a stored display column needs every one of the 13+ checkout writers to stamp it
forever — the `amount_charged` history shows how that goes. One reader, zero migration for display.

## Plan

### dibs-api

1. **`dibs_configs.return_classes_as`** — ENUM `('credit','passes')`, NOT NULL DEFAULT `'credit'`.
   Migration + hand-apply PROD.sql (deploys do not run migrations) + model declaration (half-landed
   column rule).
2. **`resolve-return-mode.js`** — new inputs `dibsStudioId`, `redemptionCreatedAt`. Ladder:
   - Unchanged: no `with_passid` → credit; placeholder → none; unlimited → none; expired →
     passValue>0 ? credit : none; finite comp → pass.
   - Explicit `requested` ('pass'/'credit') still wins — admin overrides unchanged.
   - No request: **single-session purchase passes** (totalUses=1, not autopay, pass created within
     60s of the redemption — the same predicate as `bundle-single-session.js`) follow the studio's
     `return_classes_as`: `'credit'` → return `passValue` as credit; `'passes'` → return the use
     AND repoint the pass row's `private_pass` to match the dropped event, so the returned pass
     actually covers the next class of that type.
   - **Genuine multi-use packs stay like-for-like (use back) in BOTH modes** — a 5-pack client
     keeps getting their class back on the pack; the config governs classes paid for at booking
     time. (Flagged for Alicia to override if she wants credit-for-packs too.)
   - Config read failure / missing row → `'credit'` (the platform default).
3. **Activity feed** (`get-account-activity.js`):
   - `Credit applied to …` names the EVENT when the linked package is an `[Admin] Paid Session`
     bookkeeping package ("Credit applied to Gentle Flow", never the internal name).
   - New opt-in `collapseAppliedCredit` (set by the `/widget/account-activity` wrapper only):
     drops `credit_used` rows whose booking row is in the feed — the web widget/admin keep both
     rows for their CREDITS lens. Credit-BACK rows (`class_drop`) always stay.
4. **`add-data-to-appts.js`** (`get-upcoming-appts` — the app's My Calendar): new `paidWithLabel`
   field via a new pure owner `services/shared/transactions/describe-booking-payment.js`:
   genuine pack → package name (unchanged); single-session purchase → "Booked with studio credit"
   / "Paid by card" / "$X.XX credit + $Y.YY card"; unpaid → unchanged. `serviceName` untouched, so
   the widget renders exactly as before (widget adoption = follow-up).

### dibs-mobile-app

5. Route credit-covered cart lines straight to `book-with-credit` (kills the "Charging your card…"
   flash + one wasted round trip); `via` computed from the split as a guard; `price_changed` handled
   on the credit path (newly first server contact).
6. Account screen pull-to-refresh; post-booking invalidation of credit + accountActivity +
   upcomingPayments; credit staleTime unified at 30s.
7. Payments rows: sub-label from `paymentMethod` ("Credit applied" / "Paid by card" /
   "$X credit · $Y card"); calendar rows prefer server `paidWithLabel`.

## Acceptance criteria

### 1. Booking status copy
- [ ] Credit fully covers → status reads "Paying with your studio credit…" from the first frame;
      "Charging your card…" never appears.
- [ ] Balance shrank on another device mid-checkout → `insufficient_credit` falls back to card,
      copy switches to card, booking completes.
- [ ] Price changed server-side on a credit-covered line → re-render with fresh figure (no generic
      failure).

### 2. Payments screen
- [ ] Credit-paid class: ONE row — "Gentle Flow · $22.00 · Credit applied". No separate
      "Credit applied to [Admin] Paid Session" row.
- [ ] Card-paid class: "Paid by card" sub-label.
- [ ] Mixed: "$X.XX credit · $Y.YY card" sub-label; amounts sum to the row total.
- [ ] Cancelled class credit-back still its own green "+$" row, named after the class.
- [ ] Studio-admin Account Activity (web) unchanged — both rows still emitted there.

### 3. My Calendar label
- [ ] Credit-paid booking: "Booked with studio credit" (no "[Admin] Paid Session").
- [ ] Card-paid booking: "Paid by card".
- [ ] Pack-paid booking: still the pack's name.
- [ ] Widget My Classes unchanged (`serviceName` untouched).

### 4. Refresh
- [ ] Pull down on Account → passes + credit + cards refetch (removed pass disappears, balance
      corrects).
- [ ] Book with credit → Account balance updates without re-login; Payments shows the new charge.

### 5. return_classes_as
- [ ] Default (no row touched): early drop of a credit-paid class returns **credit** =
      `passValue`; no orphan pass appears; app shows `returned: 'credit'` + amount; email says
      credit.
- [ ] Same for card-paid class (credit back, per existing credit-return semantics).
- [ ] Studio set to `'passes'`: early drop of a credit-paid GROUP class returns the use AND the
      pass now covers group classes (auto-applies to the next booking; admin profile no longer says
      "Applies to private classes").
- [ ] 5-pack booking dropped early: use returns to the pack in BOTH modes.
- [ ] Comp pass drop: use returned (never $0 credit). Unlimited: nothing. Placeholder: nothing.
      Expired: credit. Late drop: nothing. All unchanged.
- [ ] Admin override (`overrideReturnMode`) still wins over the config.
- [ ] Migration applied manually on Crunchy staging/prod before deploy (PROD.sql provided).

## Automated tests
- `services/shared/drop-event/__tests__/resolve-return-mode.test.js` (new — full ladder + config).
- `services/shared/transactions/__tests__/describe-booking-payment.test.js` (new).
- `class-drop/__tests__/drop-class.test.js` (kept green; new config-path cases).
- App: existing cart/account/billing suites + new cases for routing and labels.

## Manual testing required (Alicia)
- One credit-paid booking → check status copy, Payments row, calendar label, then cancel → credit
  back, balance correct after pull-to-refresh.
- Flip studio 210 to `'passes'` via SQL, repeat, confirm the returned pass auto-applies to the next
  group class.

## Known follow-ups (named, not done here)
- Widget's legacy `POST /drop-event` does NOT go through `resolveReturnMode` — widget self-cancels
  keep old like-for-like behavior until that dropper is modernized (its own tested change; live
  money path).
- Studio-admin Settings UI toggle for `return_classes_as` (column is hand-set via SQL until then).
- Studio-admin drop-modal copy mirror (`dropReturnOptions.js`) doesn't know the config yet — the
  server outcome is right; the modal's offered default may read like-for-like.
- The one-time sign-out Alicia hit: not reproduced, nothing in this batch touches auth; watch for
  recurrence.

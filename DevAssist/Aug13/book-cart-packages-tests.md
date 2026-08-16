# Book → Cart → Checkout, My Calendar, Packages — Test Plan

Built 2026-08-13. Branch `feature/card-booking`. Studio for testing: **Everyday Ballet (88)** on
staging, whose sandbox connected account is `acct_1U1fXzQTOTKua6cH`.

Run before anything else: `npm run typecheck && npx jest && npx expo lint`
(current: 771 tests / 27 suites green, 0 lint errors). Backend:
`cd ../dibs-api && npx jest services/shared/checkout services/shared/pricing` (181 green).

Stripe test cards: `4242 4242 4242 4242` succeeds · `4000 0000 0000 9995` insufficient funds ·
`4000 0025 0000 3155` requires 3DS · `4000 0000 0000 0002` generic decline.

---

## 1. Book from the schedule (happy path)

**Steps:** Sign in → Book → tap **Book** on a priced class.

**Success criteria:**
- [ ] The button flips to **Added** (neutral border, not the accent outline)
- [ ] A sticky bar rises: "Checkout · 1 class" with the tax-inclusive total on the right
- [ ] The last row of the day is still scrollable to — nothing hides under the bar
- [ ] Tapping **Added** removes it; the bar disappears
- [ ] The schedule header has **no** cart icon (the bar is the only cart affordance)

## 2. Details is a separate destination, not a second Book

- [ ] Tapping **Details ›** opens class detail
- [ ] Tapping the row body (anywhere but the button) opens the same screen
- [ ] Tapping **Book** never navigates
- [ ] On a front-desk-sized tap: no combination of near-misses books a class you meant to read about

## 3. Class detail

- [ ] The CTA reads **Book · $42.22** — the TOTAL including tax, not the $39 the row showed
- [ ] Tapping it adds to the cart AND lands on `/checkout`
- [ ] Going back to detail for the same class: CTA now reads **Review your cart**, with
      "This class is in your cart." beneath
- [ ] A **full** class shows a tag and a sentence — no button at all
- [ ] A `free_class` shows "This class is free — book it with the studio directly for now."

## 4. Checkout — one class

**Steps:** Cart one class → Checkout → Confirm → pay with `4242…`.

**Success criteria:**
- [ ] Line shows day, time, instructor, duration, location, cancellation sentence
- [ ] Price block reads Drop in / Tax / Charged, and Charged = the button's figure
- [ ] "Each class is charged separately" does **not** appear (only shown for 2+)
- [ ] PaymentSheet opens with the saved card preselected
- [ ] On success: the line shows a green **Booked** tag and stays on screen
- [ ] The footer becomes "You're booked." + **See my calendar**
- [ ] Screen title changes to **Booked**
- [ ] **DB:** an `attendees` row + `dibs_transactions` row with `source='dibs'` (NOT `'zf'`),
      `amount_charged` = the charged total, `purchasePlace` set
- [ ] Confirmation email to the client + ops@ondibs.com
- [ ] Going back to the schedule: the booked class is no longer "Added", and its spots count dropped

## 5. Checkout — several classes (the sequential run)

**Steps:** Cart three priced classes → Checkout → Confirm.

**Success criteria:**
- [ ] "Each class is charged separately, so you'll see 3 charges from Everyday Ballet."
- [ ] Total = sum of the three tax-inclusive figures
- [ ] Three PaymentSheets appear **one at a time**, each waiting for the last to dismiss
- [ ] Each line turns Booked as it lands, in cart order
- [ ] Three separate PaymentIntents on the connected account, all captured
- [ ] Footer: "3 classes booked." + See my calendar

### 5a. Dismissing the sheet mid-run
- [ ] Dismiss the SECOND sheet → the run stops; the third is never attempted
- [ ] Class 1 shows Booked; classes 2 and 3 show no error (they were not attempted)
- [ ] The CTA returns, offering the remaining two at their combined total
- [ ] Tapping it again books only those two — class 1 is not charged twice

### 5b. Partial failure
**Steps:** Two classes; use `4000 0000 0000 0002` (decline) on the second sheet.
- [ ] Class 1 Booked; class 2 shows the decline message in red
- [ ] "Your card was not charged." appears **only** if the server confirmed it
- [ ] The button becomes **Try again · $X** covering only class 2
- [ ] Footer note: "1 of 2 booked. The rest are still here."

## 6. Refusals

### 6a. Price changed
**Steps:** Cart an off-peak class, then change its pricing rule server-side before confirming.
- [ ] The line says "The price updated to $X. Confirm below to book at the new price."
- [ ] The **total and the button both move to the new figure** (not just the line)
- [ ] Nothing was charged — no PaymentIntent exists
- [ ] Confirming books at the new price, and the charge equals what the button said

### 6b. Covered by a pass
**Superseded by scenario 11** — the app now books these with the pass rather than reporting a
refusal. The card endpoint's `covered_by_pass` refusal remains as a backstop; see 11d for the
self-healing path that exercises it.

### 6c. Class fills while in the cart
- [ ] The line reads "This class filled up while it was in your cart."
- [ ] It leaves the total; the button covers only the rest
- [ ] With every line blocked: no button at all, plus "None of these can be booked with a card
      right now." — and Remove still works on each

### 6d. Class cancelled while in the cart
- [ ] "No longer on the schedule — it may have been cancelled, or it has already started."
- [ ] No price is shown for it

## 7. Guest → sign in → back to the cart  ⚠️ regression-prone

**Steps:** Sign OUT. Book two classes from the schedule. Tap Checkout.

**Success criteria:**
- [ ] Redirected to sign-in (not to Home, not to an error)
- [ ] After signing in you land on **`/checkout`**, not Home
- [ ] **Both classes are still in the cart**
- [ ] The back gesture from checkout does not return to the sign-in screen
- [ ] Same for a brand-new account via Sign Up

## 8. A live cart is never invisible

- [ ] With something in the cart, navigate to Home → a cart icon appears top-right
- [ ] Tapping it opens checkout
- [ ] Empty the cart → the icon disappears (it is not permanent chrome)

## 9. My Calendar

- [ ] The next booking is a **hero** — accent field, big Fraunces time, day in words
- [ ] That booking does **not** also appear in the list below (count it: hero + list = total)
- [ ] Tab reads "Upcoming · N" where N includes the hero
- [ ] Day headers show a relative label left, the date right, over a rule
- [ ] "Fri, Aug 15" headers do **not** also print "Aug 15" on the right
- [ ] **Past** tab: denser rows, Attended / Cancelled tags, no time rail
- [ ] With no past bookings: the segmented control is hidden entirely
- [ ] History but nothing upcoming: "Nothing coming up." + Browse classes
- [ ] Signed out (deep link): "Sign in to see your classes" — never "Nothing booked yet"
- [ ] Times match the studio's wall clock, from a phone in another timezone

## 10. Packages

- [ ] Drawer order is **Book · My calendar · Packages · Account · Payment methods · Profile**
- [ ] Signed in with passes: they appear at the TOP under "Your passes", then "Buy more"
- [ ] The same passes appear in the drawer's balances block and on Account
- [ ] An **unlimited** membership shows the word "Unlimited", never a number — check studio 88's
      Month Unlimited, whose `classAmount` is `1`
- [ ] A membership card shows "per month" and its minimum commitment
- [ ] A pack shows "N classes · Valid for X months" and, where the studio ticked it, "$20 per class"
- [ ] Placeholder / `[Admin] Unpaid Reservation` packages appear **nowhere**
- [ ] Signed out: the price list still loads; "Your passes" says sign in
- [ ] Wallet with no passes: "See packages" now goes somewhere

---

## Automated tests

| File | Covers |
|---|---|
| `src/domain/cart/__tests__/build-cart.test.ts` | Cart resolution against the live schedule: gone / full / free / noPrice, total counts only chargeable lines, order preserved, pricing-rule figure taken from the backend (18 tests) |
| `src/domain/packages/__tests__/build-packages.test.ts` | pack vs membership (`FORCE` only), the unlimited-sentinel trap, per-class derivation, commitment + validity copy, placeholder/private filtering (16) |
| `src/domain/bookings/__tests__/group-bookings.test.ts` | `splitNextUp` — hero lifted OUT of the list, emptied days dropped, empty calendar (5 added) |
| `src/domain/auth/__tests__/return-path.test.ts` | Sign-in return whitelist; unknown/external/array params fall back to Home (6) |

## Manual testing required (cannot be automated here)

1. **The PaymentSheet itself** — jsdom has no native modal. Sequential presentation, 3DS return,
   and dismissal all need a device.
2. **The full request, end to end.** Mocked tests validate the functions they point at; they cannot
   discover the one they do not. Run at least one real booking and check the DB rows.
3. **Timezone**: a phone set to London, booking at a US studio.
4. **The design questions** — is the hero too big, is the cart bar the right weight, does "Added"
   read better than a checkmark.

## Known limitations, deliberately shipped

- **No MEMBERSHIP purchase in the app.** A `FORCE`-autopay package is a Stripe subscription, not a
  one-off charge; the server refuses it and the storefront says where to go. Packs and `ALLOW`
  packages buy normally (Part 2).
- **One charge per class.** No multi-class endpoint exists, so a 3-class cart is 3 statement lines.
  The checkout screen says so.
- **No waitlist.** Full classes state the fact and stop.
- **`useBookClass.ts` has no callers** — superseded by `useCartCheckout`, flagged in-file for delete
  approval rather than deleted.

---

# Part 2 — Buying a package, and booking with one (2026-08-13)

Backend: `dibs-api` on branch `staging`. Endpoints are `requireWidgetAuth`; nothing needs a
migration or a new env var.

## 11. Book a class with a pass  ⚠️ the money-critical path

**Setup:** sign in as a client at studio 88 holding a **finite pack** with uses left.

- [ ] The schedule row reads **"Included · {pass name}"** where a price used to be
- [ ] The Book button still appears and still toggles to Added
- [ ] The cart bar reads "1 class · covered by your pass" with **no dollar amount**
- [ ] Checkout shows "Using your {pass} — $0" and **no Total row**
- [ ] The CTA reads **"Book · class with your pass"** — no figure
- [ ] Confirm books it with **no PaymentSheet at all**
- [ ] **DB:** ONE `dibs_transaction` (type `class`, `with_passid` = the pass, `amount_charged` **0**,
      `original_price` = the pass's `passValue`), one `attendees` row with
      `attendeeID = String(that transaction id)`, `source='dibs'`. **No purchase transaction.**
- [ ] `passes.usesCount` went up by exactly **1**
- [ ] `events.spots_booked` reconciled from the attendee count
- [ ] Confirmation email says "pass", not a dollar amount

### 11a. The unlimited membership — the trap that has bitten 13 surfaces
**Setup:** a client on Month Unlimited (`totalUses` is **null**).
- [ ] The row reads "Included", NOT a price
- [ ] The booking succeeds — a bare `usesCount < totalUses` would refuse every member
- [ ] `usesCount` increments; the pass stays usable for the next class

### 11b. Which pass gets spent
**Setup:** a client holding BOTH a membership and a 10-class pack.
- [ ] The row, the cart line and the confirmation all name the **membership**
- [ ] The **pack's** `usesCount` is unchanged — spending it would cost them a class they could keep
- [ ] The app's name and the server's choice agree (this is the drift that matters)

### 11c. Refusals
- [ ] Pass with 0 uses left → `pass_spent`, "nothing was used", seat NOT consumed
- [ ] Expired pass → not offered as coverage at all; the class prices normally
- [ ] Placeholder / `[Admin] Unpaid Reservation` pass → never offered, never spent
- [ ] Private appointment pass only → the class prices normally and books by card
- [ ] A class with `can_apply_pass = false` → prices normally even for a member
- [ ] Class fills between the screen and Confirm → `class_full`, pass use NOT consumed
- [ ] **Race:** two devices booking the last use of a one-use pack — exactly one succeeds

### 11d. Self-healing
**Setup:** buy a pack on the web, then (without refreshing) Confirm a card booking in the app.
- [ ] The server refuses `covered_by_pass` and the app **silently books it with the pass instead**
- [ ] No charge, no error on screen, the line just turns Booked

## 12. Buy a package

**Setup:** studio 88, signed in, a real pack on the storefront.

- [ ] The card shows **Buy · $216.50** — the total WITH tax, and "incl. $16.50 tax" beneath
- [ ] The list price above still shows the pre-tax `$200`
- [ ] Tapping Buy opens the PaymentSheet with the saved card preselected
- [ ] On success the card says "Added to your account", and the pass appears in **Your passes**
      above WITHOUT a manual refresh
- [ ] The drawer balances and Account show it too
- [ ] **A class the new pack covers now reads "Included" on the schedule** (this is the
      invalidation that matters — it proves coverage re-ran)
- [ ] **DB:** `passes` row (`totalUses` = class count, `usesCount` **0**, `studio_package_id` = the
      package the client actually chose) + `dibs_transaction` (type `pack`, `for_passid`,
      `amount_charged` = gross, `purchasePlace='mobile-app'`)
- [ ] **Stripe:** one PaymentIntent on the studio's CONNECTED account, captured

### 12a. Memberships are not sold here
- [ ] A `FORCE`-autopay package shows **no Buy button** and reads "Memberships are set up with the
      studio directly."
- [ ] Its price still shows, with "per month" and any minimum commitment

### 12b. Purchase limits
- [ ] An intro offer bought once no longer shows a Buy button afterwards (refetch the storefront)
- [ ] Buying the same intro pack twice in two sessions → `not_first_purchase`, **nothing charged**
- [ ] `packagePurchaseLimit` at the boundary: the Nth succeeds, the N+1th refuses

### 12c. Price and failure
- [ ] Change the package price server-side between the storefront render and Buy →
      "The price updated to $X", **nothing charged**, and confirming charges the NEW figure
- [ ] Declined card (`4000 0000 0000 0002`) → the message sits on that card, no pass created
- [ ] Dismiss the sheet → back to idle, no error, no charge
- [ ] Unlimited package → the pass is created with `totalUses` **null**, and the wallet shows
      "Unlimited" rather than a number

### 12d. Guest
- [ ] Signed out, the storefront still loads and each card offers **"Sign in to buy"**
- [ ] "Your passes" says sign in — never "you have none"

## Automated tests added (Part 2)

| File | Covers |
|---|---|
| `dibs-api services/shared/pricing/__tests__/price-package-for-client.test.js` | Tax as a percentage, rounding pinned against the app's mirror, 0/null is not free (13) |
| `dibs-api services/shared/checkout/package-card/__tests__/gates.test.js` | Membership refusal, storefront filters re-checked at charge time, both purchase limits, `paranoid: false` (15) |
| `dibs-api services/shared/checkout/class-pass/__tests__/choose-pass-for-class.test.js` | Unlimited-first ordering, the null/999 conventions, public-vs-private coercion, a requested pass verified not trusted (19) |
| `dibs-api services/shared/checkout/class-pass/__tests__/claim-pass-use.test.js` | The SQL itself — increment-in-SQL, `totalUses IS NULL`, NULL-safe expiry, placeholder refusal (11) |
| `src/domain/cart/__tests__/build-cart.test.ts` | The `covered` state: $0, still checkoutable, full-before-covered, every never-spend case (13 added) |
| `src/domain/packages/__tests__/build-packages.test.ts` | `isPurchasable`, the tax-inclusive total, memberships carrying no purchase total (9 added) |

Totals: **dibs-api 181 passing** across checkout+pricing; **app 771 passing / 27 suites**.

## Still owed before production

1. **A LIVE-mode `dibs-payment-intent-success` Connect destination.** Sandbox only today. Both
   package purchases and class bookings depend on it as their crash safety net. Verify with
   `stripe.webhookEndpoints.list()` — mounting a handler proves nothing about delivery.
2. **Deploy dibs-api.** These endpoints do not exist on any deployed host yet.

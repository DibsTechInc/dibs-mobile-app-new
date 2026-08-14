# Book → Cart → Checkout, My Calendar, Packages — Test Plan

Built 2026-08-13. Branch `feature/card-booking`. Studio for testing: **Everyday Ballet (88)** on
staging, whose sandbox connected account is `acct_1U1fXzQTOTKua6cH`.

Run before anything else: `npm run typecheck && npx jest && npx expo lint`
(current: 751 tests / 27 suites green, 0 lint errors).

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
**Steps:** Sign in as a client holding an unlimited pass; cart a class it covers.
- [ ] The line shows the server's sentence, styled as information (not red)
- [ ] It stops counting toward the total
- [ ] The line keeps its Remove control

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

- **No package purchase in the app.** There is no server endpoint for it (`checkout/class/*` has no
  package twin, and the widget's `checkout-package-credit-card` is unauthenticated and
  widget-shaped). The storefront states where to buy instead of offering a button that cannot work.
- **One charge per class.** No multi-class endpoint exists, so a 3-class cart is 3 statement lines.
  The checkout screen says so.
- **No waitlist.** Full classes state the fact and stop.
- **`useBookClass.ts` has no callers** — superseded by `useCartCheckout`, flagged in-file for delete
  approval rather than deleted.

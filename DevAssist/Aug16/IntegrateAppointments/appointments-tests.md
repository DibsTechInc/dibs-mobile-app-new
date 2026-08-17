# Appointments in the app — Test Plan

Pilot studio: 263 (Independent Training Spot, `STUDIO_SLUG=independent-training-spot`).
Staging first (`EXPO_PUBLIC_API_URL` → staging), then prod smoke.

## Scenarios

### 1. Surface routing — the app knows what kind of studio it is
**Steps:** Launch the 263 build (features.appointments=true, classes=false); launch the
everyday-ballet build (classes=true, appointments=false).
**Success criteria:**
- [ ] 263 build: Home's Book choice opens `/book` (services list), never the class schedule.
- [ ] Everyday Ballet build: Book still opens `/schedule`; nothing about the class flow changed.
- [ ] Kill the network and relaunch 263: Book still opens `/book` from build flags alone.
- [ ] `offersAppointments: false` arriving from get-basic-config on a classes build changes nothing.

### 2. Services screen (263 = rooms)
**Steps:** Open `/book` at 263.
**Success criteria:**
- [ ] Both rooms list (STRENGTH STUDIO, FLOW STUDIO) with price and duration from get-appt-types.
- [ ] Title reads "Book studio time"; no instructor/provider language anywhere.
- [ ] Selecting a room highlights it (accent wash + check); selecting the other moves the selection.
- [ ] Footer shows the room summary + "Choose a time" and pushes `/book/slots` (NOT the provider step).
- [ ] Empty state renders when the studio has no bookable types.

### 3. Provider step (staffed studios only)
**Steps:** Run a build with `roomBooking: false` against a staffed studio (e.g. staging studio with
providers).
**Success criteria:**
- [ ] Providers list with initials avatars; one tap selects and advances to slots.
- [ ] No "First available" row (deviation #3).
- [ ] 263 build never shows this screen.

### 4. Slots screen — availability
**Steps:** `/book/slots` at 263, move across several days.
**Success criteria:**
- [ ] Day strip + month label render in the accent block; selected day is the white tab.
- [ ] Slots come from `get-availability-custom-263` (network log), grouped MORNING/AFTERNOON/EVENING;
      empty sections omitted.
- [ ] Times print the studio's wall clock verbatim (compare with the widget for the same day) and
      the "Times are the studio's — Eastern" note renders.
- [ ] Changing the date refetches; a stale grid never survives a date change; in-flight request
      aborted on rapid day-tapping (no flash of the wrong day's slots).
- [ ] Off-peak slots show the discounted price (`pricing_rule`) exactly as the widget does.
- [ ] Empty day: strip + summary stay on screen, message offers moving the date.
- [ ] Skeleton (not spinner-over-nothing) while a day loads.

### 5. Single session — review + pay by card
**Steps:** Signed in with a saved card, pick a slot, leave the toggle on Single Session, Review →
checkout → Confirm.
**Success criteria:**
- [ ] Review shows date, time range (start + duration), room/service, price, tax line, total
      (tax is a LINE ITEM — appointments show tax, classes don't).
- [ ] Cancellation sentence names the actual deadline date/time from the studio's private window.
- [ ] Checkout shows the saved card; Change opens the picker; Add card works (SetupIntent sheet).
- [ ] Confirm calls `complete-appointment-booking` with `type: 'card'`, pm_ id, date/time sliced
      from the slot ISO (UTC slices), locationId from the slot, instructorId from the config map.
- [ ] Success screen renders; My Calendar shows the booking (after refetch) with the room name and
      NO instructor line; widget's account view shows the same booking.
- [ ] DB (staging): event (eventtype 'appt', seats 1, room_id 91/92 correct), appointment,
      purchase + redemption transactions, pass (1/1), attendee — per CHECKOUT.md Scenario 1.
- [ ] Client confirmation email received; ops email fired.

### 6. Single session — pass and credit coverage
**Steps:** Client holding a valid private pass; client with studio credit > total; client with
credit < total.
**Success criteria:**
- [ ] Pass fully covers → checkout says so, no card required, booking sends `type: 'pass'` with the
      pass id from the client's own list; pass usesCount increments.
- [ ] Credit covers all → `type: 'credit'`, no Stripe charge, credit balance drops.
- [ ] Partial credit → card charge for the remainder (`useCredit` sent); statement matches.
- [ ] Placeholder/expired/class-only passes never offered (predicate tests + on-device check).

### 7. 263 monthly — the commitment flow
**Steps:** Pick a Saturday slot late in the month; toggle "Lock in monthly".
**Success criteria:**
- [ ] Toggle appears only after a slot is selected, only at a monthlyCommitment studio.
- [ ] Session list = every remaining occurrence of that weekday this month (booking Aug 22 → Aug 22
      + Aug 29), each with price; subtotal/tax/Due today update with the toggle.
- [ ] The explainer names the real commitment and the 25th billing sentence with the computed
      next-month figure (weekday count × price + tax).
- [ ] Conflicted sessions struck through, "not charged", excluded from totals (verify by creating a
      conflict on one date via studio admin first).
- [ ] Confirm calls `/appointments/recurring/enhanced`: payNowOccurrences = the listed non-conflicted
      ISO strings, holdOccurrences = 40 weekly holds after the last paid date, `paymentOption:
      'charge'`, `payment.chargeCardIfNeeded: true`.
- [ ] DB: subscription row (cadence monthly, next_billing_date = 25th), N events + appointments +
      holds per CHECKOUT.md Scenario 3.
- [ ] Charge amount == Due today shown on screen, to the cent.
- [ ] My Calendar shows the upcoming dates; cancelling is signposted to the studio (no row Cancel).

### 8. Failure paths — nothing dead-ends
**Success criteria:**
- [ ] `409 room_conflict` (book the same slot from the widget mid-flow) → clear message, back to
      slots, grid refetched, no charge.
- [ ] Card decline (Stripe test decline card on staging) → server's sentence shown, card changeable,
      retry works.
- [ ] Guest taps Review → sign-in; draft survives; returning lands back in the flow.
- [ ] Airplane mode on Confirm → honest error, retry allowed, no double booking after reconnect
      (idempotency key held for the attempt).
- [ ] Offboarded studio (`studioIsLive: false`) → booking CTAs absent.

### 9. My Calendar — appointment rows
**Success criteria:**
- [ ] Appointment rows use the schedule row anatomy; no instructor at 263; room/service name shown.
- [ ] Single appointment rows offer Cancel (see §11-13); SUBSCRIPTION-owned rows carry the
      contact-the-studio line instead. (Superseded the original "no cancel on appointments" —
      self-cancel shipped in the second pass, 2026-08-16.)
- [ ] Class studios' rows unchanged (regression: everyday-ballet build, cancel a class still works).

### 10. Schedule DayChip contrast fix (regression)
- [ ] At a light-accent studio, unselected strip labels render in `onAccent` ink, not white.
- [ ] Everyday Ballet (dark accent) strip unchanged visually (onAccent is white there).

## Automated tests (jest, `npm run typecheck && npx jest`)
- `src/domain/studio/__tests__/booking-surface.test.ts` — every combination of build flags ×
  server flags × legacy fallbacks × missing config.
- `src/domain/appointments/__tests__/recurring.test.ts` — golden masters: Aug 22 2026 → [22, 29];
  Aug 1 → 5 Saturdays; month boundaries, Dec→Jan, leap Feb; 40 holds weekly after last paid;
  next-month weekday counts.
- `src/domain/appointments/__tests__/pricing.test.ts` — golden masters vs the widget's
  MonthlySessionsList math (§5.8 of the widget map): full price, partial pass (promo suppressed,
  uncovered × price), credit clamp, tax rounding to the cent at 4.875%.
- `src/domain/appointments/__tests__/pass-coverage.test.ts` — the predicate: private only, no
  placeholders, expiry, unlimited (totalUses null), soonest-expiry-first choice.
- `src/domain/appointments/__tests__/payload.test.ts` — request bodies for both endpoints match
  the widget's builders field-for-field (fixtures from the widget map §2.6/§2.7).
- `src/domain/appointments/__tests__/slots.test.ts` — daypart grouping, empty-section omission,
  strip day building.
- Existing suites — pricing golden masters (`npx jest src/domain/pricing`) and the full run stay
  green.

## Manual testing required (Alicia)
- One real single-session booking + one monthly booking at 263 on staging, verified in studio
  admin (roster, transactions, subscription) and in Stripe (charge amount, connected account).
- The monthly billing sentence copy — the widget charges the rest of this month AND bills on the
  25th; the handoff flags the rule itself for your confirmation before the copy ships.
- Visual pass on device: services, slots, review, checkout, booked, My Calendar at 263's accent.

## Added 2026-08-16 (second pass): appointment self-cancel

### 11. Cancel a single appointment — early (notice given)
**Steps:** Book a single session at 263 more than the notice window out; My Calendar → Cancel booking.
**Success criteria:**
- [ ] The sheet names the appointment deadline from `default_cancel_time_private || cancel_time || 12`.
- [ ] Confirm calls `POST /checkout/appointment/cancel`; response `returned` drives the outcome copy.
- [ ] DB: transaction soft-deleted, attendee dropped, EVENT cancelled (canceled=1/deleted=1),
      `appointment.status='cancelled'`, history note says "Cancelled by the client from the mobile app".
- [ ] 263: the room-hour is bookable again (availability shows the slot).
- [ ] Value returned per the studio's `return_classes_as` (credit by default for card bookings;
      use back on a genuine pack); wallet reflects it after refetch.
- [ ] Client cancellation email received; ops email fired.

### 12. Cancel — late (inside the window)
- [ ] The sheet explains the window closed at the actual deadline and offers NO cancel button.
- [ ] Forcing the request anyway (curl) → 409 `late_cancel` with `noticeHours` + `deadline`; nothing changes.

### 13. Subscription-owned session
- [ ] A monthly-reservation date shows "Part of your recurring reservation — contact the studio",
      no Cancel; curl → 409 `subscription_session`.

### 14. Email instructor suppression (263)
- [ ] Single-appt confirmation email at 263 shows NO "w/ Strength Instructor" line; other studios'
      confirmation emails still show their instructor.

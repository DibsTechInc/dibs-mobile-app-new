# Appointments in the app — implementation plan (L3)

Branch: `feature/incorporate-appts-to-app`. Design handoff: `design_handoff_appointments/README.md`.
Pilot: studio 263 (Independent Training Spot). 226 is architecture-supported but not shippable yet
(see "What 226 still needs" at the end).

## What ships

A client at an appointments-only studio opens the app, taps **Book**, picks a **service**, (at a
staffed studio) picks a **provider**, picks a **date and time**, reviews, pays, and sees the
booking in **My Calendar**. At 263 there is no provider step (rooms, not people) and a selected
slot offers **Single session / Lock in monthly**; monthly books the rest of the month now plus a
recurring reservation.

## How the app decides which surface it is

`src/domain/studio/booking-surface.ts` — `resolveBookingSurface(buildFeatures, basicConfig)`:

- Server truth: `offersClasses ?? showSchedule`, `offersAppointments ?? showAppts` (the same
  fallbacks `get-studio-config.js` itself applies). Config not yet loaded → build flags alone.
- ANDed with the build's `features.classes` / `features.appointments` (a build must never route to
  a surface it has no code for; a server flag must never be able to blank a studio's only surface —
  when the AND yields nothing, fall back to the build flags).
- `'both'` resolves to classes for Home's Book tile for now (no studio runs both; documented).

Home's Book choice routes `/book` when the surface is appointments; `/schedule` otherwise.

## Endpoints (all existing — no backend changes)

| Purpose | Endpoint | Notes |
|---|---|---|
| Service list | `POST /get-appt-types` `{ dibsStudioId, eventType: 'appt' }` | name = `appointment_type`, price = `default_price`, duration = `length_minutes` |
| Providers | `POST /appts/get-service-providers` `{ dibsId }` | flat roster; skipped for roomBooking studios |
| Availability | `POST /appts/get-availability` (or `/appts/get-availability-custom-263` when `appointments.availabilityVariant === 'custom-263'`) | body: `{ dibsId, date, provider: { id }, apptType, tz, minuteIncrement: 30, multiIds: [serviceId], locationid: 1 }`; `dibsId` sent as a STRING (the 263 controller compares `!== '263'`) |
| Conflict pre-check (monthly) | `POST /appts/confirm-no-conflict` `{ dibsId, appt: { start_time, end_time, instructorid }, locationid }` | per session, parallel |
| Single booking | `POST /checkout/complete-appointment-booking` | server prices from `default_price` + pricing rules + location tax; only `pricingBreakdown.discount` is trusted (we send 0 — no promos v1) |
| Monthly booking | `POST /appointments/recurring/enhanced` | client-computed pricing (widget parity); payload mirrors the widget's builder exactly |
| My Calendar | existing `POST /get-upcoming-appts` | rows carry `eventtype: 'appt'` |

Auth: these routes are unauthenticated server-side today; the app sends its token anyway
(`authenticated: true`) and sends `userid` from the signed-in account, so the future auth mount
keeps working (`isRequestingOwnData` compares body userid to the token's).

Wall-clock rule: slot `start_time` is studio wall-clock worn as UTC. Booking sends
`date = startTime.toISOString().split('T')[0]`, `time = .slice(11,16)` — never device-converted.
`tz` (IANA) rides on availability calls for the server's past-slot filter.

## Whitelabel schema additions (`whitelabel/schema.ts`)

```ts
features: { classes, appointments, roomBooking: false, monthlyCommitment: false }
appointments: {
  /** Which availability endpoint variant this studio's server expects. */
  availabilityVariant: 'standard' | 'custom-263' (default 'standard'),
  /** roomBooking studios: appointment_type id -> the phantom provider id the booking must carry.
   *  (event.trainerid must resolve to a real instructor row, or get-upcoming-appts hangs.) */
  providerByServiceId: Record<string, number> (default {}),
}
```

263's `studio.json` gains: `roomBooking: true`, `monthlyCommitment: true`,
`availabilityVariant: 'custom-263'`, `providerByServiceId: { "149": 3865566, "150": 3865565 }`
(FLOW STUDIO → Flow Instructor, STRENGTH STUDIO → Strength Instructor — the widget's auto-assign
map, moved into config where per-studio data belongs). `app.config.ts` + `src/config/studio.ts`
thread the new fields.

**No `=== 263` anywhere in `src/`.** Everything gates on these flags.

## Files

New:
- `src/api/schemas/appointments.ts`, `src/api/endpoints/appointments.ts`
- `src/domain/studio/booking-surface.ts`
- `src/domain/appointments/` — `types.ts` (view models), `slots.ts` (daypart grouping, strip days),
  `pass-coverage.ts` (widget `useApptPassDetection` predicate: private_pass, not placeholder, not
  expired, uses remaining; soonest-expiry first), `recurring.ts` (`remainingWeeklyDatesInMonth`,
  `futureHoldSessions(40)`, `nextMonthWeekdayCount`), `pricing.ts` (single + monthly breakdowns —
  the widget's `MonthlySessionsList` math ported verbatim), `payload.ts` (pure request-body
  builders for both booking endpoints)
- `src/features/appointments/` — `appointmentDraft.ts` (zustand), `useAppointmentTypes.ts`,
  `useProviders.ts`, `useAvailability.ts`, `useBookAppointment.ts`, `ServicesScreen.tsx`,
  `ProviderScreen.tsx`, `SlotsScreen.tsx`, `ReviewSheet.tsx`, `AppointmentCheckoutScreen.tsx`,
  `BookedScreen.tsx`
- Routes: `src/app/book/index.tsx`, `provider.tsx`, `slots.tsx`, `checkout.tsx`, `booked.tsx`

Modified:
- `whitelabel/schema.ts`, `whitelabel/studios/independent-training-spot/studio.json`,
  `app.config.ts`, `src/config/studio.ts`
- `src/app/index.tsx` (Book routes by surface)
- `src/domain/bookings/group-bookings.ts` (+`isAppointment`, `subscriptionIds`) and
  `MyCalendarScreen`/`my-calendar.tsx` (no in-app Cancel on appointment rows — the mobile drop
  endpoint refuses appointments by design; rows say how to reach the studio instead)
- `src/components/icons.tsx` (+`check`)
- `src/features/schedule/ScheduleScreen.tsx` — the handoff's DayChip bug: unselected strip labels
  use `colors.onAccent`, not `textInverse` (white-on-light-blue at a light-accent studio)

## Draft state rules (handoff, verbatim)

`{ serviceId, providerId, date, slotKey(+slot snapshot), commitmentType }` — route params carry
nothing; back never clears; editing the service clears provider unless still valid and always
clears date/slot; availability is never cached across a date change; booking clears the draft.

## Payment (v1)

- **Card** — saved card (default preselected, changeable in a sheet) or add-card via the existing
  SetupIntent flow; booking sends `paymentMethod: { type: 'card', paymentMethodId: pm_, useCredit }`.
- **Pass** — full coverage detected client-side (server re-verifies nothing here, so only ids from
  the client's own fetched list are ever sent): `type: 'pass', passId, passName`.
- **Credit** — covers-all → `type: 'credit', useCredit: total`; partial rides `useCredit` on card.
- Monthly: same card/credit shapes on `payment: {...}`; pass coverage maps to
  `perOccurrenceAssignments` exactly as the widget builds them.
- **No promo codes in v1** (deferred, noted in report). `pricingBreakdown.discount: 0`.

Failure handling mirrors the class checkout's honesty rules: `409 room_conflict` → "that time was
just taken" → back to slots with availability refetched; card declines render the server's
humanized sentence; unknown failures never claim nothing was charged.

## Deliberate deviations from the handoff (each reported to Alicia)

1. **Single-select services, one appointment per booking.** The backend's paid path books only the
   FIRST service of a multi-service cart (documented known gap, CHECKOUT.md) — multi-select would
   charge for two services and book one. 263's rooms are single-select naturally.
2. **No cart integration.** Appointment-only studios have no class cart to share; the review sheet
   leads to a dedicated `/book/checkout`. The class cart/checkout is untouched (zero regression
   surface). Monthly explicitly bypasses the cart in the handoff already.
3. **No "First available" provider row.** Booking must carry a REAL instructor id (an event whose
   trainerid resolves to nothing hangs the client's upcoming feed server-side), and the server has
   no safe assign-then-book path for clients.
4. **No in-app cancel/reschedule for appointments.** `POST /checkout/class/drop` refuses
   appointments deliberately (CANCELLATION.md §4.3); a client-safe appointment-cancel endpoint is a
   backend change needing approval. Rows state the studio's contact path.
5. **Day strip without per-day dimming; no month grid.** Availability is fetched per selected day;
   there is no per-day openings endpoint to drive dimming, and the strip covers the booking window.
6. **Monthly reviews on a full screen, not a sheet** — a multi-session commitment with terms needs
   the room on a phone. Same content order as the handoff's sheet.

## Known risks

- The recurring endpoint trusts client pricing — the monthly math is golden-master tested against
  the widget's exact formula, and payload builders are pure + tested.
- `complete-appointment-booking` charges off-session (no 3DS challenge flow) — widget parity;
  a card that demands 3DS fails with a clean message and the client can use another card.
- 263's phantom-provider map lives in `studio.json`; if IGTS renames/re-creates types, the map
  needs updating (validation: booking refuses loudly if a roomBooking studio has no mapping for
  the chosen service, rather than sending an unresolvable instructor).

## What 226 still needs (not in this branch)

Assets + store enrollment (no `whitelabel/studios/` folder exists), and a decision on the
booking-only path: the widget books 226 through the LEGACY 9-endpoint chain with a confirmation
email; the modern endpoint's `type: 'unpaid'` branch suppresses the confirmation email by design.
Either the legacy chain gets ported (fragile) or the backend grows an "unpaid + still notify"
mode for booking-only studios (needs approval). Flow architecture (config-gated provider step,
payment step skipped when the studio doesn't take payments) is ready for it.

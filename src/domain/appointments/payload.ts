/**
 * The booking request bodies, built pure so the tests can pin them field-for-field.
 *
 * These mirror the WIDGET's builders (`confirmationPanel.jsx` + `completeAppointmentBooking.js`),
 * traced 2026-08-16 — not redesigns. Two very different trust models sit behind them:
 *
 *  • `complete-appointment-booking` PRICES SERVER-SIDE (`appointment_types.default_price` +
 *    pricing rules + the location's tax rate). Our `pricingBreakdown` is display parity; only
 *    `.discount` is trusted, and with no promos in v1 we always send 0.
 *  • `appointments/recurring/enhanced` charges WHATEVER `pricingBreakdown.total` says. The
 *    figures handed to `buildRecurringBookingBody` are the client's bill — they must come from
 *    `priceMonthlyCommitment`, whose math is golden-master-pinned to the widget's.
 *
 * ── Times ──────────────────────────────────────────────────────────────────────────────────────
 * A slot's `start_time` is studio wall-clock worn as UTC, and the booking's `date`/`time` are
 * sliced from it with the UTC accessors (`toISOString().split('T')[0]` / `.slice(11, 16)`) —
 * exactly the widget's slicing. Anything involving the device's timezone here books the wrong
 * hour for every client who isn't standing in the studio.
 */

export type AppointmentPaymentKind = 'card' | 'pass' | 'credit';

export interface AppointmentPaymentInput {
  type: AppointmentPaymentKind;
  /** Required for 'card'. A `pm_` id from the client's own saved cards. */
  paymentMethodId?: string | null;
  /** Required for 'pass'. An id straight out of `selectAppointmentPass` — never anything else. */
  passId?: number | null;
  passName?: string | null;
  /** Dollars of studio credit to apply. Rides alongside a card charge or stands alone. */
  useCredit?: number;
}

/** `'2026-08-22T14:00:00.000Z'` → `{ date: '2026-08-22', time: '14:00' }` — UTC slices only. */
export function splitStoredDateTime(storedIso: string): { date: string; time: string } {
  const iso = new Date(storedIso).toISOString();
  return { date: iso.split('T')[0], time: iso.slice(11, 16) };
}

/** The idempotency key shape the widget mints per attempt. */
export function appointmentIdempotencyKey(
  userid: number,
  appointmentTypeId: number,
  now: Date = new Date(),
): string {
  return `appt-${userid}-${appointmentTypeId}-${now.getTime()}`;
}

export interface SingleBookingArgs {
  userid: number;
  dibsStudioId: number;
  appointmentTypeId: number;
  /** The chosen slot's stored start. */
  slotStartIso: string;
  /** The slot's own location when it carries one (263 slots do), else the studio's showing one. */
  locationId: number | null;
  /**
   * The REAL instructor the event will carry. For roomBooking studios this is the config-mapped
   * phantom; for staffed studios the chosen provider. Never 1000 — the event's trainerid must
   * resolve to a real instructor row or the client's upcoming feed hangs server-side.
   */
  instructorId: number;
  payment: AppointmentPaymentInput;
  /** Display-parity figures (server re-prices anyway). From `priceSingleSession`. */
  pricing: { subtotal: number; tax: number; total: number };
  idempotencyKey: string;
}

/** `POST /checkout/complete-appointment-booking` — the widget's body, field for field. */
export function buildSingleBookingBody(args: SingleBookingArgs): Record<string, unknown> {
  const { date, time } = splitStoredDateTime(args.slotStartIso);
  const isPass = args.payment.type === 'pass';
  const useCredit = isPass ? 0 : (args.payment.useCredit ?? 0);

  return {
    userid: args.userid,
    dibsStudioId: args.dibsStudioId,
    appointmentTypeId: args.appointmentTypeId,
    appointmentDetails: {
      date,
      time,
      locationId: args.locationId,
      instructorId: args.instructorId,
      notes: '',
    },
    paymentMethod: {
      type: args.payment.type,
      paymentMethodId: args.payment.type === 'card' ? (args.payment.paymentMethodId ?? null) : null,
      ...(isPass ? { passId: args.payment.passId, passName: args.payment.passName ?? '' } : {}),
      stripeIdempotencyKey: args.idempotencyKey,
      useCredit,
    },
    // Zeroed under a pass, exactly like the widget: a covered booking has no money to describe.
    pricingBreakdown: isPass
      ? { subtotal: 0, discount: 0, tax: 0, total: 0, amount_to_charge: 0 }
      : {
          subtotal: args.pricing.subtotal,
          discount: 0,
          tax: args.pricing.tax,
          total: args.pricing.total,
          amount_to_charge: Math.max(0, parseFloat((args.pricing.total - useCredit).toFixed(2))),
        },
    appliedPromo: null,
    source: 'widget',
  };
}

export interface RecurringBookingArgs {
  userid: number;
  dibsStudioId: number;
  appointmentTypeId: number;
  /** The service's display name — event names and emails are built from it server-side. */
  appointmentTypeName: string;
  instructorId: number;
  /** Email display only. '' is fine for a roomBooking studio. */
  instructorName: string;
  /** Non-conflicted sessions being paid for today, as stored ISO strings, in time order. */
  payNowIsos: string[];
  /** The 40 weekly holds after the last paid session (from `futureHoldSessions`). */
  holdIsos: string[];
  payment: AppointmentPaymentInput;
  /**
   * THE BILL. `total` is what the card is charged (less credit) — from `priceMonthlyCommitment`,
   * never recomputed here.
   */
  pricing: { subtotal: number; tax: number; total: number };
  /** How many payNow sessions the pass covers (0 when no pass). Caps the per-date assignments. */
  passCoveredSessions?: number;
}

/** `POST /appointments/recurring/enhanced` — the widget's body, field for field. */
export function buildRecurringBookingBody(args: RecurringBookingArgs): Record<string, unknown> {
  const useCredit = args.payment.useCredit ?? 0;
  const passId = args.payment.passId ?? null;
  const covered = passId ? Math.min(args.passCoveredSessions ?? 0, args.payNowIsos.length) : 0;
  const sessionsNeedingPayment = args.payNowIsos.length - covered;

  // One assignment per pass-covered date, earliest first — the widget's exact construction.
  const perOccurrenceAssignments = passId
    ? args.payNowIsos.slice(0, covered).map((startDate) => ({
        start_date: startDate,
        paidPassId: passId,
      }))
    : [];

  const isCard = args.payment.type === 'card';

  return {
    userid: args.userid,
    dibsStudioId: args.dibsStudioId,
    appointmentTypeId: args.appointmentTypeId,
    appointmentType: args.appointmentTypeName,
    instructorId: args.instructorId,
    instructorName: args.instructorName,

    payNowOccurrences: args.payNowIsos,
    holdOccurrences: args.holdIsos,
    compedOccurrences: [],
    perOccurrenceAssignments,

    payment: {
      paymentMethodId: isCard ? (args.payment.paymentMethodId ?? null) : null,
      passId,
      passName: args.payment.passName ?? null,
      useCredits: useCredit > 0,
      creditAmount: useCredit,
      // The widget's rule verbatim: a card pays, and a partially-covered pass booking still
      // needs the card for the uncovered remainder.
      chargeCardIfNeeded: isCard || (passId !== null && sessionsNeedingPayment > 0),
      bookUnpaid: !isCard && args.payment.type !== 'pass' && useCredit <= 0,
    },

    pricingBreakdown: {
      subtotal: args.pricing.subtotal,
      discount: 0,
      tax: args.pricing.tax,
      total: args.pricing.total,
      amount_to_charge: Math.max(0, parseFloat((args.pricing.total - useCredit).toFixed(2))),
    },
    appliedPromo: null,

    paymentOption: isCard ? 'charge' : 'unpaid',
    employeeId: null,
    sendConfirmationEmail: true,
    source: 'widget',
  };
}

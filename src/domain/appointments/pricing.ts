/**
 * What an appointment costs — single session and monthly commitment.
 *
 * PURE TypeScript, and deliberately WIDGET-PARITY math rather than a redesign: the recurring
 * endpoint charges whatever `pricingBreakdown.total` the client computes (verified against
 * `create-recurring-appointment-enhanced.js` — the total is client-trusted there), so this file
 * IS the bill for a monthly booking. Every formula and every rounding step below is ported from
 * `MonthlySessionsList.js` / `SingleSessionsBooking.js` and pinned by golden-master tests; a
 * "cleaner" reformulation that rounds differently is a different charge.
 *
 * Dollars in, dollars out (the endpoints speak dollars). Rounding matches the widget:
 * `parseFloat(x.toFixed(2))` at each declared step, nowhere else.
 *
 * Appointments show TAX AS A LINE ITEM; the class flow does not. Do not "harmonise" them —
 * that difference is in the design handoff on purpose.
 */

/** The widget's rounding, verbatim. */
function round2(value: number): number {
  return parseFloat(value.toFixed(2));
}

export interface SingleSessionPricing {
  /** The (possibly pricing-rule-discounted) session price. */
  subtotal: number;
  tax: number;
  total: number;
  /** What the client's credit balance absorbs. */
  creditApplied: number;
  /** What the card is asked for. 0 → no card needed. */
  due: number;
}

/**
 * One session: price + tax, less any applied credit.
 *
 * `priceDollars` is the SLOT's `priceAppt` — on 263 slots that figure is already the
 * pricing-rule-discounted price, so no rule math happens client-side. The server re-prices the
 * charge from its own columns anyway; this exists so the screen and the charge agree.
 */
export function priceSingleSession(args: {
  priceDollars: number;
  /** Percentage, e.g. 4.875 — never a multiplier. */
  taxRatePercent: number;
  /** The client's balance, when they toggled credit on. 0 otherwise. */
  creditAvailable?: number;
  applyCredit?: boolean;
}): SingleSessionPricing {
  const subtotal = round2(args.priceDollars);
  const tax = round2((subtotal * args.taxRatePercent) / 100);
  const total = round2(subtotal + tax);
  const creditApplied =
    args.applyCredit && (args.creditAvailable ?? 0) > 0
      ? round2(Math.min(args.creditAvailable ?? 0, total))
      : 0;
  return { subtotal, tax, total, creditApplied, due: round2(Math.max(0, total - creditApplied)) };
}

export interface MonthlyPricing {
  /** Sessions actually bookable (conflicted ones are excluded BEFORE this math). */
  sessionCount: number;
  /** How many of them an existing pass covers. */
  sessionsCoveredByPass: number;
  /** How many a card/credit must pay for. */
  sessionsNeedingPayment: number;
  /** True when a pass covers some but not all sessions. */
  passCoversPartial: boolean;
  /** True when a pass covers every session — no money moves today. */
  passCoversAll: boolean;
  subtotal: number;
  tax: number;
  total: number;
  creditApplied: number;
  due: number;
}

/**
 * The monthly commitment's "due today" — the widget's `MonthlySessionsList` math, verbatim:
 *
 *   subtotal = (partial pass ? uncovered : all) sessions × price
 *   tax      = subtotal × rate/100        (promos don't exist here in v1; the widget also
 *                                          suppresses them under partial pass coverage)
 *   total    = subtotal + tax
 *   credit   = min(balance, total) when toggled on
 *
 * Conflicted sessions must be filtered out by the CALLER — they are listed on screen but never
 * priced ("You will not be charged"), and the same filtered list feeds `payNowOccurrences`, so
 * the sentence, the total, and the booking cannot disagree about which dates are real.
 */
export function priceMonthlyCommitment(args: {
  sessionCount: number;
  pricePerSession: number;
  /** Percentage, e.g. 4.875. */
  taxRatePercent: number;
  /** Remaining uses on the client's best applicable pass. Infinity for unlimited. 0 for none. */
  passRemainingUses?: number;
  creditAvailable?: number;
  applyCredit?: boolean;
}): MonthlyPricing {
  const sessionCount = Math.max(0, args.sessionCount);
  const passUses = Math.max(0, args.passRemainingUses ?? 0);

  const sessionsCoveredByPass = Math.min(passUses, sessionCount);
  const sessionsNeedingPayment = sessionCount - sessionsCoveredByPass;
  const passCoversAll = sessionCount > 0 && sessionsCoveredByPass === sessionCount;
  const passCoversPartial = sessionsCoveredByPass > 0 && !passCoversAll;

  const subtotal = passCoversPartial
    ? round2(sessionsNeedingPayment * args.pricePerSession)
    : round2(sessionCount * args.pricePerSession);

  const billableSubtotal = passCoversAll ? 0 : subtotal;
  const tax = round2((billableSubtotal * args.taxRatePercent) / 100);
  const total = round2(billableSubtotal + tax);

  const creditApplied =
    args.applyCredit && (args.creditAvailable ?? 0) > 0
      ? round2(Math.min(args.creditAvailable ?? 0, total))
      : 0;

  return {
    sessionCount,
    sessionsCoveredByPass,
    sessionsNeedingPayment,
    passCoversPartial,
    passCoversAll,
    subtotal: passCoversAll ? 0 : subtotal,
    tax,
    total,
    creditApplied,
    due: round2(Math.max(0, total - creditApplied)),
  };
}

/**
 * The renewal preview: "On {month} 25 we charge ${figure} for next month's {n} sessions."
 * Full price — passes and credit are about TODAY's charge, not the subscription's renewal.
 */
export function priceNextMonthPreview(args: {
  sessionCount: number;
  pricePerSession: number;
  taxRatePercent: number;
}): { subtotal: number; tax: number; total: number } {
  const subtotal = round2(args.sessionCount * args.pricePerSession);
  const tax = round2((subtotal * args.taxRatePercent) / 100);
  return { subtotal, tax, total: round2(subtotal + tax) };
}

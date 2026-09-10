/**
 * What a class will actually COST at the till — the client-side mirror of dibs-api's
 * `priceClassForClient`.
 *
 * ── Why the app computes anything at all ───────────────────────────────────────────────────────
 * The server prices the class and refuses to charge a number the client was not shown. That
 * refusal is only possible if the app can say what it showed, so this is the one function that
 * decides it, and `displayedTotalCents` on the booking request comes from here and nowhere else.
 *
 * It is NOT a second pricing brain. Every input is a number the server already computed and put on
 * the schedule row: `pricing_rule.discounted_price` is the backend's own arithmetic, `price_dibs`
 * is the studio's list price, `location.tax_rate` is the studio's rate. This only adds them up.
 * If it ever disagrees with the server the booking is refused with `price_changed`, the client is
 * shown the true figure, and nothing is charged — so the failure mode is a re-render, not a
 * wrong charge.
 *
 * ── Tax is the whole reason this exists ────────────────────────────────────────────────────────
 * The schedule row shows "$22" — the pre-tax drop-in. Charging $23.82 against a screen that said
 * $22 is precisely the "saw one number, was billed another" problem the server-side refusal
 * exists to prevent, so the class detail screen shows the TOTAL and the button carries it.
 *
 * ── Rounding matches the server exactly, and that is checked ───────────────────────────────────
 * The server works in integer cents: `Math.round(subtotalCents * rate / 100)`. Doing the same
 * here, from the same inputs, is what keeps a legitimate booking from tripping the mismatch alert
 * on every single tap. Cents in, cents out — never a float total.
 */
import type { ScheduleEvent } from '@/api/schemas/schedule';
import { formatBalance, formatPrice } from '@/domain/money/format';

export type ClassChargeStatus =
  /** A real price a card can pay. */
  | 'chargeable'
  /** `free_class` — bookable, but never through a card, and a $0 PaymentIntent is rejected. */
  | 'free'
  /** No usable price: `price_dibs` null or 0, which means "priced elsewhere", NOT free. */
  | 'unknown';

export interface ClassCharge {
  status: ClassChargeStatus;
  /** Pre-tax, in cents. What the studio calls the drop-in price. */
  subtotalCents: number;
  /** The list price before any off-peak rule, in cents. Equal to subtotal when no rule applied. */
  listPriceCents: number;
  /** True when the backend applied a dynamic-pricing rule to this session. */
  isDiscounted: boolean;
  taxCents: number;
  /** Subtotal + tax. THE number sent as `displayedTotalCents` and shown on the button. */
  totalCents: number;
  /** "$22" — the drop-in, cents dropped when there are none. */
  subtotalLabel: string;
  /** "$1.82" — always two decimals; a tax line reading "$2" would be a rounding claim. */
  taxLabel: string;
  /** "$23.82" — what the card is charged. Always two decimals for the same reason. */
  totalLabel: string;
  /**
   * The FIRST-CLASS PRICE (2026-09-10). True when the subtotal above IS the studio's first-class
   * price rather than the class's own. Mirrors the server's `firstClassApplied`: the app only
   * ever says "I want it" and the server re-prices; this is what the app SHOWED.
   */
  firstClassApplied: boolean;
  /** What the class costs WITHOUT the first-class price: the off-peak price if a rule applied, else list. */
  regularSubtotalCents: number;
  /** "$22" — the struck-through figure beside a first-class price. Equal to subtotalLabel otherwise. */
  regularSubtotalLabel: string;
  /** regularSubtotal − subtotal when applied, else 0. */
  savingsCents: number;
}

export interface ClassChargeOptions {
  /**
   * Apply the studio's first-class price to this class. The caller has ALREADY established that
   * the row carries `first_class_offer` and that this client is eligible — this only does the
   * arithmetic, exactly as the server does it: subtotal = priceCents, tax on that.
   */
  firstClass?: { priceCents: number } | null;
}

const toCents = (dollars: number): number => Math.round(dollars * 100);

const empty = (status: ClassChargeStatus, currency: string): ClassCharge => ({
  status,
  subtotalCents: 0,
  listPriceCents: 0,
  isDiscounted: false,
  taxCents: 0,
  totalCents: 0,
  subtotalLabel: formatPrice(0, currency),
  taxLabel: formatBalance(0, currency),
  totalLabel: formatBalance(0, currency),
  firstClassApplied: false,
  regularSubtotalCents: 0,
  regularSubtotalLabel: formatPrice(0, currency),
  savingsCents: 0,
});

/**
 * @param event    a raw `get-schedule` row
 * @param currency ISO-4217 from get-basic-config. Defaults to USD only because every pilot is US.
 */
export function resolveClassCharge(
  event: ScheduleEvent,
  currency = 'USD',
  { firstClass = null }: ClassChargeOptions = {},
): ClassCharge {
  // Checked BEFORE the price: several studios leave `price_dibs` populated on classes they have
  // since flagged free. Same order as the server.
  if (event.free_class === true) return empty('free', currency);

  const listPrice = typeof event.price_dibs === 'number' ? event.price_dibs : null;
  if (listPrice === null || !Number.isFinite(listPrice) || listPrice <= 0) {
    // Zero and null are NOT free — pass-only and priced-elsewhere classes look like this, and
    // telling somebody a class is free when it is not is worse than saying nothing.
    return empty('unknown', currency);
  }

  const listPriceCents = toCents(listPrice);

  // The backend already did the pricing-rule arithmetic; take its number, never re-derive one.
  const ruleDiscounted =
    event.pricing_rule && typeof event.pricing_rule.discounted_price === 'number'
      ? toCents(event.pricing_rule.discounted_price)
      : null;

  const regularSubtotalCents = ruleDiscounted ?? listPriceCents;

  // The first-class price replaces the subtotal ONLY when it is lower — the server's rule 5
  // (`priceClassWithMatcher`): equal or higher is "not_cheaper" and the class prices normally.
  const firstClassPriceCents =
    firstClass && Number.isInteger(firstClass.priceCents) && firstClass.priceCents > 0
      ? firstClass.priceCents
      : null;
  const firstClassApplied =
    firstClassPriceCents !== null && firstClassPriceCents < regularSubtotalCents;
  const subtotalCents = firstClassApplied ? firstClassPriceCents : regularSubtotalCents;

  // `dibs_studio_locations.tax_rate` is a PERCENTAGE (8.25 means 8.25%), not a multiplier —
  // dividing by 100 is what stops a $100 class being charged $487.50 of tax.
  const taxRatePercent =
    typeof event.location?.tax_rate === 'number' && Number.isFinite(event.location.tax_rate)
      ? event.location.tax_rate
      : 0;
  const taxCents = taxRatePercent > 0 ? Math.round((subtotalCents * taxRatePercent) / 100) : 0;
  const totalCents = subtotalCents + taxCents;

  return {
    status: 'chargeable',
    subtotalCents,
    listPriceCents,
    isDiscounted: ruleDiscounted !== null && ruleDiscounted < listPriceCents,
    taxCents,
    totalCents,
    subtotalLabel: formatPrice(subtotalCents / 100, currency),
    taxLabel: formatBalance(taxCents / 100, currency),
    totalLabel: formatBalance(totalCents / 100, currency),
    firstClassApplied,
    regularSubtotalCents,
    regularSubtotalLabel: formatPrice(regularSubtotalCents / 100, currency),
    savingsCents: firstClassApplied ? regularSubtotalCents - subtotalCents : 0,
  };
}

/**
 * Rebuild a charge from the breakdown the SERVER sent back on a `409 price_changed`.
 *
 * The server's figure is the one the client is being asked to confirm, so it replaces whatever the
 * schedule row implied rather than being reconciled with it.
 */
export function chargeFromServerBreakdown(
  breakdown: {
    subtotalCents: number;
    listPriceCents: number;
    discountedPriceCents: number | null;
    taxCents: number;
    totalCents: number;
    isFree: boolean;
    priceAvailable: boolean;
    /** Optional: an older backend sends none of these, which reads as "not applied". */
    firstClassApplied?: boolean;
    firstClassSavingsCents?: number;
  },
  currency = 'USD',
): ClassCharge {
  if (!breakdown.priceAvailable) return empty('unknown', currency);
  if (breakdown.isFree || breakdown.totalCents <= 0) return empty('free', currency);

  const firstClassApplied = breakdown.firstClassApplied === true;
  // When applied, `subtotalCents` IS the first-class price; the regular figure is what it beat.
  const regularSubtotalCents = firstClassApplied
    ? breakdown.subtotalCents + (breakdown.firstClassSavingsCents ?? 0)
    : breakdown.subtotalCents;

  return {
    status: 'chargeable',
    subtotalCents: breakdown.subtotalCents,
    listPriceCents: breakdown.listPriceCents,
    isDiscounted:
      breakdown.discountedPriceCents !== null &&
      breakdown.discountedPriceCents < breakdown.listPriceCents,
    taxCents: breakdown.taxCents,
    totalCents: breakdown.totalCents,
    subtotalLabel: formatPrice(breakdown.subtotalCents / 100, currency),
    taxLabel: formatBalance(breakdown.taxCents / 100, currency),
    totalLabel: formatBalance(breakdown.totalCents / 100, currency),
    firstClassApplied,
    regularSubtotalCents,
    regularSubtotalLabel: formatPrice(regularSubtotalCents / 100, currency),
    savingsCents: firstClassApplied ? regularSubtotalCents - breakdown.subtotalCents : 0,
  };
}

/**
 * How much of a class the client's studio credit pays for — the app's side of the answer.
 *
 * PURE TypeScript. A MIRROR of `dibs-api/services/shared/checkout/class-credit/resolve-credit-split.js`,
 * not a second brain: every input is a number the server already computed and put on a response,
 * and the server re-resolves the split from the LIVE balance and refuses `credit_changed` if what
 * the app displayed does not match. So a drift here surfaces as a re-render, never as a mischarge.
 *
 * It exists at all because the app has to SHOW the split before the server has been asked — the
 * "$12.50 credit · $28.26 card" line sits above the button, and `displayedCreditCents` is what the
 * server checks its own answer against.
 *
 * ── Integer cents throughout, and that is not a style preference ─────────────────────────────
 * `credit.credit` is a FLOAT column of dollars. `40.76 - 12.50` is not reliably `28.26` in binary
 * floating point — it can be `28.259999999999998`, which is a card charged a penny less than the
 * screen said. Convert at the boundary, subtract in cents.
 *
 * ── The 50-cent floor is Stripe's, not ours ─────────────────────────────────────────────────
 * A card charge below Stripe's minimum is rejected outright, so a split leaving 30c on the card is
 * not a split — it is a booking that dies at the sheet. When the remainder would fall below the
 * floor the credit is TRIMMED so the card portion clears it: the client spends a little less credit
 * than they hold, and the booking works. Say so when it happens; an unexplained number is worse.
 */

/** Stripe's USD minimum, in cents. Every studio on the platform is USD today. */
export const STRIPE_MIN_CHARGE_CENTS = 50;

export type CreditSplitKind = 'none' | 'partial' | 'credit-only';

export interface CreditSplit {
  kind: CreditSplitKind;
  /** What the class costs. Unchanged by any of this. */
  totalCents: number;
  /** How much credit this booking consumes. */
  creditAppliedCents: number;
  /** What the card is charged. 0 for `credit-only`. */
  cardCents: number;
  /** The balance this was resolved against. */
  balanceCents: number;
  /** True when the credit was reduced so the card portion clears Stripe's floor. */
  trimmedForMinimum: boolean;
}

/** Dollars off a FLOAT column → integer cents. Negative and junk balances read as zero. */
export function balanceToCents(creditDollars: number | null | undefined): number {
  const dollars = Number(creditDollars);
  if (!Number.isFinite(dollars) || dollars <= 0) return 0;
  return Math.round(dollars * 100);
}

export interface ResolveCreditSplitArgs {
  /** The SERVER's price for the class, in cents. Never a figure the app invented. */
  totalCents: number;
  balanceCents: number;
  /** The client's choice. False means "save my credit" and is honoured before anything else. */
  applyCredit?: boolean;
}

export function resolveCreditSplit({
  totalCents,
  balanceCents,
  applyCredit = true,
}: ResolveCreditSplitArgs): CreditSplit {
  const total = Number.isFinite(totalCents) ? Math.trunc(totalCents) : 0;
  const balance = Number.isFinite(balanceCents) && balanceCents > 0 ? Math.trunc(balanceCents) : 0;

  const none = (): CreditSplit => ({
    kind: 'none',
    totalCents: total > 0 ? total : 0,
    creditAppliedCents: 0,
    cardCents: total > 0 ? total : 0,
    balanceCents: balance,
    trimmedForMinimum: false,
  });

  if (total <= 0) return none();
  // The opt-out is the only signal carrying the client's choice, so it is honoured first.
  if (applyCredit !== true) return none();
  if (balance <= 0) return none();

  // Covers the lot. No card, no sheet, no Stripe minimum to worry about.
  if (balance >= total) {
    return {
      kind: 'credit-only',
      totalCents: total,
      creditAppliedCents: total,
      cardCents: 0,
      balanceCents: balance,
      trimmedForMinimum: false,
    };
  }

  let creditAppliedCents = balance;
  let cardCents = total - creditAppliedCents;
  let trimmedForMinimum = false;

  if (cardCents < STRIPE_MIN_CHARGE_CENTS) {
    creditAppliedCents = total - STRIPE_MIN_CHARGE_CENTS;
    cardCents = STRIPE_MIN_CHARGE_CENTS;
    trimmedForMinimum = true;
  }

  // A class priced below Stripe's own minimum cannot be split at all — any credit would leave an
  // uncharageable remainder. Rare (a $0.40 class) but the honest answer is to charge the card.
  if (creditAppliedCents <= 0) return none();

  return {
    kind: 'partial',
    totalCents: total,
    creditAppliedCents,
    cardCents,
    balanceCents: balance,
    trimmedForMinimum,
  };
}

export interface CreditAllocation<T> {
  item: T;
  split: CreditSplit;
}

/**
 * Spread ONE balance across several classes, in the order they will actually be booked.
 *
 * The cart books line by line and the server resolves each booking against the balance as it
 * stands at that moment — so the app has to model the same running-down to display honest numbers.
 * Allocating greedily in run order is what makes the app's answer and the server's agree.
 *
 * Only CHARGEABLE lines are passed here. A pass-covered line costs nothing and consumes no credit.
 *
 * If a line fails mid-run its credit is never taken, so every later allocation shifts by one line.
 * The server notices and refuses `credit_changed`, and the app re-renders — which is why this being
 * a prediction rather than a reservation is safe.
 */
export function allocateCreditAcrossLines<T>(
  items: readonly T[],
  totalCentsOf: (item: T) => number,
  balanceCents: number,
  applyCredit = true,
): CreditAllocation<T>[] {
  let remaining = applyCredit ? Math.max(0, Math.trunc(balanceCents) || 0) : 0;

  return items.map((item) => {
    const split = resolveCreditSplit({
      totalCents: totalCentsOf(item),
      balanceCents: remaining,
      applyCredit,
    });
    remaining -= split.creditAppliedCents;
    return { item, split };
  });
}

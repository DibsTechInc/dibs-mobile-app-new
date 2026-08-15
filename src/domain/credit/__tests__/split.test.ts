/**
 * The credit split, mirrored from the server.
 *
 * These are golden-master cases: the same inputs are pinned in
 * `dibs-api/services/shared/checkout/class-credit/__tests__/resolve-credit-split.test.js`. If one
 * of these fails, the mirror has drifted — and a drift means every booking refuses with
 * `credit_changed` rather than mis-charging one, which is the safe direction but still a dead
 * screen.
 */
import {
  allocateCreditAcrossLines,
  balanceToCents,
  resolveCreditSplit,
  STRIPE_MIN_CHARGE_CENTS,
} from '../split';

/** The plan's worked example: a $40.76 class against a $12.50 balance. */
const CLASS_CENTS = 4076;

describe('the three shapes', () => {
  it('splits a class the balance partly covers', () => {
    const split = resolveCreditSplit({ totalCents: CLASS_CENTS, balanceCents: 1250 });
    expect(split).toEqual({
      kind: 'partial',
      totalCents: 4076,
      creditAppliedCents: 1250,
      cardCents: 2826,
      balanceCents: 1250,
      trimmedForMinimum: false,
    });
  });

  it('takes the whole thing from credit when the balance covers it', () => {
    const split = resolveCreditSplit({ totalCents: CLASS_CENTS, balanceCents: 5000 });
    expect(split.kind).toBe('credit-only');
    expect(split.creditAppliedCents).toBe(4076);
    expect(split.cardCents).toBe(0);
  });

  it('is credit-only at EXACTLY the price, not partial', () => {
    // The boundary decides which endpoint the app calls: a $0 PaymentIntent is rejected outright.
    const split = resolveCreditSplit({ totalCents: CLASS_CENTS, balanceCents: CLASS_CENTS });
    expect(split.kind).toBe('credit-only');
  });

  it('applies nothing when there is no balance', () => {
    const split = resolveCreditSplit({ totalCents: CLASS_CENTS, balanceCents: 0 });
    expect(split.kind).toBe('none');
    expect(split.cardCents).toBe(4076);
  });
});

describe('the client can say no', () => {
  it('honours applyCredit=false before anything else', () => {
    const split = resolveCreditSplit({
      totalCents: CLASS_CENTS,
      balanceCents: 100000,
      applyCredit: false,
    });
    expect(split.kind).toBe('none');
    expect(split.creditAppliedCents).toBe(0);
    expect(split.cardCents).toBe(4076);
  });
});

describe("Stripe's 50-cent floor", () => {
  it('trims the credit so the card portion clears the minimum', () => {
    // Balance $40.50 against a $40.76 class would leave 26c on the card, which Stripe rejects.
    const split = resolveCreditSplit({ totalCents: CLASS_CENTS, balanceCents: 4050 });
    expect(split.kind).toBe('partial');
    expect(split.cardCents).toBe(STRIPE_MIN_CHARGE_CENTS);
    expect(split.creditAppliedCents).toBe(4026);
    // Surfaced because the client is being asked to spend less credit than they hold.
    expect(split.trimmedForMinimum).toBe(true);
  });

  it('does not trim when the remainder already clears it', () => {
    const split = resolveCreditSplit({ totalCents: CLASS_CENTS, balanceCents: 4026 });
    expect(split.cardCents).toBe(50);
    expect(split.trimmedForMinimum).toBe(false);
  });

  it('refuses to PART-pay a class priced below the floor', () => {
    // 30c of credit against a 40c class: trimming to leave 50c on the card is impossible when the
    // whole class is 40c, so any credit at all leaves an uncharageable remainder. The card takes
    // the lot. Only reachable when the balance is BELOW a sub-floor price — a bigger balance
    // covers such a class outright and never gets here.
    const split = resolveCreditSplit({ totalCents: 40, balanceCents: 30 });
    expect(split.kind).toBe('none');
    expect(split.cardCents).toBe(40);
  });

  it('still pays a sub-floor class entirely from credit when the balance covers it', () => {
    // The floor is a CARD minimum. With no card involved there is nothing for it to constrain.
    const split = resolveCreditSplit({ totalCents: 40, balanceCents: 1000 });
    expect(split.kind).toBe('credit-only');
    expect(split.cardCents).toBe(0);
  });
});

describe('junk in', () => {
  it('never returns a negative or NaN anything', () => {
    for (const [total, balance] of [
      [0, 1000],
      [-100, 1000],
      [Number.NaN, 1000],
      [CLASS_CENTS, -50],
      [CLASS_CENTS, Number.NaN],
    ]) {
      const split = resolveCreditSplit({ totalCents: total, balanceCents: balance });
      expect(Number.isFinite(split.creditAppliedCents)).toBe(true);
      expect(Number.isFinite(split.cardCents)).toBe(true);
      expect(split.creditAppliedCents).toBeGreaterThanOrEqual(0);
      expect(split.cardCents).toBeGreaterThanOrEqual(0);
    }
  });

  it('converts a FLOAT dollar balance without a rounding surprise', () => {
    expect(balanceToCents(12.5)).toBe(1250);
    expect(balanceToCents(0.1 + 0.2)).toBe(30);
    expect(balanceToCents(-5)).toBe(0);
    expect(balanceToCents(null)).toBe(0);
    expect(balanceToCents(undefined)).toBe(0);
  });
});

describe('spreading one balance across a cart', () => {
  const line = (cents: number) => ({ cents });
  const cents = (l: { cents: number }) => l.cents;

  it('runs the balance down in booking order', () => {
    // $50 across two $40.76 classes: the first is covered outright, the second gets the remainder.
    const allocated = allocateCreditAcrossLines(
      [line(CLASS_CENTS), line(CLASS_CENTS)],
      cents,
      5000,
    );

    expect(allocated[0].split.kind).toBe('credit-only');
    expect(allocated[0].split.creditAppliedCents).toBe(4076);
    expect(allocated[1].split.kind).toBe('partial');
    expect(allocated[1].split.creditAppliedCents).toBe(924);
    expect(allocated[1].split.cardCents).toBe(3152);
  });

  it('never spends more than the balance across the whole cart', () => {
    const allocated = allocateCreditAcrossLines(
      [line(CLASS_CENTS), line(CLASS_CENTS), line(CLASS_CENTS)],
      cents,
      5000,
    );
    const spent = allocated.reduce((sum, a) => sum + a.split.creditAppliedCents, 0);
    expect(spent).toBeLessThanOrEqual(5000);
  });

  it('gives later lines nothing once it is exhausted', () => {
    const allocated = allocateCreditAcrossLines([line(4076), line(4076)], cents, 4076);
    expect(allocated[0].split.kind).toBe('credit-only');
    expect(allocated[1].split.kind).toBe('none');
    expect(allocated[1].split.cardCents).toBe(4076);
  });

  it('applies nothing anywhere when the client opted out', () => {
    const allocated = allocateCreditAcrossLines([line(4076)], cents, 100000, false);
    expect(allocated[0].split.kind).toBe('none');
  });
});

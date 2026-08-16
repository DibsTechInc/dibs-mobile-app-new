/**
 * The rule under test throughout: **the app may only say what it actually knows.** An empty card
 * list is not evidence of an empty wallet, and a card on file is not a promise about the charge —
 * the sheet is still where the choice is made.
 */
import { describeCheckoutPayment } from '../checkout-method';
import type { SavedCard } from '../cards';

const visa: SavedCard = {
  id: 'pm_visa',
  platform: 'Studio',
  brand: 'Visa',
  last4: '4242',
  expMonth: 2,
  expYear: 2029,
  fingerprint: 'fp1',
  isDefault: true,
  label: 'Visa ending 4242',
  expiryLabel: 'Expires 02/29',
  raw: { brand: 'visa', exp_month: 2, exp_year: 2029, last4: '4242' },
};

const base = {
  chargeableCount: 0,
  coveredCount: 0,
  passNames: [] as string[],
  card: null,
  status: 'ready' as const,
};

describe('describeCheckoutPayment', () => {
  it('names the card on file and keeps the choice open', () => {
    const result = describeCheckoutPayment({ ...base, chargeableCount: 1, card: visa });

    expect(result.label).toBe('Paying with Visa ending 4242');
    // Not a promise. The sheet is where the card is picked, and saying otherwise is the widget's
    // "the row named a card the charge never touched" bug pointed the other way.
    expect(result.caption).toBe('You can pick a different card when you confirm.');
    expect(result.needsCard).toBe(false);
  });

  it('says nothing about cards before Stripe has answered', () => {
    // The moment that matters: `paymentOptionsAll` is legitimately empty on mount because it is
    // never rehydrated. Branching on length alone tells a client with four saved Visas that they
    // have none, for the whole round trip.
    for (const status of ['idle', 'loading', 'error'] as const) {
      const result = describeCheckoutPayment({ ...base, chargeableCount: 1, status });
      expect(result.label).toBeNull();
      expect(result.needsCard).toBe(false);
    }
  });

  it('only claims an empty wallet once the lookup is ready', () => {
    const result = describeCheckoutPayment({ ...base, chargeableCount: 1, status: 'ready' });

    expect(result.label).toBe('No card saved yet');
    expect(result.needsCard).toBe(true);
  });

  it('says the whole thing in ONE line for a pass-only cart', () => {
    // The screen used to stack a centred "Covered by your pass — nothing to pay." above a
    // left-aligned "Paying with your Unlimited Test" — the same fact twice in two alignments.
    // This line is now the only payment statement a pass-only cart renders.
    const result = describeCheckoutPayment({
      ...base,
      coveredCount: 1,
      passNames: ['10-class Package'],
    });

    expect(result.label).toBe('Covered by your 10-class Package — nothing to pay.');
    expect(result.caption).toBeNull();
    expect(result.needsCard).toBe(false);
  });

  it('counts a pass covering several classes', () => {
    const result = describeCheckoutPayment({
      ...base,
      coveredCount: 3,
      passNames: ['10-class Package'],
    });

    expect(result.label).toBe('Covered by your 10-class Package — nothing to pay.');
    expect(result.caption).toBe('Covers all 3 classes.');
  });

  it('names both halves of a mixed cart', () => {
    const result = describeCheckoutPayment({
      ...base,
      chargeableCount: 1,
      coveredCount: 1,
      passNames: ['Month Unlimited'],
      card: visa,
    });

    expect(result.label).toBe('Paying with your Month Unlimited, then Visa ending 4242');
  });

  it('still names the pass half when the card half is unknown', () => {
    // A partial truth is better than silence here: the client learns their membership is covering
    // one of the two, which is the fact they are least sure about.
    const result = describeCheckoutPayment({
      ...base,
      chargeableCount: 1,
      coveredCount: 1,
      passNames: ['Month Unlimited'],
      status: 'loading',
    });

    expect(result.label).toBe('Paying with your Month Unlimited, then a card');
    expect(result.needsCard).toBe(false);
  });

  it('joins two passes but stops naming past that', () => {
    expect(
      describeCheckoutPayment({ ...base, coveredCount: 2, passNames: ['5 Pack', 'Month Unlimited'] })
        .label,
    ).toBe('Covered by your 5 Pack and Month Unlimited — nothing to pay.');

    expect(
      describeCheckoutPayment({ ...base, coveredCount: 3, passNames: ['A', 'B', 'C'] }).label,
    ).toBe('Covered by your passes — nothing to pay.');
  });

  it('says nothing at all for an empty cart', () => {
    expect(describeCheckoutPayment(base)).toEqual({ label: null, caption: null, needsCard: false });
  });
});

describe('studio credit', () => {
  const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const base = {
    chargeableCount: 1,
    coveredCount: 0,
    passNames: [],
    card: { id: 'pm_1', label: 'Visa ending 4242' } as never,
    status: 'ready' as const,
    formatCents: money,
  };

  it('names both halves of a partial split, and the split OUTRANKS the card hint', () => {
    // "$12.50 credit · $28.26 card" — the plan's worked example. Which card is a detail; how much
    // is coming from where is the thing being agreed to.
    const summary = describeCheckoutPayment({
      ...base,
      creditAppliedCents: 1250,
      cardCents: 2826,
    });
    expect(summary.caption).toBe('$12.50 credit · $28.26 card');
    expect(summary.needsCard).toBe(false);
  });

  it('says no card is needed when credit covers the lot', () => {
    // A real branch, not a variation: a different endpoint is called and Stripe is never involved.
    const summary = describeCheckoutPayment({
      ...base,
      card: null,
      creditAppliedCents: 4076,
      cardCents: 0,
    });
    expect(summary.label).toBe('Paying with $40.76 studio credit');
    expect(summary.caption).toMatch(/no card needed/i);
    // The one that matters: a client with no card on file must NOT be told to add one to spend
    // money they already gave the studio.
    expect(summary.needsCard).toBe(false);
  });

  it('still asks for a card when credit only covers part and none is saved', () => {
    const summary = describeCheckoutPayment({
      ...base,
      card: null,
      creditAppliedCents: 1250,
      cardCents: 2826,
    });
    expect(summary.needsCard).toBe(true);
    expect(summary.caption).toBe('$12.50 credit · $28.26 card');
  });

  it('says nothing about credit when none is being applied', () => {
    const summary = describeCheckoutPayment({ ...base, creditAppliedCents: 0, cardCents: 4076 });
    expect(summary.caption).toBe('You can pick a different card when you confirm.');
  });

  it('mentions passes and credit together on a mixed cart', () => {
    const summary = describeCheckoutPayment({
      ...base,
      coveredCount: 1,
      passNames: ['10-Class Pass'],
      card: null,
      creditAppliedCents: 4076,
      cardCents: 0,
    });
    expect(summary.label).toBe('Paying with your 10-Class Pass, then $40.76 studio credit');
  });
});

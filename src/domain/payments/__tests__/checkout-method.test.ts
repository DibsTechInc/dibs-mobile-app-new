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

  it('never mentions a card for a pass-only cart', () => {
    const result = describeCheckoutPayment({
      ...base,
      coveredCount: 1,
      passNames: ['10-class Package'],
    });

    expect(result.label).toBe('Paying with your 10-class Package');
    expect(result.caption).toBeNull();
    expect(result.needsCard).toBe(false);
  });

  it('counts a pass covering several classes', () => {
    const result = describeCheckoutPayment({
      ...base,
      coveredCount: 3,
      passNames: ['10-class Package'],
    });

    expect(result.label).toBe('Paying with your 10-class Package');
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
    ).toBe('Paying with your 5 Pack and Month Unlimited');

    expect(
      describeCheckoutPayment({ ...base, coveredCount: 3, passNames: ['A', 'B', 'C'] }).label,
    ).toBe('Paying with your passes');
  });

  it('says nothing at all for an empty cart', () => {
    expect(describeCheckoutPayment(base)).toEqual({ label: null, caption: null, needsCard: false });
  });
});

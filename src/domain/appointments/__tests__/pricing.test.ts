/**
 * Appointment pricing — golden masters against the widget's `MonthlySessionsList` /
 * `SingleSessionsBooking` math, hand-computed with the widget's own rounding
 * (`parseFloat(x.toFixed(2))` at each declared step). The recurring endpoint charges these
 * figures verbatim, so if one of these fails, the FIXTURE is not what changed — somebody's bill
 * did. 263's real rate (4.875%) and real room price ($125) anchor the fixtures.
 */
import {
  priceMonthlyCommitment,
  priceNextMonthPreview,
  priceSingleSession,
} from '../pricing';

describe('priceSingleSession', () => {
  it('263 Strength Studio: $125 at 4.875% → $131.09 (the handoff’s own figure)', () => {
    const pricing = priceSingleSession({ priceDollars: 125, taxRatePercent: 4.875 });
    expect(pricing).toEqual({ subtotal: 125, tax: 6.09, total: 131.09, creditApplied: 0, due: 131.09 });
  });

  it('applies credit up to the total, never past it', () => {
    const pricing = priceSingleSession({
      priceDollars: 125,
      taxRatePercent: 4.875,
      creditAvailable: 500,
      applyCredit: true,
    });
    expect(pricing.creditApplied).toBe(131.09);
    expect(pricing.due).toBe(0);
  });

  it('partial credit leaves the remainder due', () => {
    const pricing = priceSingleSession({
      priceDollars: 125,
      taxRatePercent: 4.875,
      creditAvailable: 50,
      applyCredit: true,
    });
    expect(pricing.creditApplied).toBe(50);
    expect(pricing.due).toBe(81.09);
  });

  it('credit toggled OFF spends nothing however much they hold', () => {
    const pricing = priceSingleSession({
      priceDollars: 125,
      taxRatePercent: 4.875,
      creditAvailable: 500,
      applyCredit: false,
    });
    expect(pricing.creditApplied).toBe(0);
    expect(pricing.due).toBe(131.09);
  });

  it('a zero tax rate is a zero tax line, not NaN', () => {
    expect(priceSingleSession({ priceDollars: 60, taxRatePercent: 0 })).toEqual({
      subtotal: 60,
      tax: 0,
      total: 60,
      creditApplied: 0,
      due: 60,
    });
  });
});

describe('priceMonthlyCommitment', () => {
  it('two Saturdays at $125, 4.875% → $262.19 due today (the handoff’s figure)', () => {
    const pricing = priceMonthlyCommitment({
      sessionCount: 2,
      pricePerSession: 125,
      taxRatePercent: 4.875,
    });
    expect(pricing.subtotal).toBe(250);
    expect(pricing.tax).toBe(12.19);
    expect(pricing.total).toBe(262.19);
    expect(pricing.due).toBe(262.19);
    expect(pricing.passCoversAll).toBe(false);
    expect(pricing.sessionsNeedingPayment).toBe(2);
  });

  it('five sessions — the expensive end of the booking-date swing', () => {
    const pricing = priceMonthlyCommitment({
      sessionCount: 5,
      pricePerSession: 125,
      taxRatePercent: 4.875,
    });
    // 625 × 0.04875 = 30.46875 → 30.47 (the widget's toFixed step).
    expect(pricing.tax).toBe(30.47);
    expect(pricing.total).toBe(655.47);
  });

  it('partial pass coverage: only UNCOVERED sessions are billed, and promos would not stack', () => {
    // The widget's rule verbatim: subtotal = sessionsThatNeedPayment × price, discount forced 0.
    const pricing = priceMonthlyCommitment({
      sessionCount: 3,
      pricePerSession: 125,
      taxRatePercent: 4.875,
      passRemainingUses: 2,
    });
    expect(pricing.sessionsCoveredByPass).toBe(2);
    expect(pricing.sessionsNeedingPayment).toBe(1);
    expect(pricing.passCoversPartial).toBe(true);
    expect(pricing.subtotal).toBe(125);
    expect(pricing.tax).toBe(6.09);
    expect(pricing.due).toBe(131.09);
  });

  it('a pass covering everything means no money moves today', () => {
    const pricing = priceMonthlyCommitment({
      sessionCount: 2,
      pricePerSession: 125,
      taxRatePercent: 4.875,
      passRemainingUses: 2,
    });
    expect(pricing.passCoversAll).toBe(true);
    expect(pricing.subtotal).toBe(0);
    expect(pricing.tax).toBe(0);
    expect(pricing.total).toBe(0);
    expect(pricing.due).toBe(0);
  });

  it('an unlimited pass (Infinity uses) covers everything', () => {
    const pricing = priceMonthlyCommitment({
      sessionCount: 5,
      pricePerSession: 125,
      taxRatePercent: 4.875,
      passRemainingUses: Infinity,
    });
    expect(pricing.passCoversAll).toBe(true);
    expect(pricing.due).toBe(0);
  });

  it('credit clamps to the total', () => {
    const pricing = priceMonthlyCommitment({
      sessionCount: 2,
      pricePerSession: 125,
      taxRatePercent: 4.875,
      creditAvailable: 1000,
      applyCredit: true,
    });
    expect(pricing.creditApplied).toBe(262.19);
    expect(pricing.due).toBe(0);
  });

  it('zero bookable sessions (every date conflicted) prices to zero, not NaN', () => {
    const pricing = priceMonthlyCommitment({
      sessionCount: 0,
      pricePerSession: 125,
      taxRatePercent: 4.875,
    });
    expect(pricing.total).toBe(0);
    expect(pricing.passCoversAll).toBe(false);
  });
});

describe('priceNextMonthPreview', () => {
  it('the 25th-billing sentence figure: four September Saturdays at $125', () => {
    const preview = priceNextMonthPreview({
      sessionCount: 4,
      pricePerSession: 125,
      taxRatePercent: 4.875,
    });
    // 500 × 0.04875 = 24.375 → 24.38 → 524.38, the handoff's own sentence.
    expect(preview.total).toBe(524.38);
  });
});

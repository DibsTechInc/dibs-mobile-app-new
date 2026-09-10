/**
 * GOLDEN MASTER for the first-class price — pinned to the SAME fixture as dibs-api's
 * `price-class-for-client` suite: studio 88, a $22 class, 8.25% tax, first-class $15.
 * If one of these fails the mirror drifted from the server and every booking would refuse
 * `price_changed`; fix the code, never the numbers.
 */
import type { ScheduleEvent } from '@/api/schemas/schedule';

import { chargeFromServerBreakdown, resolveClassCharge } from '../class-charge';

const classEvent = (overrides: Partial<ScheduleEvent> = {}): ScheduleEvent =>
  ({
    eventid: 1,
    start_date: '2026-09-15T18:00:00.000Z',
    name: 'Ballet',
    price_dibs: 22,
    free_class: false,
    location: { tax_rate: 8.25 },
    ...overrides,
  }) as ScheduleEvent;

describe('resolveClassCharge with the first-class price', () => {
  it('$22 class, 8.25% tax, first-class $15 → 1500 / 124 / 1624, saving 700', () => {
    const charge = resolveClassCharge(classEvent(), 'USD', { firstClass: { priceCents: 1500 } });
    expect(charge).toMatchObject({
      status: 'chargeable',
      firstClassApplied: true,
      subtotalCents: 1500,
      taxCents: 124, // 1500 * 8.25 / 100 = 123.75 → 124
      totalCents: 1624,
      regularSubtotalCents: 2200,
      savingsCents: 700,
      listPriceCents: 2200,
      subtotalLabel: '$15',
      regularSubtotalLabel: '$22',
      totalLabel: '$16.24',
    });
  });

  it('with the 25% off-peak rule the regular subtotal is 1650 and the saving 150', () => {
    const charge = resolveClassCharge(
      classEvent({ pricing_rule: { original_price: 22, discounted_price: 16.5 } }),
      'USD',
      { firstClass: { priceCents: 1500 } },
    );
    expect(charge.firstClassApplied).toBe(true);
    expect(charge.isDiscounted).toBe(true);
    expect(charge.subtotalCents).toBe(1500);
    expect(charge.regularSubtotalCents).toBe(1650);
    expect(charge.savingsCents).toBe(150);
    expect(charge.totalCents).toBe(1624);
  });

  it('does NOT apply when the first-class price is equal or higher (server: not_cheaper)', () => {
    const equal = resolveClassCharge(classEvent(), 'USD', { firstClass: { priceCents: 2200 } });
    expect(equal.firstClassApplied).toBe(false);
    expect(equal.subtotalCents).toBe(2200);
    expect(equal.savingsCents).toBe(0);
    const higher = resolveClassCharge(
      classEvent({ pricing_rule: { original_price: 22, discounted_price: 12 } }),
      'USD',
      { firstClass: { priceCents: 1500 } },
    );
    expect(higher.firstClassApplied).toBe(false);
    expect(higher.subtotalCents).toBe(1200);
  });

  it('is byte-identical to the no-option call when the option is absent', () => {
    expect(resolveClassCharge(classEvent(), 'USD', {})).toEqual(resolveClassCharge(classEvent()));
    expect(resolveClassCharge(classEvent()).firstClassApplied).toBe(false);
    expect(resolveClassCharge(classEvent()).regularSubtotalCents).toBe(2200);
  });

  it('ignores a zero, negative or fractional price', () => {
    for (const priceCents of [0, -5, 15.5]) {
      expect(
        resolveClassCharge(classEvent(), 'USD', { firstClass: { priceCents } }).firstClassApplied,
      ).toBe(false);
    }
  });

  it('never applies to a free class or an unpriced one', () => {
    expect(
      resolveClassCharge(classEvent({ free_class: true }), 'USD', { firstClass: { priceCents: 1500 } }).status,
    ).toBe('free');
    expect(
      resolveClassCharge(classEvent({ price_dibs: 0 }), 'USD', { firstClass: { priceCents: 1500 } }).status,
    ).toBe('unknown');
  });
});

describe('chargeFromServerBreakdown with the first-class fields', () => {
  const base = {
    priceAvailable: true,
    isFree: false,
    listPriceCents: 2200,
    discountedPriceCents: null,
    subtotalCents: 1500,
    taxCents: 124,
    totalCents: 1624,
  };

  it('reads an applied first-class breakdown and recovers the regular subtotal', () => {
    const charge = chargeFromServerBreakdown({ ...base, firstClassApplied: true, firstClassSavingsCents: 700 });
    expect(charge.firstClassApplied).toBe(true);
    expect(charge.regularSubtotalCents).toBe(2200);
    expect(charge.savingsCents).toBe(700);
    expect(charge.totalCents).toBe(1624);
  });

  it('treats an older backend (fields absent) as not applied', () => {
    const charge = chargeFromServerBreakdown({ ...base, subtotalCents: 2200, taxCents: 182, totalCents: 2382 });
    expect(charge.firstClassApplied).toBe(false);
    expect(charge.regularSubtotalCents).toBe(2200);
    expect(charge.savingsCents).toBe(0);
  });
});

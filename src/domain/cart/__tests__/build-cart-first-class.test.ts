/**
 * The cart applying the first-class price: pre-activated by default, one line only, opt-out,
 * pass-wins-unless-overridden, and the server's exclusion.
 */
import type { ScheduleEvent } from '@/api/schemas/schedule';

import { buildCart } from '../build-cart';

const OPTIONS = { showInstructor: true, currency: 'USD' };
const OFFER = { priceCents: 1500, savingsCents: 700, listPriceCents: 2200 };

function event(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    eventid: 1,
    start_date: '2026-09-15T18:00:00.000Z',
    end_date: '2026-09-15T19:00:00.000Z',
    name: 'Flow',
    seats: 16,
    spots_booked: 1,
    price_dibs: 22,
    free_class: false,
    eventtype: 'class',
    location: { name: 'Studio', tax_rate: 8.25 },
    first_class_offer: OFFER,
    ...overrides,
  } as ScheduleEvent;
}

const unlimitedPass = {
  id: 501,
  totalUses: null,
  usesCount: 3,
  expiresAt: '2099-01-01T00:00:00.000Z',
  private_pass: false,
  is_placeholder: false,
  studioPackage: { name: 'Month Unlimited', unlimited: true, is_placeholder: false },
} as never;

describe('buildCart — first-class price', () => {
  it('prices the cart normally with no eligibility (guest / resolving / failed read)', () => {
    const cart = buildCart([event()], [1], OPTIONS);
    expect(cart.lines[0].charge?.totalCents).toBe(2382);
    expect(cart.lines[0].firstClass).toBeNull();
    expect(cart.lines[0].firstClassOffer).toEqual(OFFER);
    expect(cart.firstClassEventId).toBeNull();
    expect(cart.firstClassSavingsCents).toBe(0);
  });

  it('applies it, pre-activated, to the one eligible line', () => {
    const cart = buildCart([event()], [1], { ...OPTIONS, firstClassEligibility: { eligible: true } });
    expect(cart.lines[0].firstClass).toBe('applied');
    expect(cart.lines[0].charge).toMatchObject({ firstClassApplied: true, subtotalCents: 1500, totalCents: 1624 });
    expect(cart.totalCents).toBe(1624);
    expect(cart.totalLabel).toBe('$16.24');
    expect(cart.firstClassEventId).toBe(1);
    expect(cart.firstClassSavingsCents).toBe(700);
  });

  it('puts it on ONE line — the biggest saving — and prices the rest normally', () => {
    const events = [
      event({ eventid: 1 }),
      event({ eventid: 2, price_dibs: 28, first_class_offer: { priceCents: 1500, savingsCents: 1300, listPriceCents: 2800 } }),
    ];
    const cart = buildCart(events, [1, 2], { ...OPTIONS, firstClassEligibility: { eligible: true } });
    expect(cart.lines.map((l) => l.firstClass)).toEqual([null, 'applied']);
    expect(cart.lines[0].charge?.totalCents).toBe(2382);
    expect(cart.lines[1].charge?.totalCents).toBe(1624);
    expect(cart.totalCents).toBe(2382 + 1624);
  });

  it('opt-out prices the line normally but still reports it as available', () => {
    const cart = buildCart([event()], [1], {
      ...OPTIONS,
      firstClassEligibility: { eligible: true },
      firstClassOptOut: true,
    });
    expect(cart.lines[0].firstClass).toBe('available');
    expect(cart.lines[0].charge?.totalCents).toBe(2382);
    expect(cart.firstClassEventId).toBe(1);
    expect(cart.firstClassSavingsCents).toBe(0);
  });

  it('a pass wins: the covered line offers the swap, and takes it only when overridden', () => {
    const covered = buildCart([event()], [1], {
      ...OPTIONS,
      passes: [unlimitedPass],
      firstClassEligibility: { eligible: true },
    });
    expect(covered.lines[0].state).toBe('covered');
    expect(covered.lines[0].firstClass).toBe('passInstead');
    expect(covered.totalCents).toBe(0);

    const swapped = buildCart([event()], [1], {
      ...OPTIONS,
      passes: [unlimitedPass],
      firstClassEligibility: { eligible: true },
      firstClassOverPassEventId: 1,
    });
    expect(swapped.lines[0].state).toBe('ready');
    expect(swapped.lines[0].passId).toBeNull();
    expect(swapped.lines[0].firstClass).toBe('applied');
    expect(swapped.totalCents).toBe(1624);
  });

  it('never applies to a line the server refused, and moves on to the next candidate', () => {
    const events = [event({ eventid: 1 }), event({ eventid: 2 })];
    const cart = buildCart(events, [1, 2], {
      ...OPTIONS,
      firstClassEligibility: { eligible: true },
      firstClassExcludedEventIds: new Set([1]),
    });
    expect(cart.lines.map((l) => l.firstClass)).toEqual([null, 'applied']);
  });

  it('skips a row with no offer and a full class', () => {
    const cart = buildCart(
      [event({ eventid: 1, first_class_offer: null }), event({ eventid: 2, spots_booked: 16 })],
      [1, 2],
      { ...OPTIONS, firstClassEligibility: { eligible: true } },
    );
    expect(cart.lines.map((l) => l.firstClass)).toEqual([null, null]);
    expect(cart.firstClassEventId).toBeNull();
  });
});

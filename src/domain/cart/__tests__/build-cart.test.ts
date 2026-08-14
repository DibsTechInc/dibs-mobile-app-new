/**
 * The cart's resolution rules.
 *
 * The whole point of this module is that a cart holds IDS and the schedule holds truth, so every
 * test here is really about what happens when those two disagree — which they do constantly, and
 * silently, in real use.
 *
 * Fixtures are trimmed copies of REAL `get-schedule` rows (studios 210 and 88, captured
 * 2026-08-06), including the quirks that make this worth testing: `isFull` arriving as null so
 * capacity has to be derived, and a `pricing_rule` whose arithmetic the backend already did.
 */
import type { ScheduleEvent } from '@/api/schemas/schedule';

import { buildCart } from '../build-cart';

const OPTIONS = { showInstructor: true, currency: 'USD' };

/** Studio 210, event 180392617 — the shape almost every row has. $22 + 8.25% tax. */
function realEvent(overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    eventid: 180392617,
    start_date: '2026-08-05T18:00:00.000Z',
    end_date: '2026-08-05T19:00:00.000Z',
    name: 'Flow',
    seats: 16,
    spots_booked: 1,
    price_dibs: 22,
    has_waitlist: null,
    isFull: null,
    free_class: false,
    eventtype: 'class',
    instructor: { firstname: 'Marta', lastname: ' Estellés', image_url: null },
    location: { name: 'Carlsbad Village Yoga Co-op', tax_rate: 8.25 },
    ...overrides,
  } as ScheduleEvent;
}

describe('buildCart', () => {
  it('resolves a normal class to a chargeable line with tax in the total', () => {
    const cart = buildCart([realEvent()], [180392617], OPTIONS);

    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0].state).toBe('ready');
    expect(cart.lines[0].note).toBe('');
    // $22 + 8.25% = $23.82, computed in integer cents exactly as the server does.
    expect(cart.totalCents).toBe(2382);
    expect(cart.totalLabel).toBe('$23.82');
    expect(cart.chargeableCount).toBe(1);
    expect(cart.canCheckout).toBe(true);
  });

  it('preserves the order the client added things in', () => {
    const events = [
      realEvent({ eventid: 1 }),
      realEvent({ eventid: 2 }),
      realEvent({ eventid: 3 }),
    ];
    // Deliberately not ascending, and deliberately not the schedule's order.
    const cart = buildCart(events, [3, 1, 2], OPTIONS);
    expect(cart.lines.map((line) => line.eventId)).toEqual([3, 1, 2]);
  });

  describe('when the cart and the schedule disagree', () => {
    it('reports an id the schedule no longer carries as gone, not as free', () => {
      const cart = buildCart([realEvent()], [999999], OPTIONS);

      expect(cart.lines[0].state).toBe('gone');
      expect(cart.lines[0].entry).toBeNull();
      expect(cart.lines[0].charge).toBeNull();
      expect(cart.lines[0].note).toMatch(/no longer on the schedule/i);
      // The critical assertion: a missing class contributes NOTHING to the money.
      expect(cart.totalCents).toBe(0);
      expect(cart.canCheckout).toBe(false);
    });

    it('reports a class that filled up while it sat in the cart', () => {
      const cart = buildCart(
        [realEvent({ seats: 16, spots_booked: 16 })],
        [180392617],
        OPTIONS,
      );

      expect(cart.lines[0].state).toBe('full');
      expect(cart.totalCents).toBe(0);
      expect(cart.blockedCount).toBe(1);
    });

    it('checks FULL before price, so a full class is never quoted a fee', () => {
      // A full class with a perfectly good price. It must still read as full: telling somebody
      // what a seat costs when there is no seat is the wrong sentence.
      const cart = buildCart(
        [realEvent({ seats: 10, spots_booked: 10, price_dibs: 22 })],
        [180392617],
        OPTIONS,
      );
      expect(cart.lines[0].state).toBe('full');
    });
  });

  describe('classes a card cannot pay for', () => {
    it('separates free from un-priced — they are not the same state', () => {
      const free = buildCart([realEvent({ free_class: true })], [180392617], OPTIONS);
      expect(free.lines[0].state).toBe('free');

      // `price_dibs` of 0 means "priced elsewhere" — pass-only classes look like this. Calling it
      // free would tell a client a class costs nothing when it does not.
      const unpriced = buildCart([realEvent({ price_dibs: 0 })], [180392617], OPTIONS);
      expect(unpriced.lines[0].state).toBe('noPrice');

      const nullPriced = buildCart([realEvent({ price_dibs: null })], [180392617], OPTIONS);
      expect(nullPriced.lines[0].state).toBe('noPrice');
    });

    it('gives every blocked state a sentence', () => {
      const events = [
        realEvent({ eventid: 1, free_class: true }),
        realEvent({ eventid: 2, price_dibs: 0 }),
        realEvent({ eventid: 3, seats: 5, spots_booked: 5 }),
      ];
      const cart = buildCart(events, [1, 2, 3, 4], OPTIONS);

      // Including the id (4) that is not in the schedule at all.
      expect(cart.lines).toHaveLength(4);
      for (const line of cart.lines) {
        expect(line.note.length).toBeGreaterThan(0);
      }
    });
  });

  describe('the total', () => {
    it('sums only the lines a card can actually pay for', () => {
      const events = [
        realEvent({ eventid: 1 }),
        realEvent({ eventid: 2 }),
        realEvent({ eventid: 3, free_class: true }),
        realEvent({ eventid: 4, seats: 2, spots_booked: 2 }),
      ];
      const cart = buildCart(events, [1, 2, 3, 4, 5], OPTIONS);

      expect(cart.chargeableCount).toBe(2);
      // 3 blocked: the free one, the full one, and the id with no event.
      expect(cart.blockedCount).toBe(3);
      expect(cart.totalCents).toBe(2382 * 2);
      expect(cart.canCheckout).toBe(true);
    });

    it('takes the backend’s discounted figure rather than re-deriving one', () => {
      const cart = buildCart(
        [
          realEvent({
            price_dibs: 22,
            pricing_rule: { original_price: 22, discounted_price: 16.5 },
          }),
        ],
        [180392617],
        OPTIONS,
      );

      // $16.50 + 8.25% = $17.86. An endpoint that priced from price_dibs and forgot the rule
      // would overcharge every off-peak class.
      expect(cart.totalCents).toBe(1786);
      expect(cart.lines[0].charge?.isDiscounted).toBe(true);
    });

    it('is $0.00 and un-checkoutable for an empty cart', () => {
      const cart = buildCart([realEvent()], [], OPTIONS);
      expect(cart.lines).toHaveLength(0);
      expect(cart.totalLabel).toBe('$0.00');
      expect(cart.canCheckout).toBe(false);
    });

    it('always shows two decimals — a total is a statement, not a quote', () => {
      const cart = buildCart(
        [realEvent({ price_dibs: 20, location: { name: 'x', tax_rate: 0 } })],
        [180392617],
        OPTIONS,
      );
      expect(cart.totalLabel).toBe('$20.00');
    });
  });

  it('honours a studio that hides instructor names', () => {
    const cart = buildCart([realEvent()], [180392617], { showInstructor: false });
    expect(cart.lines[0].entry?.instructor).toBeNull();
  });
});

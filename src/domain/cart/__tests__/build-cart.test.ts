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

/**
 * Pass coverage in the cart.
 *
 * This is the money-critical half of the file. A cart that prices a class a client's membership
 * already covers charges a member for something they pay for monthly — the widget's single most
 * expensive pass bug, and the reason `choosePassForClass` has exactly one implementation.
 */
describe('buildCart with the client’s passes', () => {
  const pass = (over: Record<string, unknown> = {}) =>
    ({
      id: 900,
      userid: 413885,
      dibs_studio_id: 210,
      private_pass: false,
      totalUses: 10,
      usesCount: 3,
      expiresAt: '2099-01-01T00:00:00.000Z',
      is_placeholder: false,
      autopay: false,
      studioPackage: { packageName: '10 Class Package', unlimited: false },
      ...over,
    }) as never;

  const withPasses = (passes: unknown[]) => ({ ...OPTIONS, passes: passes as never });

  it('marks a covered class as covered and charges nothing for it', () => {
    const cart = buildCart([realEvent()], [180392617], withPasses([pass()]));

    expect(cart.lines[0].state).toBe('covered');
    expect(cart.lines[0].passId).toBe(900);
    expect(cart.lines[0].passName).toBe('10 Class Package');
    expect(cart.coveredCount).toBe(1);
    expect(cart.chargeableCount).toBe(0);
    // The whole point: not one cent.
    expect(cart.totalCents).toBe(0);
  });

  it('is still checkoutable with nothing but covered classes', () => {
    // A member with an unlimited membership has a $0 cart, and telling them it cannot be booked
    // would be the exact inversion of the truth.
    const cart = buildCart([realEvent()], [180392617], withPasses([pass({ totalUses: null })]));
    expect(cart.canCheckout).toBe(true);
    expect(cart.blockedCount).toBe(0);
  });

  it('mixes covered and card lines, and totals only the card ones', () => {
    const events = [realEvent({ eventid: 1 }), realEvent({ eventid: 2 })];
    // A one-use pass covers exactly one of them; the chooser returns it for both, but only the
    // count of chargeable lines feeds the money.
    const cart = buildCart(events, [1, 2], withPasses([pass()]));

    expect(cart.coveredCount).toBe(2);
    expect(cart.totalCents).toBe(0);
  });

  it('treats an EMPTY pass list as "you hold none", and prices the class', () => {
    const cart = buildCart([realEvent()], [180392617], withPasses([]));
    expect(cart.lines[0].state).toBe('ready');
    expect(cart.totalCents).toBe(2382);
  });

  describe('the package allowlist', () => {
    // Studio 88's shape: the pass's package (id 9383) off one class's resolved list, on
    // another's. The restriction arrives RESOLVED from the server; the cart only honours it.
    const virtualPack = () =>
      pass({
        id: 911,
        studio_package_id: 9383,
        studioPackage: { packageName: 'Virtual Class 10-pack', unlimited: false },
      });

    it('prices an allowlist-excluded class, NAMES the pass — and still covers the listed one', () => {
      const events = [
        realEvent({
          eventid: 1,
          packageRestriction: { packagesAllowed: true, allowedPackageIds: [557], source: 'type' },
        }),
        realEvent({
          eventid: 2,
          packageRestriction: { packagesAllowed: true, allowedPackageIds: [9383], source: 'type' },
        }),
      ];
      const cart = buildCart(events, [1, 2], withPasses([virtualPack()]));

      // The excluded line is a normal card line — with a sentence, not a silent price.
      expect(cart.lines[0].state).toBe('ready');
      expect(cart.lines[0].note).toBe(
        'Virtual Class 10-pack isn’t accepted for this class, so it’s priced as a drop-in.',
      );
      // The non-empty half: the same pass still covers the class whose list carries it, which is
      // what proves the filter discriminates rather than coverage having broken outright.
      expect(cart.lines[1].state).toBe('covered');
      expect(cart.lines[1].passName).toBe('Virtual Class 10-pack');
      expect(cart.totalCents).toBe(2382);
    });

    it('an ABSENT restriction (older API) books exactly as today — covered, no note', () => {
      const cart = buildCart([realEvent()], [180392617], withPasses([virtualPack()]));
      expect(cart.lines[0].state).toBe('covered');
      expect(cart.lines[0].note).toBe('');
    });

    it('a class the client holds NO pass for gets no allowlist sentence', () => {
      // The note explains an exclusion; with nothing excluded it would be an invented grievance.
      const cart = buildCart(
        [
          realEvent({
            packageRestriction: { packagesAllowed: true, allowedPackageIds: [557], source: 'type' },
          }),
        ],
        [180392617],
        withPasses([]),
      );
      expect(cart.lines[0].state).toBe('ready');
      expect(cart.lines[0].note).toBe('');
    });
  });

  it('prices the class when passes are UNDEFINED — we have not asked', () => {
    // Both look the same on screen, but only one is a claim. The server checks coverage again and
    // refuses a card for a covered class, so the worst case is a refusal, never a wrong charge.
    const cart = buildCart([realEvent()], [180392617], OPTIONS);
    expect(cart.lines[0].state).toBe('ready');
  });

  it('never covers a class the studio has turned passes off for', () => {
    const cart = buildCart(
      [realEvent({ can_apply_pass: false })],
      [180392617],
      withPasses([pass()]),
    );
    expect(cart.lines[0].state).toBe('ready');
  });

  it('never spends a private appointment pass on a public class', () => {
    const cart = buildCart([realEvent()], [180392617], withPasses([pass({ private_pass: true })]));
    expect(cart.lines[0].state).toBe('ready');
  });

  it('never spends a placeholder hold — it is a marker for a CHARGE, not an entitlement', () => {
    const cart = buildCart([realEvent()], [180392617], withPasses([pass({ is_placeholder: true })]));
    expect(cart.lines[0].state).toBe('ready');
  });

  it('never spends a spent or expired pass', () => {
    const spent = buildCart([realEvent()], [180392617], withPasses([pass({ usesCount: 10 })]));
    expect(spent.lines[0].state).toBe('ready');

    const expired = buildCart(
      [realEvent()],
      [180392617],
      withPasses([pass({ expiresAt: '2020-01-01T00:00:00.000Z' })]),
    );
    expect(expired.lines[0].state).toBe('ready');
  });

  it('checks FULL before coverage — a covered seat that does not exist is still no seat', () => {
    const cart = buildCart(
      [realEvent({ seats: 5, spots_booked: 5 })],
      [180392617],
      withPasses([pass()]),
    );
    expect(cart.lines[0].state).toBe('full');
    expect(cart.coveredCount).toBe(0);
  });

  it('names the MEMBERSHIP when the client holds both — the server picks the same one', () => {
    const membership = pass({
      id: 901,
      totalUses: null,
      studioPackage: { packageName: 'Month Unlimited', unlimited: true },
    });
    const cart = buildCart([realEvent()], [180392617], withPasses([pass(), membership]));

    // Spending the membership preserves the pack. If the app named one and the server spent the
    // other, the client would watch the wrong balance drop.
    expect(cart.lines[0].passId).toBe(901);
    expect(cart.lines[0].passName).toBe('Month Unlimited');
  });
});

/**
 * The storefront's rules.
 *
 * Two things carry most of the weight here, and both are platform-wide traps:
 *
 *  1. `classAmount` is populated on UNLIMITED packages as a sentinel, so reading it without
 *     checking `unlimited` first renders "1 class" for a monthly membership. That mistake has
 *     shipped on six surfaces of this platform.
 *  2. `autopay` is an ENUM on the package (`NONE | ALLOW | FORCE`), not a boolean, and only
 *     `FORCE` means membership. Treating it as truthy would sign clients up to subscriptions.
 */
import type { StudioPackage } from '@/api/schemas/packages';

import { buildPackages } from '../build-packages';

/** A ten-class pack — the shape most rows have. */
function pack(overrides: Partial<StudioPackage> = {}): StudioPackage {
  return {
    id: 501,
    name: '10 Class Package',
    price: 200,
    classAmount: 10,
    unlimited: false,
    autopay: 'NONE',
    passesValidFor: 6,
    validForInterval: 'month',
    show_price_per_class: false,
    taxrate: 8.25,
    ...overrides,
  } as StudioPackage;
}

/** Studio 88's "Month Unlimited" shape: FORCE autopay, unlimited, a sentinel classAmount. */
function membership(overrides: Partial<StudioPackage> = {}): StudioPackage {
  return {
    id: 557,
    name: 'Month Unlimited',
    price: 234,
    priceAutopay: 234,
    // The trap: a real membership row carries a count that means nothing.
    classAmount: 1,
    unlimited: true,
    autopay: 'FORCE',
    commitment_period: 3,
    taxrate: 8.25,
    ...overrides,
  } as StudioPackage;
}

describe('buildPackages', () => {
  describe('telling a pack from a membership', () => {
    it('calls only FORCE a membership', () => {
      expect(buildPackages([pack({ autopay: 'NONE' })])[0].kind).toBe('pack');
      // ALLOW means the client MAY opt into renewal — it is not a subscription by default, and
      // presenting it as one would misstate what somebody is agreeing to.
      expect(buildPackages([pack({ autopay: 'ALLOW' })])[0].kind).toBe('pack');
      expect(buildPackages([membership()])[0].kind).toBe('membership');
    });

    it('treats an unrecognised autopay value as a one-off', () => {
      // Never guess somebody into a recurring charge.
      expect(buildPackages([pack({ autopay: 'SOMETHING_NEW' })])[0].kind).toBe('pack');
      expect(buildPackages([pack({ autopay: null })])[0].kind).toBe('pack');
    });

    it('quotes a membership its RECURRING price, not its one-off price', () => {
      const view = buildPackages([membership({ price: 250, priceAutopay: 145 })])[0];
      expect(view.priceLabel).toBe('$145');
      expect(view.priceSuffix).toBe('per month');
    });

    it('falls back to price when a membership has no priceAutopay', () => {
      const view = buildPackages([membership({ priceAutopay: null, price: 234 })])[0];
      expect(view.priceLabel).toBe('$234');
    });

    it('gives a pack no recurring suffix', () => {
      expect(buildPackages([pack()])[0].priceSuffix).toBeNull();
    });
  });

  describe('the unlimited trap', () => {
    it('never renders the sentinel count for an unlimited package', () => {
      const view = buildPackages([membership()])[0];
      // `classAmount` is 1 on this row. "1 class" would be a lie about a monthly membership.
      expect(view.allowanceLabel).toBe('Unlimited classes');
    });

    it('treats the legacy 999 sentinel as unlimited even without the flag', () => {
      const view = buildPackages([pack({ classAmount: 999, unlimited: false })])[0];
      expect(view.allowanceLabel).toBe('Unlimited classes');
    });

    it('never derives a per-class price for an unlimited package', () => {
      // $234 ÷ a sentinel of 1 would read "$234 per class" beside "Unlimited classes".
      const view = buildPackages([membership({ show_price_per_class: true })])[0];
      expect(view.perClassLabel).toBeNull();
    });

    it('still counts a real finite pack correctly', () => {
      expect(buildPackages([pack({ classAmount: 10 })])[0].allowanceLabel).toBe('10 classes');
      expect(buildPackages([pack({ classAmount: 1 })])[0].allowanceLabel).toBe('1 class');
    });

    it('says nothing when the count is missing rather than inventing one', () => {
      expect(buildPackages([pack({ classAmount: null, unlimited: false })])[0].allowanceLabel)
        .toBeNull();
      expect(buildPackages([pack({ classAmount: 0 })])[0].allowanceLabel).toBeNull();
    });
  });

  describe('per-class price', () => {
    it('is silent unless the studio asked for it', () => {
      expect(buildPackages([pack({ show_price_per_class: false })])[0].perClassLabel).toBeNull();
    });

    it('derives it from price ÷ classes when asked', () => {
      const view = buildPackages([pack({ show_price_per_class: true, price: 200, classAmount: 10 })])[0];
      expect(view.perClassLabel).toBe('$20 per class');
    });

    it('prefers an explicit override — a typed figure means that figure', () => {
      const view = buildPackages([
        pack({ show_price_per_class: true, price: 200, classAmount: 10, price_per_class_override: 18 }),
      ])[0];
      expect(view.perClassLabel).toBe('$18 per class');
    });
  });

  describe('terms', () => {
    it('states a real commitment and ignores a nominal one', () => {
      expect(buildPackages([membership({ commitment_period: 3 })])[0].commitmentLabel)
        .toBe('3-month minimum');
      // 1 month is just the billing cycle, not a commitment; 0 and null are nothing.
      expect(buildPackages([membership({ commitment_period: 1 })])[0].commitmentLabel).toBeNull();
      expect(buildPackages([membership({ commitment_period: 0 })])[0].commitmentLabel).toBeNull();
      expect(buildPackages([membership({ commitment_period: null })])[0].commitmentLabel).toBeNull();
    });

    it('pluralises validity correctly, and only shows it on packs', () => {
      expect(buildPackages([pack({ passesValidFor: 6, validForInterval: 'month' })])[0].validityLabel)
        .toBe('Valid for 6 months');
      expect(buildPackages([pack({ passesValidFor: 1, validForInterval: 'months' })])[0].validityLabel)
        .toBe('Valid for 1 month');
      // A membership's pass is reissued every cycle — "valid for 1 month" beside "per month"
      // reads as a restriction rather than as the ordinary state of a subscription.
      expect(buildPackages([membership({ passesValidFor: 1, validForInterval: 'month' })])[0]
        .validityLabel).toBeNull();
    });

    it('flags an intro offer', () => {
      expect(buildPackages([pack({ onlyFirstPurchase: true })])[0].isIntroOffer).toBe(true);
      expect(buildPackages([pack()])[0].isIntroOffer).toBe(false);
    });
  });

  describe('what a client is never shown', () => {
    it('filters placeholder packages — they are the studio’s spot-hold mechanism', () => {
      expect(buildPackages([pack({ is_placeholder: true })])).toHaveLength(0);
      expect(buildPackages([pack({ name: '[Admin] Unpaid Reservation', is_placeholder: true })]))
        .toHaveLength(0);
    });

    it('filters private packages', () => {
      expect(buildPackages([pack({ private: true })])).toHaveLength(0);
    });

    it('keeps the rest', () => {
      const views = buildPackages([
        pack({ id: 1 }),
        pack({ id: 2, is_placeholder: true }),
        membership({ id: 3 }),
        pack({ id: 4, private: true }),
      ]);
      expect(views.map((view) => view.id)).toEqual([1, 3]);
    });
  });

  describe('names', () => {
    it('honours a studio asking for the name to be withheld, with a label not a blank', () => {
      expect(buildPackages([pack({ should_display_name: false })])[0].name).toBe('Class package');
      expect(buildPackages([membership({ should_display_name: false })])[0].name).toBe('Membership');
    });

    it('trims the studio’s own name', () => {
      expect(buildPackages([pack({ name: '  10 Class Package  ' })])[0].name)
        .toBe('10 Class Package');
    });
  });

  it('says "ask the studio" rather than "$0" for an unpriced package', () => {
    expect(buildPackages([pack({ price: 0 })])[0].priceLabel).toBeNull();
    expect(buildPackages([pack({ price: null })])[0].priceLabel).toBeNull();
  });
});

/**
 * What the card is actually charged, and whether the app may charge it at all.
 *
 * The total here is the client-side mirror of the server's `pricePackageForClient`, and it is what
 * rides on the Buy button AND what is sent as `displayedTotalCents`. A drift does not mis-charge —
 * the server refuses with `price_changed` — but it refuses EVERY purchase, so these are pinned.
 */
describe('buildPackages — what can be bought, and for how much', () => {
  const taxed = (over: Partial<StudioPackage> = {}) => pack({ taxrate: 8.25, ...over });

  it('adds tax as a PERCENTAGE, in integer cents, matching the server', () => {
    const view = buildPackages([taxed({ price: 200 })])[0];
    // $200 + 8.25% = $216.50. Treating the rate as a multiplier would quote $1,850.
    expect(view.totalCents).toBe(21650);
    expect(view.totalLabel).toBe('$216.50');
    expect(view.taxNote).toBe('incl. $16.50 tax');
  });

  it('quotes the pre-tax price in the list and the WITH-tax total on the button', () => {
    // A list is scanned, so it shows the drop-in figure; the button is what somebody presses to
    // agree to a charge, so it carries the real one.
    const view = buildPackages([taxed({ price: 200 })])[0];
    expect(view.priceLabel).toBe('$200');
    expect(view.totalLabel).toBe('$216.50');
  });

  it('says nothing about tax when the studio charges none', () => {
    const view = buildPackages([pack({ price: 200, taxrate: 0 })])[0];
    expect(view.totalCents).toBe(20000);
    // "incl. $0.00 tax" is a line that exists to say nothing.
    expect(view.taxNote).toBeNull();
  });

  it('is purchasable when it is a pack with a real price', () => {
    const view = buildPackages([taxed()])[0];
    expect(view.isPurchasable).toBe(true);
    expect(view.notPurchasableReason).toBeNull();
  });

  it('refuses to offer a MEMBERSHIP for purchase, and says why', () => {
    // Enrolling means creating a Stripe subscription, which the app cannot do and the server
    // refuses (`membership_not_supported`). A Buy button here would lead straight to a refusal.
    const view = buildPackages([membership()])[0];
    expect(view.isPurchasable).toBe(false);
    expect(view.notPurchasableReason).toMatch(/studio/i);
    expect(view.totalCents).toBeNull();
  });

  it('refuses to offer an un-priced package', () => {
    for (const price of [0, null]) {
      const view = buildPackages([pack({ price })])[0];
      expect(view.isPurchasable).toBe(false);
      expect(view.totalCents).toBeNull();
    }
  });

  it('charges the ONE-OFF price, never priceAutopay', () => {
    // Only reachable for an ALLOW package, which is bought outright unless the client opts in.
    const view = buildPackages([taxed({ autopay: 'ALLOW', price: 100, priceAutopay: 145 })])[0];
    expect(view.kind).toBe('pack');
    expect(view.totalCents).toBe(10825);
  });

  it('rounds tax the way the server rounds', () => {
    // $39 at 8.25% = 321.75 → 322. A different rounding refuses every purchase.
    expect(buildPackages([taxed({ price: 39 })])[0].totalCents).toBe(4222);
  });
});

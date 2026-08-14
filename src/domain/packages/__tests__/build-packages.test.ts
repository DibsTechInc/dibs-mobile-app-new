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

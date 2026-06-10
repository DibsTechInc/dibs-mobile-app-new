/**
 * Golden-master tests: the legacy PurchaseBreakdown selectors were executed
 * against the fixture states in __fixtures__/states.json and their outputs
 * captured in __fixtures__/golden.json (harness: legacy `legacy` git branch,
 * reselect 4 + decimal.js 10). The TS port must reproduce every number
 * exactly. If one of these fails, the port is wrong — not the golden file.
 */
import { describe, expect, it } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

import { computePurchaseBreakdown, enrichPassesInCart, computeDetailedPackage } from '..';
import type { PricingInput, PurchaseBreakdown } from '..';

const FIXTURES = path.join(__dirname, '..', '__fixtures__');
const states = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'states.json'), 'utf8'));
const golden = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'golden.json'), 'utf8'));

/** Maps a legacy redux state fixture to the new domain input. */
function adaptState(state: any): PricingInput {
  const studio = state.studio.data;
  const locations: any[] = studio.locations || [];
  const primaryLocation = locations.find(
    (l) => l.source_location_id === studio.primary_location_id,
  );
  const eventRows: any[] = state.events.data || [];

  const events = (state.cart.events || []).map((item: any) => {
    const event = eventRows.find((e) => e.id === item.eventid);
    const loc = locations.find((l) => l.id === event.location.id);
    return {
      eventid: item.eventid,
      passid: item.passid,
      price: item.price,
      quantity: item.quantity,
      taxRatePercent: loc.tax_rate,
    };
  });

  const packages = (state.cart.packages || []).map((item: any) => {
    const pkg = (studio.studio_packages || []).find((p: any) => p.id === item.packageid);
    return computeDetailedPackage(pkg, primaryLocation.tax_rate, item.quantity);
  });

  const credits = (state.cart.credits || []).map((item: any) => {
    const tier = (studio.creditTiers || []).find((t: any) => t.id === item.creditTierId);
    return {
      price: tier.payAmount,
      quantity: item.quantity,
      receiveAmount: tier.receiveAmount,
      loadBonus: tier.loadBonus,
    };
  });

  const promoData = state.promoCode?.data || {};
  const promo = promoData.code
    ? { type: promoData.type, amount: promoData.amount, product: promoData.product }
    : null;

  const userCreditRows: any[] = state.user.credits || [];
  const studioCreditRow = userCreditRows.find((c) => c.dibs_studio_id === studio.id);
  const rafRow = userCreditRows.find((c) => c.source === 'raf');
  const flashRow = (state.user.flash_credits || []).find(
    (fc: any) => fc.dibs_studio_id === studio.id,
  );

  const validStudioPasses = (state.user.passes || []).filter(
    (p: any) => p.dibs_studio_id === studio.id && p.isValid,
  );

  return {
    events,
    packages,
    credits,
    promo,
    passesInCart: enrichPassesInCart(validStudioPasses, state.cart.events || []),
    userCredits: {
      studioCredit: studioCreditRow?.credit ?? 0,
      studioCreditLoadBonus: studioCreditRow?.load_bonus ?? 0,
      rafCredit: rafRow?.credit ?? 0,
      flashCredit: flashRow?.credit ?? 0,
    },
  };
}

/** golden selector name → PurchaseBreakdown field */
const FIELD_MAP: Record<string, keyof PurchaseBreakdown> = {
  getCartHasPackages: 'hasPackages',
  getCartHasEvents: 'hasEvents',
  getCartPromoIsAppliedToPackage: 'promoAppliedToPackage',
  getCartPromoIsAppliedToEvent: 'promoAppliedToEvent',
  getCartPromoCodeAmount: 'promoCodeAmount',
  getCartFlashCreditAmount: 'flashCreditAmount',
  getCartPassesValue: 'passesValue',
  getCartEventsAdjustedPrices: 'adjustedPrices',
  getCartEventsAdjustedValue: 'adjustedValue',
  getCartValueBack: 'valueBack',
  getCartEventSubtotal: 'eventSubtotal',
  getCartEventDiscountAmount: 'eventDiscountAmount',
  getCartPackSubtotal: 'packSubtotal',
  getCartPackDiscountAmount: 'packDiscountAmount',
  getCartCreditTotal: 'creditTotal',
  getCartSubtotal: 'subtotal',
  getCartSubtotalWithPackageClasses: 'subtotalWithPackageClasses',
  getCartDiscountAmount: 'discountAmount',
  getCartEventTaxAmount: 'eventTaxAmount',
  getCartPackTaxAmount: 'packTaxAmount',
  getCartTaxAmount: 'taxAmount',
  getCartSubtotalAfterTax: 'subtotalAfterTax',
  getCartStudioCreditAppliedToPacks: 'studioCreditAppliedToPacks',
  getCartStudioCreditAppliedToEvents: 'studioCreditAppliedToEvents',
  getCartStudioCreditsApplied: 'studioCreditsApplied',
  getCartAmountAfterStudioCredits: 'amountAfterStudioCredits',
  getCartRAFCreditApplied: 'rafCreditApplied',
  getCartTotal: 'total',
};

describe('computePurchaseBreakdown — golden master vs legacy selectors', () => {
  for (const [fixtureName, fixtureState] of Object.entries<any>(states)) {
    describe(fixtureName, () => {
      const result = computePurchaseBreakdown(adaptState(fixtureState));
      const expected = golden[fixtureName];

      for (const [selectorName, field] of Object.entries(FIELD_MAP)) {
        it(`${selectorName} → ${String(field)}`, () => {
          expect(result[field]).toEqual(expected[selectorName]);
        });
      }
    });
  }
});

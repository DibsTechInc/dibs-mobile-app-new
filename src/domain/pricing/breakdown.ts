import Decimal from 'decimal.js';

import { sortCartItemsByPrice } from './enrich';
import type { PricingInput, PurchaseBreakdown } from './types';

const PROMO_PRODUCTS_PACKAGE = ['PACKAGE', 'UNIVERSAL'];
const PROMO_PRODUCTS_EVENT = ['CLASS', 'UNIVERSAL'];

/**
 * The purchase-breakdown waterfall, ported 1:1 from the legacy
 * PurchaseBreakdown selectors (see /legacy-reference). Order of operations:
 *
 *   subtotal → promo discount → tax → studio credits (packs first, then
 *   events) → RAF credits → total
 *
 * Verified against golden-master outputs of the legacy selectors — do not
 * "fix" surprising behaviors here without studio-facing sign-off. Notable
 * preserved behaviors:
 * - The promo discount applies to the first (cheapest, free-last) item only,
 *   including its tax adjustment.
 * - If ANY cart event is paid with a pass, the event-side discount is 0 and
 *   promo/flash value flows through `valueBack` instead.
 * - Credit-load lines: receiveAmount/loadBonus are summed WITHOUT quantity.
 * - Load-bonus credit cannot pay for packages (subtracted), but can pay for
 *   events (not subtracted).
 */
export function computePurchaseBreakdown(input: PricingInput): PurchaseBreakdown {
  const events = sortCartItemsByPrice(input.events);
  const packages = sortCartItemsByPrice(input.packages);
  const { credits, passesInCart, promo } = input;
  const { studioCredit, studioCreditLoadBonus, rafCredit, flashCredit } = input.userCredits;

  const hasPackages = packages.length > 0;
  const hasEvents = events.length > 0;

  const promoAppliedToPackage = Boolean(
    hasPackages && promo && PROMO_PRODUCTS_PACKAGE.includes(promo.product),
  );
  const promoAppliedToEvent = Boolean(
    !promoAppliedToPackage && promo && PROMO_PRODUCTS_EVENT.includes(promo.product),
  );

  // --- Promo amount (first item after sort) ---
  let promoCodeAmount = 0;
  if (promoAppliedToPackage || promoAppliedToEvent) {
    const item = (promoAppliedToPackage ? packages : events)[0];
    if (item && promo) {
      switch (promo.type) {
        case 'FREE_CLASS':
          promoCodeAmount = item.price;
          break;
        case 'PERCENT_OFF':
          promoCodeAmount = new Decimal(promo.amount)
            .dividedBy(100)
            .times(item.price)
            .toDecimalPlaces(2)
            .toNumber();
          break;
        case 'CASH_OFF':
          promoCodeAmount = Math.min(promo.amount, item.price);
          break;
        default:
          promoCodeAmount = 0;
      }
    }
  }

  const flashCreditAmount = hasEvents ? flashCredit : 0;

  // --- Pass-paid events ---
  const passesValue = passesInCart
    .reduce(
      (acc, pass) =>
        acc.plus(
          new Decimal(pass.displayPassValue ? pass.passValue : pass.eventPrices).times(
            pass.displayPassValue ? pass.quantity : 1,
          ),
        ),
      new Decimal(0),
    )
    .toNumber();

  const eventsWithPasses = events.filter((item) => item.passid);
  const adjustedPrices = eventsWithPasses.map((item) => {
    const pass = passesInCart.find((p) => p.id === item.passid);
    if (!pass) return 0; // events paid without passes handled separately
    const eventPassValue = Math.min(
      pass.displayPassValue ? pass.passValue : item.price,
      item.price,
    );
    return new Decimal(eventPassValue).times(item.quantity).toNumber();
  });
  const adjustedValue = adjustedPrices
    .reduce((acc, price) => acc.plus(price), new Decimal(0))
    .toNumber();

  const valueBack = passesInCart.length
    ? Math.max(
        0,
        new Decimal(passesValue)
          .plus(flashCreditAmount)
          .plus(promoAppliedToEvent ? promoCodeAmount : 0)
          .minus(adjustedValue)
          .toNumber(),
      )
    : 0;

  // --- Money-paid events ---
  const eventsWithoutPasses = events.filter((item) => !item.passid);
  const eventSubtotal = eventsWithoutPasses
    .reduce((acc, item) => acc.plus(new Decimal(item.price).times(item.quantity)), new Decimal(0))
    .toNumber();

  const eventDiscountAmount = eventsWithPasses.length
    ? 0
    : new Decimal(promoAppliedToEvent ? promoCodeAmount : 0).plus(flashCreditAmount).toNumber();

  const packSubtotal = packages
    .reduce((acc, item) => acc.plus(new Decimal(item.price).times(item.quantity)), new Decimal(0))
    .toNumber();
  const packDiscountAmount = promoAppliedToPackage ? promoCodeAmount : 0;

  const creditTotal = credits
    .reduce((acc, item) => acc.plus(new Decimal(item.price).times(item.quantity)), new Decimal(0))
    .toNumber();

  const subtotal = new Decimal(eventSubtotal).plus(packSubtotal).plus(creditTotal).toNumber();
  const subtotalWithPackageClasses = new Decimal(adjustedValue).plus(subtotal).toNumber();
  const discountAmount = new Decimal(eventDiscountAmount).plus(packDiscountAmount).toNumber();

  // --- Tax (per line, 2dp half-up; discount reduces first line's base) ---
  const eventTaxAmount = eventsWithoutPasses
    .reduce((acc, item, i) => {
      const taxRate = new Decimal(item.taxRatePercent).dividedBy(100);
      let price = new Decimal(item.price).times(item.quantity);
      if (!i) price = price.minus(eventDiscountAmount);
      return acc.plus(price.times(taxRate).toDecimalPlaces(2));
    }, new Decimal(0))
    .toNumber();

  const packTaxAmount = packages
    .reduce((acc, item, i) => {
      let taxes = new Decimal(item.packageTaxes).times(item.quantity);
      if (!i) {
        taxes = taxes.minus(
          new Decimal(packDiscountAmount).times(item.taxRate).toDecimalPlaces(2),
        );
      }
      return acc.plus(taxes);
    }, new Decimal(0))
    .toNumber();

  const taxAmount = new Decimal(eventTaxAmount).plus(packTaxAmount).toNumber();
  const subtotalAfterTax = new Decimal(subtotal)
    .minus(discountAmount)
    .plus(taxAmount)
    .toNumber();

  // --- Studio credits: packages first (bonus excluded), then events ---
  const cartCreditReceiveAmount = credits
    .reduce((acc, item) => acc.plus(item.receiveAmount), new Decimal(0))
    .toNumber();
  const cartCreditLoadBonus = credits
    .reduce((acc, item) => acc.plus(item.loadBonus), new Decimal(0))
    .toNumber();

  const studioCreditAppliedToPacks = Decimal.min(
    new Decimal(packSubtotal).minus(packDiscountAmount).plus(packTaxAmount),
    new Decimal(studioCredit)
      .minus(studioCreditLoadBonus)
      .plus(cartCreditReceiveAmount)
      .minus(cartCreditLoadBonus),
  ).toNumber();

  const studioCreditAppliedToEvents = Decimal.min(
    new Decimal(eventSubtotal).minus(eventDiscountAmount).plus(eventTaxAmount),
    new Decimal(studioCredit).plus(cartCreditReceiveAmount).minus(studioCreditAppliedToPacks),
  ).toNumber();

  const studioCreditsApplied = new Decimal(studioCreditAppliedToPacks)
    .plus(studioCreditAppliedToEvents)
    .toNumber();

  const amountAfterStudioCredits = new Decimal(subtotalAfterTax)
    .minus(studioCreditsApplied)
    .toNumber();

  const rafCreditApplied = Math.min(amountAfterStudioCredits, rafCredit);
  const total = new Decimal(amountAfterStudioCredits).minus(rafCreditApplied).toNumber();

  return {
    hasPackages,
    hasEvents,
    promoAppliedToPackage,
    promoAppliedToEvent,
    promoCodeAmount,
    flashCreditAmount,
    passesValue,
    adjustedPrices,
    adjustedValue,
    valueBack,
    eventSubtotal,
    eventDiscountAmount,
    packSubtotal,
    packDiscountAmount,
    creditTotal,
    subtotal,
    subtotalWithPackageClasses,
    discountAmount,
    eventTaxAmount,
    packTaxAmount,
    taxAmount,
    subtotalAfterTax,
    studioCreditAppliedToPacks,
    studioCreditAppliedToEvents,
    studioCreditsApplied,
    amountAfterStudioCredits,
    rafCreditApplied,
    total,
  };
}

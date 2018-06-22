import { createSelector } from 'reselect';
import Decimal from 'decimal.js';
import { format as formatCurrency } from 'currency-formatter';

import {
  PROMO_TYPE_FREE_CLASS,
  PROMO_TYPE_PERCENT_OFF_ONE_CLASS,
  PROMO_TYPE_CASH_OFF,
} from '../../../constants/PromoCodeConstants';
import {
  getPromoCodeType,
  getPromoCodeAmount,
  getPromoCodeProduct,
} from '../../PromoCodeSelectors';

import {
  getSortedCartEvents,
  getSortedCartPackages,
  getCartClassEvents,
} from '../';

import {
  getUserFlashCreditAmount,
  getUserStudioCreditsAmount,
  getUserRAFCreditAmount,
  getUserGlobalCreditAmount,
  getUserGlobalCreditCurrency,
} from '../../UserSelectors';

import { getUserStudioPassesInCart } from '../../UserSelectors/Passes';
import { getStudioCurrency } from '../../StudioSelectors';
import { getStudioLocations } from '../../StudioSelectors/Locations';
import { PROMO_PRODUCT_CLASS, PROMO_PRODUCT_UNIVERSAL, PROMO_PRODUCT_PACKAGE } from '../../../constants/index';

export const getSortedCartItems = createSelector(
  [
    getSortedCartPackages,
    getSortedCartEvents,
  ],
  (cartPackages, cartEvents) => cartPackages.concat(cartEvents)
);

export const getCartHasPackages = createSelector(
  getSortedCartItems,
  items => items.some(item => item.packageid)
);

export const getCartPromoIsAppliedToPackage = createSelector(
  getCartHasPackages,
  getPromoCodeProduct,
  (cartHasPacks, promoProduct) =>
    Boolean(cartHasPacks && [PROMO_PRODUCT_PACKAGE, PROMO_PRODUCT_UNIVERSAL].includes(promoProduct))
);

export const getCartPromoCodeAmount = createSelector(
  [
    getSortedCartItems,
    getPromoCodeType,
    getPromoCodeAmount,
    getPromoCodeProduct,
  ],
  (cartItems, promoCodeType, promoCodeAmount, promoProduct) => {
    if (!cartItems.length) return 0;

    const itemToApplyCode = cartItems.find(item => (
      {
        [PROMO_PRODUCT_UNIVERSAL]: true,
        [PROMO_PRODUCT_CLASS]: Boolean(item.eventid),
        [PROMO_PRODUCT_PACKAGE]: Boolean(item.packageid),
      }[promoProduct]
    ));

    if (!itemToApplyCode) return 0;

    switch (promoCodeType) {
      case PROMO_TYPE_FREE_CLASS:
        return itemToApplyCode.price;
      case PROMO_TYPE_PERCENT_OFF_ONE_CLASS:
        return Decimal(promoCodeAmount)
          .dividedBy(100)
          .times(itemToApplyCode.price)
          .toDecimalPlaces(2)
          .toNumber();
      case PROMO_TYPE_CASH_OFF:
        return Math.min(promoCodeAmount, itemToApplyCode.price);
      default:
        return 0;
    }
  }
);

export const getFormattedPromoCodeAmount = createSelector(
  [
    getCartPromoCodeAmount,
    getStudioCurrency,
  ],
  (promoCodeAmount, code) => formatCurrency(promoCodeAmount, { code })
);

export const getCartDiscountAmount = createSelector(
  [
    getCartPromoCodeAmount,
    getUserFlashCreditAmount,
  ],
  (promoCodeAmount, flashCreditAmount) => +Decimal(promoCodeAmount).plus(flashCreditAmount)
);

/*

PURCHASE BREAKDOWN WHEN USER HAS PASSES

*/

export const getCartPassesValue = createSelector(
  getUserStudioPassesInCart,
  passes => passes.reduce(
    (acc, pass) => acc.plus(
      Decimal(pass.studioPackage.unlimited ? pass.eventPrices : pass.passValue)
        .times(pass.studioPackage.unlimited ? 1 : pass.quantity)
    ),
    Decimal(0)
  ).toNumber()
);

export const getFormattedCartPassesValue = createSelector(
  [
    getCartPassesValue,
    getStudioCurrency,
  ],
  (passValues, code) => formatCurrency(passValues, { code })
);

export const getCartEventsAdjustedPrices = createSelector(
  [
    getCartClassEvents,
    getUserStudioPassesInCart,
  ],
  (cartItems, passesInCart) => cartItems.map((cartItem) => {
    const pass = passesInCart.find(p => p.id === cartItem.passid);
    if (!pass) return 0; // events paid without passes will be handled separately
    const eventPassValue = Math.min((pass.studioPackage.unlimited ? cartItem.price : pass.passValue), cartItem.price);
    const adjustedPrice = Decimal(eventPassValue).times(cartItem.quantity).toNumber();
    return adjustedPrice; // classes priced higher than their pass value earn zero credit
  })
);

export const getCartEventsAdjustedValue = createSelector(
  getCartEventsAdjustedPrices,
  prices => prices.reduce(
    (acc, price) => acc.plus(price),
    Decimal(0)
  ).toNumber()
);

export const getCartValueBack = createSelector(
  [
    getUserStudioPassesInCart,
    getCartPassesValue,
    getPromoCodeType,
    getCartHasPackages,
    getPromoCodeAmount,
    getCartPromoIsAppliedToPackage,
    getUserFlashCreditAmount,
    getCartEventsAdjustedValue,
  ],
  (
    passes,
    passesValue,
    promoType,
    packsInCart,
    promoAmount,
    promoAppliedToPack,
    flashCredAmount,
    adjustedEventsValue
  ) => (
    passes.length ? Math.max(
      0,
      Decimal(passesValue)
        .plus(flashCredAmount)
        .plus(promoAppliedToPack ? 0 : promoAmount)
        .minus(adjustedEventsValue)
        .toNumber()
      ) : 0
  )
);

export const getFormattedCartValueBack = createSelector(
  [
    getCartValueBack,
    getStudioCurrency,
  ],
  (valueBack, code) => formatCurrency(valueBack, { code })
);

/*

BREAKDOWN FOR WHEN USER DOES NOT HAVE PASSES

TODO: handle when user can toggle autopay on/off

*/

export const getCartEventsWithoutPasses = createSelector( // TODO edit
  getCartClassEvents,
  cartEvents => cartEvents.filter(cartEvent => !cartEvent.passid)
);

export const getCartPackagesWithEvents = createSelector(
  [
    getSortedCartPackages,
    getCartEventsWithoutPasses,
  ],
  (cartPackages, cartEvents) => cartPackages.concat(cartEvents)
);

export const getCartSubtotal = createSelector(
  getCartPackagesWithEvents,
  items => +items.reduce(
    (acc, item) =>
      acc.plus(Decimal(item.price).times(item.quantity)),
    Decimal(0))
);

export const getFormattedCartSubtotal = createSelector(
  [
    getCartSubtotal,
    getStudioCurrency,
  ],
  (subtotal, code) => formatCurrency(subtotal, { code })
);

export const getCartTaxAmount = createSelector(
  [
    getCartPackagesWithEvents,
    getUserStudioPassesInCart,
    getCartDiscountAmount,
    state => ((state.events || {}).data || []),
    getStudioLocations,
    getCartHasPackages,
  ],
  (items, passes, discount, events, locations) => items.reduce(
    (acc, item, i) => {
      if (item.eventid) {
        const event = events.find(e => e.id === item.eventid);
        const loc = locations.find(l => l.id === event.location.id);
        const taxRate = Decimal(loc.tax_rate).dividedBy(100);
        let price = Decimal(item.price).times(item.quantity);
        price = Decimal(item.price).times(item.quantity);
        if (!i && !passes.length) {
          price = price.minus(Math.min(discount, item.price));
        }
        return acc.plus(price.times(taxRate).toDecimalPlaces(2));
      }
      if (item.packageid) {
        return acc.plus(item.packageTaxes);
      }
      return acc;
    },
    new Decimal(0)
  ).toNumber()
);

export const getFormattedCartTaxAmount = createSelector(
  [
    getCartTaxAmount,
    getStudioCurrency,
  ],
  (taxAmount, code) => formatCurrency(taxAmount, { code })
);

export const getCartSubtotalAfterTax = createSelector(
  [
    getCartSubtotal,
    getCartDiscountAmount,
    getCartTaxAmount,
  ],
  (subtotal, discount, taxAmount) => +Decimal(subtotal).minus(discount).plus(taxAmount)
);

export const getCartStudioCreditsApplied = createSelector(
  [
    getCartSubtotalAfterTax,
    getUserStudioCreditsAmount,
  ],
  (currentAmount, studioCredits) => Math.min(currentAmount, studioCredits)
);

export const getFormattedCartStudioCreditsApplied = createSelector(
  [
    getCartStudioCreditsApplied,
    getStudioCurrency,
  ],
  (credits, code) => formatCurrency(credits, { code })
);

export const getCartStudioCreditsRemaining = createSelector(
  [
    getUserStudioCreditsAmount,
    getCartStudioCreditsApplied,
  ],
  (totalCredits, creditsApplied) => +Decimal(totalCredits).minus(creditsApplied)
);

export const getFormattedStudioCreditsRemaining = createSelector(
  [
    getCartStudioCreditsRemaining,
    getStudioCurrency,
  ],
  (credits, code) => formatCurrency(credits, { code })
);

export const getCartAmountAfterStudioCredits = createSelector(
  [
    getCartSubtotalAfterTax,
    getCartStudioCreditsApplied,
  ],
  (currentAmount, creditsApplied) => +Decimal(currentAmount).minus(creditsApplied)
);

export const getCartRAFCreditApplied = createSelector(
  [
    getCartAmountAfterStudioCredits,
    getUserRAFCreditAmount,
  ],
  (currentAmount, rafCredits) => Math.min(currentAmount, rafCredits)
);

export const getFormattedCartRAFCreditApplied = createSelector(
  [
    getCartRAFCreditApplied,
    getStudioCurrency,
  ],
  (credits, code) => formatCurrency(credits, { code })
);

export const getCartAmountAfterRAFCredits = createSelector(
  [
    getCartAmountAfterStudioCredits,
    getCartRAFCreditApplied,
  ],
  (currentAmount, creditsApplied) => +Decimal(currentAmount).minus(creditsApplied)
);

export const getCartGlobalCreditApplied = createSelector(
  [
    getCartAmountAfterRAFCredits,
    getUserGlobalCreditAmount,
    getUserGlobalCreditCurrency,
    getStudioCurrency,
    state => state.exchangeRates,
  ],
  (currentAmount, globalCredits, globalCreditCurrency, studioCurrency, exchangeRates) => {
    if (globalCreditCurrency && studioCurrency !== globalCreditCurrency) {
      const exchangeRate = exchangeRates.find(rate => (rate.to === studioCurrency && rate.from === globalCreditCurrency));
      const convertedGlobalCreditAmount = Decimal(globalCredits).times(exchangeRate.rate).toNumber();
      return Math.min(currentAmount, convertedGlobalCreditAmount);
    }
    return Math.min(currentAmount, globalCredits);
  }
);

export const getFormattedCartGlobalCreditApplied = createSelector(
  [
    getCartGlobalCreditApplied,
    getStudioCurrency,
  ],
  (credits, code) => formatCurrency(credits, { code })
);

/*

PURCHASE BREAKDOWN TOTAL

*/

export const getCartSubtotalWithPackageClasses = createSelector(
  [
    getCartEventsAdjustedValue,
    getCartSubtotal,
  ],
  (adjustedEventPrices, subtotal) => +Decimal(adjustedEventPrices).plus(subtotal)
);

export const getFormattedCartSubtotalWithPackageClasses = createSelector(
  [
    getCartSubtotalWithPackageClasses,
    getStudioCurrency,
  ],
  (subtotal, code) => formatCurrency(subtotal, { code })
);

export const getCartTotal = createSelector(
  [
    getCartAmountAfterRAFCredits,
    getCartGlobalCreditApplied,
  ],
  (currentAmount, creditsApplied) => +Decimal(currentAmount).minus(creditsApplied)
);

export const getFormattedCartTotal = createSelector(
  [
    getCartTotal,
    getStudioCurrency,
  ],
  (total, code) => formatCurrency(total, { code })
);

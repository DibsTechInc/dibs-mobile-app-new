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
  getCartData,
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

export const getCartPromoCodeAmount = createSelector(
  [
    getSortedCartEvents,
    getPromoCodeType,
    getPromoCodeAmount,
    getPromoCodeProduct,
  ],
  (cartEvents, promoCodeType, promoCodeAmount) => {
    if (!cartEvents.length) return 0;

    switch (promoCodeType) {
      case PROMO_TYPE_FREE_CLASS:
        return cartEvents[0].price;
      case PROMO_TYPE_PERCENT_OFF_ONE_CLASS:
        return Decimal(promoCodeAmount)
          .dividedBy(100)
          .times(cartEvents[0].price)
          .toDecimalPlaces(2)
          .toNumber();
      case PROMO_TYPE_CASH_OFF:
        return Math.min(promoCodeAmount, cartEvents[0].price);
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
    getCartData,
    getUserStudioPassesInCart,
  ],
  (cartEvents, passesInCart) => cartEvents.map((cartEvent) => {
    const pass = passesInCart.find(p => p.id === cartEvent.passid);
    if (!pass) return 0; // events paid without passes will be handled separately
    const eventPassValue = Math.min((pass.studioPackage.unlimited ? cartEvent.price : pass.passValue), cartEvent.price);
    return Decimal(eventPassValue).times(cartEvent.quantity).toNumber(); // classes priced higher than their pass value earn zero credit
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
    getPromoCodeAmount,
    getUserFlashCreditAmount,
    getCartEventsAdjustedValue,
  ],
  (passes, passesValue, promoType, promoAmount, flashCredAmount, adjustedEventsValue) => (
    passes.length ? Math.max(
                      0,
                      Decimal(passesValue).plus(flashCredAmount)
                                          .plus(promoType === PROMO_TYPE_FREE_CLASS ? 0 : promoAmount)
                                          .minus(adjustedEventsValue)
                                          .toNumber()
                    )
                  : 0
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

*/

export const getCartEventsWithoutPasses = createSelector( // TODO edit
  getSortedCartEvents,
  cartEvents => cartEvents.filter(cartEvent => !cartEvent.passid)
);

export const getCartSubtotal = createSelector(
  getCartEventsWithoutPasses,
  events => events.reduce(
    (acc, event) => acc.plus(Decimal(event.price).times(event.quantity)),
  Decimal(0)
).toNumber()
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
    getCartEventsWithoutPasses,
    getUserStudioPassesInCart,
    getCartDiscountAmount,
  ],
  (events, passes, discount) => events.reduce(
    (acc, event, i) => {
      let price = Decimal(event.price).times(event.quantity);
      const taxRate = Decimal(event.taxRate).dividedBy(100);
      if (!i && !passes.length) {
        price = price.minus(Math.min(discount, event.price));
      }
      return acc.plus(price.times(taxRate).toDecimalPlaces(2));
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

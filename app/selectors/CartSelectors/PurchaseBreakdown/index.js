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
  getCartCreditsWithPrice,
  getCreditAmountInCart,
  getCreditLoadBonusInCart,
} from '../';

import {
  getUserFlashCreditAmount,
  getUserStudioCreditsAmount,
  getUserRAFCreditAmount,
  getUserStudioCreditLoadBonusAmount,
} from '../../UserSelectors';

import { getUpcomingEventsBySchedule } from '../../UpcomingEventsSelectors';

import { getUserStudioPassesInCart, getUserHasUnlmitedMembershipWithDailyUsageLimit } from '../../UserSelectors/Passes';
import { getStudioCurrency } from '../../StudioSelectors';
import { getStudioLocations } from '../../StudioSelectors/Locations';
import { PROMO_PRODUCT_CLASS, PROMO_PRODUCT_UNIVERSAL, PROMO_PRODUCT_PACKAGE } from '../../../constants/index';

export const getCartHasPackages = createSelector(
  getSortedCartPackages,
  items => Boolean(items.length)
);

export const getCartHasEvents = createSelector(
  getSortedCartEvents,
  items => Boolean(items.length)
);

export const getCartPromoIsAppliedToPackage = createSelector(
  getCartHasPackages,
  getPromoCodeProduct,
  (cartHasPacks, promoProduct) =>
    Boolean(cartHasPacks && [PROMO_PRODUCT_PACKAGE, PROMO_PRODUCT_UNIVERSAL].includes(promoProduct))
);

export const getCartPromoIsAppliedToEvent = createSelector(
  getCartPromoIsAppliedToPackage,
  getPromoCodeProduct,
  (promoIsAppliedToPack, promoProduct) =>
    Boolean(!promoIsAppliedToPack && [PROMO_PRODUCT_CLASS, PROMO_PRODUCT_UNIVERSAL].includes(promoProduct))
);

export const getCartPromoCodeAmount = createSelector(
  [
    getSortedCartPackages,
    getSortedCartEvents,
    getCartPromoIsAppliedToPackage,
    getCartPromoIsAppliedToEvent,
    getPromoCodeType,
    getPromoCodeAmount,
  ],
  (
    packItems,
    eventItems,
    promoIsAppliedToPack,
    promoIsAppliedToEvent,
    promoType,
    promoAmount
  ) => {
    if (!promoIsAppliedToEvent && !promoIsAppliedToPack) return 0;
    const itemToApplyCode = (promoIsAppliedToPack ? packItems : eventItems)[0];
    if (!itemToApplyCode) return 0;
    switch (promoType) {
      case PROMO_TYPE_FREE_CLASS:
        return itemToApplyCode.price;
      case PROMO_TYPE_PERCENT_OFF_ONE_CLASS:
        return Decimal(promoAmount)
          .dividedBy(100)
          .times(itemToApplyCode.price)
          .toDecimalPlaces(2)
          .toNumber();
      case PROMO_TYPE_CASH_OFF:
        return Math.min(promoAmount, itemToApplyCode.price);
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

export const getCartFlashCreditAmount = createSelector(
  getUserFlashCreditAmount,
  getSortedCartEvents,
  (fcAmount, events) => (events.length && fcAmount)
);

export const getFormattedCartFlashCreditAmount = createSelector(
  [
    getCartFlashCreditAmount,
    getStudioCurrency,
  ],
  (fcAmount, code) => formatCurrency(fcAmount, { code })
);

/*

PURCHASE BREAKDOWN WHEN USER HAS PASSES

*/

export const getCartPassesValue = createSelector(
  getUserStudioPassesInCart,
  passes => passes.reduce(
    (acc, pass) => acc.plus(
      Decimal(
        pass.displayPassValue ?
          pass.passValue : pass.eventPrices
      ).times(pass.displayPassValue ? pass.quantity : 1)
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

export const getCartEventsWithPasses = createSelector(
  getSortedCartEvents,
  items => items.filter(item => item.passid)
);

export const getCartEventsAdjustedPrices = createSelector(
  [
    getCartEventsWithPasses,
    getUserStudioPassesInCart,
  ],
  (cartItems, passesInCart) => cartItems.map((cartItem) => {
    const pass = passesInCart.find(p => p.id === cartItem.passid);
    if (!pass) return 0; // events paid without passes will be handled separately
    const eventPassValue = Math.min(
      (pass.displayPassValue ?
        pass.passValue : cartItem.price),
      cartItem.price
    );
    return Decimal(eventPassValue).times(cartItem.quantity).toNumber(); // classes priced higher than their pass value earn zero credit
  })
);

export const getCartEventsAdjustedValue = createSelector(
  getCartEventsAdjustedPrices,
  prices => +prices.reduce((acc, price) => acc.plus(price), Decimal(0))
);

export const getCartValueBack = createSelector(
  [
    getUserStudioPassesInCart,
    getCartPassesValue,
    getPromoCodeType,
    getCartHasPackages,
    getPromoCodeAmount,
    getCartPromoIsAppliedToEvent,
    getCartFlashCreditAmount,
    getCartEventsAdjustedValue,
  ],
  (
    passes,
    passesValue,
    promoType,
    packsInCart,
    promoAmount,
    promoAppliedToEvent,
    flashCredAmount,
    adjustedEventsValue
  ) => (
    passes.length ? Math.max(
      0,
      Decimal(passesValue)
        .plus(flashCredAmount)
        .plus(+(promoAppliedToEvent && promoAmount))
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

export const getCartEventsWithoutPasses = createSelector(
  getSortedCartEvents,
  cartEvents => cartEvents.filter(cartEvent => !cartEvent.passid)
);

export const getCartEventSubtotal = createSelector(
  getCartEventsWithoutPasses,
  items => +items.reduce(
    (acc, item) =>
      acc.plus(Decimal(item.price).times(item.quantity)),
    Decimal(0))
);

export const getCartEventDiscountAmount = createSelector(
  [
    getCartPromoIsAppliedToEvent,
    getCartEventsWithPasses,
    getCartPromoCodeAmount,
    getCartFlashCreditAmount,
  ],
  (promoIsAppliedToEvent, eventItemsWithPasses, promoAmount, fcAmount) =>
    (eventItemsWithPasses.length ?
      0 : +Decimal(promoIsAppliedToEvent ? promoAmount : 0).plus(fcAmount))
);

export const getCartPackSubtotal = createSelector(
  getSortedCartPackages,
  items => +items.reduce(
    (acc, item) =>
      acc.plus(Decimal(item.price).times(item.quantity)),
    Decimal(0))
);

export const getCartPackDiscountAmount = createSelector(
  getCartPromoIsAppliedToPackage,
  getCartPromoCodeAmount,
  (promoIsAppliedToPack, promoAmount) => +(promoIsAppliedToPack && promoAmount)
);

export const getCartCreditTotal = createSelector(
  getCartCreditsWithPrice,
  items => +items.reduce(
    (acc, item) =>
      acc.plus(Decimal(item.price).times(item.quantity)),
    Decimal(0))
);

export const getCartSubtotal = createSelector(
  getCartEventSubtotal,
  getCartPackSubtotal,
  getCartCreditTotal,
  (eventSubtotal, packSubtotal, creditSubtotal) => +Decimal(eventSubtotal).plus(packSubtotal).plus(creditSubtotal)
);

export const getFormattedCartSubtotal = createSelector(
  [
    getCartSubtotal,
    getStudioCurrency,
  ],
  (subtotal, code) => formatCurrency(subtotal, { code })
);

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

export const getCartDiscountAmount = createSelector(
  getCartEventDiscountAmount,
  getCartPackDiscountAmount,
  (eventDiscount, packDiscount) => +Decimal(eventDiscount).plus(packDiscount)
);

export const getCartEventTaxAmount = createSelector(
  [
    getCartEventsWithoutPasses,
    getCartEventDiscountAmount,
    state => ((state.events || {}).data || []),
    getStudioLocations,
  ],
  (eventItems, eventDiscount, events, locations) =>
    eventItems.reduce(
      (acc, item, i) => {
        const event = events.find(e => e.id === item.eventid);
        const loc = locations.find(l => l.id === event.location.id);
        const taxRate = Decimal(loc.tax_rate).dividedBy(100);
        let price = Decimal(item.price).times(item.quantity);
        if (!i) price = price.minus(eventDiscount);
        price = price.times(taxRate).toDP(2);
        return acc.plus(price);
      },
      Decimal(0))
);

export const getCartPackTaxAmount = createSelector(
  [
    getSortedCartPackages,
    getCartPackDiscountAmount,
  ],
  (packItems, packDiscount) =>
    packItems.reduce(
      (acc, item, i) => {
        let taxes = Decimal(item.packageTaxes).times(item.quantity);
        if (!i) {
          taxes = taxes.minus(Decimal(packDiscount).times(item.taxRate).toDP(2));
        }
        return acc.plus(taxes);
      },
      Decimal(0))
);

export const getCartTaxAmount = createSelector(
  [
    getCartEventTaxAmount,
    getCartPackTaxAmount,
  ],
  (eventTaxes, packTaxes) => +Decimal(eventTaxes).plus(packTaxes)
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

export const getCartStudioCreditAppliedToPacks = createSelector(
  [
    getCartPackSubtotal,
    getCartPackTaxAmount,
    getCartPackDiscountAmount,
    getUserStudioCreditsAmount,
    getUserStudioCreditLoadBonusAmount,
    getCreditAmountInCart,
    getCreditLoadBonusInCart,
  ],
  (
    packSubtotal,
    packTaxes,
    packDiscount,
    userCreditAmount,
    userCreditBonus,
    cartCreditAmount,
    cartCreditBonus
  ) => Math.min(
    Decimal(packSubtotal).minus(packDiscount).plus(packTaxes),
    Decimal(userCreditAmount).minus(userCreditBonus).plus(cartCreditAmount).minus(cartCreditBonus)
  )
);

export const getCartStudioCreditAppliedToEvents = createSelector(
  [
    getCartEventSubtotal,
    getCartEventTaxAmount,
    getCartEventDiscountAmount,
    getUserStudioCreditsAmount,
    getCreditAmountInCart,
    getCartStudioCreditAppliedToPacks,
  ],
  (
    eventSubtotal,
    eventTaxes,
    eventDiscount,
    userCreditAmount,
    cartCreditAmount,
    creditAppliedToPacks
  ) => Math.min(
    Decimal(eventSubtotal).minus(eventDiscount).plus(eventTaxes),
    Decimal(userCreditAmount).plus(cartCreditAmount).minus(creditAppliedToPacks)
  )
);

export const getCartStudioCreditsApplied = createSelector(
  [
    getCartStudioCreditAppliedToPacks,
    getCartStudioCreditAppliedToEvents,
  ],
  (creditForPacks, creditForEvents) => +Decimal(creditForPacks).plus(creditForEvents)
);

export const getFormattedCartStudioCreditsApplied = createSelector(
  [
    getCartStudioCreditsApplied,
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

export const getCartTotal = createSelector(
  [
    getCartAmountAfterStudioCredits,
    getCartRAFCreditApplied,
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

export const getShouldDisplayPaymentWarning = createSelector(
  [
    getUpcomingEventsBySchedule,
    getUserHasUnlmitedMembershipWithDailyUsageLimit,
  ],
  (events, limitedUnlimitedPass) => Boolean(events.length) && limitedUnlimitedPass
);


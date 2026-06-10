import { uniq } from 'lodash';
import { createSelector } from 'reselect';
import moment from 'moment-timezone';
import Decimal from 'decimal.js';
import { format as formatCurrency } from 'currency-formatter';

import Config from '../../../config.json';
import { getEventsData } from '../EventsSelectors';
import { getUserPasses } from '../UserSelectors/Passes';
import { getStudioCustomTimeFormat, getStudioCurrency, getStudioShortDateFormat, getStudioMaximumCartQuantity } from '../StudioSelectors';
import { getUpcomingEventsData } from '../UpcomingEventsSelectors';
import { getDetailedStudioPackages } from '../StudioSelectors/Packages';
import { getDetailedStudioCreditTiers, getStudioCreditTiers } from '../StudioSelectors/CreditTiers';

/**
 * @param {Object} state in store
 * @returns {Object} cart state
 */
export function getCart(state) {
  return state.cart;
}

/**
 * @param {Object} state in store
 * @returns {boolean} if cart is being sent for purchase
 */
export function getCartIsPurchasing(state) {
  return getCart(state).purchasing;
}

/**
 * @param {Object} state in store
 * @returns {Array<Object>} items in cart
 */
export function getCartEventItems(state) {
  return getCart(state).events || [];
}

/**
 * @param {Object} state in store
 * @returns {boolean} whether user has selected all spots if spot booking
 */
export function getAllSpotBookingSpotsPicked(state) {
  return getCart(state).allSpotBookingSpotsPicked || false;
}
/**
 * @param {Object} state in store
 * @returns {object} the last room picked
 */
export function getLastRoomSpot(state) {
  return getCart(state).lastRoomSpot || {};
}

/**
 * @param {Object} state in store
 * @returns {Array<Object>} items in cart
 */
export function getCartPackages(state) {
  return getCart(state).packages || [];
}

/**
 * @param {Object} state in store
 * @returns {Array<Object>} items in cart
 */
export function getCartCredits(state) {
  return getCart(state).credits || [];
}

export const getTotalQuantityInCart = createSelector(
  [
    getCartEventItems,
    getCartPackages,
    getCartCredits,
  ],
  (events, packages, credits) => events.reduce((a, b) => a + b.quantity, 0) + packages.length + credits.length
);

export const getSortedCartEvents = createSelector(
  getCartEventItems,
  events => events.sort((eventA, eventB) => {
    if (eventA.price === 0 && eventB.price) return 1;
    if (eventB.price === 0 && eventA.price) return -1;
    return eventA.price - eventB.price;
  })
);

export const getCartEventIds = createSelector(
  getSortedCartEvents,
  events => uniq(events.map(e => e.eventid))
);

export const getCartEventNames = createSelector(
  getSortedCartEvents,
  items => uniq(items.map(e => e.name))
);

export const getCartEvents = createSelector(
  [
    getSortedCartEvents,
    getEventsData,
  ],
  (cartItems, events) => cartItems.reduce(
    (acc, cartEvent) => {
      const arrayEvent = acc.find(e => e.eventid === cartEvent.eventid);
      if (!arrayEvent) {
        const eventData = events.find(e => e.id === cartEvent.eventid);
        const { passid, quantity, ...cartEventData } = cartEvent;
        acc.push({ ...eventData, ...cartEventData, quantity, passids: [{ passid, quantity }] });
        return acc;
      }
      arrayEvent.quantity += cartEvent.quantity;
      arrayEvent.passids.push({ passid: cartEvent.passid, quantity: cartEvent.quantity });
      return acc;
    },
    []
  )
);

export const getDetailedCartEvents = createSelector(
  [
    getCartEvents,
    getStudioCurrency,
    getUserPasses,
    getStudioCustomTimeFormat,
    getUpcomingEventsData,
    getStudioShortDateFormat,
    getStudioMaximumCartQuantity,
  ],
  (
    items,
    currency,
    userPasses,
    timeFormat,
    upcomingEvents,
    shortDateFormat,
    maxCartQuantity
  ) => items.map(({ instructor, location, ...item }) => {
    const formatLocalTime = time => moment(time).tz(item.mainTZ).format(timeFormat);
    const localStartTime = moment.tz(item.start_time, item.mainTZ);

    // Getting the proper subtotal since each item in the cart is eventid/passid combo
    const displayedPrice = item.passids.reduce((acc, { passid, quantity }) => {
      if (!passid) return acc.plus(Decimal(item.price).times(quantity));
      const pass = userPasses.find(p => p.id === passid);
      const passValue = pass && pass.passValue;
      let adjustedPrice = Decimal(Math.min(item.price, (passValue || 0)));
      adjustedPrice = adjustedPrice.times(quantity);
      return acc.plus(adjustedPrice);
    }, Decimal(0));
    const maxSeatsReached = Boolean(
      (item.quantity + item.current_enrollment) === item.maximum_enrollment
      || item.quantity === maxCartQuantity
    );
    const bookedEvent = upcomingEvents.find(userEvent => userEvent.eventid === item.eventid);

    return {
      ...item,
      shortDayOfWeek: localStartTime.format('ddd'),
      shortEventDate: localStartTime.format(shortDateFormat),
      startTimeInLocalTZ: formatLocalTime(item.start_time),
      endTimeInLocalTZ: formatLocalTime(item.end_time),
      instructorName: instructor.name,
      locationName: location.name,
      formattedRoundedPrice: formatCurrency(displayedPrice.toNumber(), { precision: 0, code: currency }),
      seatsRemaining: item.seats_remaining,
      soldOut: item.seats_remaining <= 0,
      seatsSold: item.current_enrollment,
      maxSeatsReached,
      taxRate: location.tax_rate,
      userHasBooked: Boolean(bookedEvent),
    };
  })
);

export const getDetailedCartPackages = createSelector(
  getCartPackages,
  getDetailedStudioPackages,
  (cartItems, packages) => cartItems.map(item => ({
    ...item,
    ...packages.find(pkg => pkg.id === item.packageid),
  }))
);

export const getSortedCartPackages = createSelector(
  getDetailedCartPackages,
  pkgs => pkgs.sort((pkgA, pkgB) => {
    if (pkgA.price === 0 && pkgB.price) return 1;
    if (pkgB.price === 0 && pkgA.price) return -1;
    return pkgA.price - pkgB.price;
  })
);

export const getCartCreditsWithPrice = createSelector(
  getCartCredits,
  getStudioCreditTiers,
  (cartItems, creditTiers) => cartItems.map(item => ({
    ...item,
    price: creditTiers.find(creditTier => creditTier.id === item.creditTierId).payAmount,
  }))
);

export const getDetailedCartCredits = createSelector(
  getCartCredits,
  getDetailedStudioCreditTiers,
  (cartItems, creditTiers) => cartItems.map(item => ({
    ...item,
    ...creditTiers.find(creditTier => creditTier.id === item.creditTierId),
  }))
);

export const getCreditAmountInCart = createSelector(
  getDetailedCartCredits,
  items => +items.reduce((acc, item) => acc.plus(item.receiveAmount), Decimal(0))
);

export const getCreditLoadBonusInCart = createSelector(
  getDetailedCartCredits,
  items => +items.reduce((acc, item) => acc.plus(item.loadBonus), Decimal(0))
);

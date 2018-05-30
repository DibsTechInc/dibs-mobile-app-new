import { uniq } from 'lodash';
import { createSelector } from 'reselect';
import moment from 'moment-timezone';
import Decimal from 'decimal.js';
import { format as formatCurrency } from 'currency-formatter';

import { getEventsData } from '../EventsSelectors';
import { getUserPasses } from '../UserSelectors/Passes';
import { getStudioCustomTimeFormat, getStudioCurrency, getStudioShortDateFormat } from '../StudioSelectors';
import { getUpcomingEventsData } from '../UpcomingEventsSelectors';

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
export function getCartData(state) {
  return getCart(state).data || [];
}

export const getCartLength = createSelector(
  getCartData,
  data => data.length
);

export const getTotalQuantityInCart = createSelector(
  getCartData,
  data => data.reduce((a, b) => a + b.quantity, 0)
);

export const getSortedCartItems = createSelector(
  getCartData,
  items => items.sort((itemA, itemB) => {
    if (itemA.price === 0 && itemB.price) return 1;
    if (itemB.price === 0 && itemA.price) return -1;
    return itemA.price - itemB.price;
  })
);

export const getCartEventIds = createSelector(
  getSortedCartItems,
  items => uniq(items.map(e => e.eventid))
);

export const getCartEventNames = createSelector(
  getSortedCartItems,
  items => uniq(items.map(e => e.name))
);

export const getCartEvents = createSelector(
  [
    getCartData,
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
  ],
  (events, currency, userPasses, timeFormat, upcomingEvents, shortDateFormat) => events.map(({ instructor, location, ...event }) => {
    const formatLocalTime = time => moment(time).tz(event.mainTZ).format(timeFormat);
    const localStartTime = moment.tz(event.start_time, event.mainTZ);

    // Getting the proper subtotal since each item in the cart is eventid/passid combo
    const displayedPrice = event.passids.reduce((acc, { passid, quantity }) => {
      if (!passid) return acc.plus(Decimal(event.price).times(quantity));
      const pass = userPasses.find(p => p.id === passid);
      const passValue = pass && pass.passValue;
      let adjustedPrice = Decimal(Math.min(event.price, passValue || 0));
      adjustedPrice = adjustedPrice.times(quantity);
      return acc.plus(adjustedPrice);
    }, Decimal(0));
    const maxSeatsReached = Boolean(
      (event.quantity + event.current_enrollment) === event.maximum_enrollment
      || event.quantity === 4
    );
    const bookedEvent = upcomingEvents.find(userEvent => userEvent.eventid === event.eventid);

    return {
      ...event,
      shortDayOfWeek: localStartTime.format('ddd'),
      shortEventDate: localStartTime.format(shortDateFormat),
      startTimeInLocalTZ: formatLocalTime(event.start_time),
      endTimeInLocalTZ: formatLocalTime(event.end_time),
      instructorName: instructor.name,
      locationName: location.name,
      formattedRoundedPrice: formatCurrency(displayedPrice.toNumber(), { precision: 0, code: currency }),
      seatsRemaining: event.seats_remaining,
      soldOut: event.seats_remaining <= 0,
      seatsSold: event.current_enrollment,
      maxSeatsReached,
      taxRate: location.tax_rate,
      userHasBooked: Boolean(bookedEvent),
    };
  })
);

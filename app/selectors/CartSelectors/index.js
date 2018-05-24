import { uniq } from 'lodash';
import { createSelector } from 'reselect';
import { getScheduleEvents } from '../EventsSelectors';

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
  getCartEventIds,
  getScheduleEvents,
  (eventids, events) => eventids.map(eventid => events.find(event => event.id === eventid))
);

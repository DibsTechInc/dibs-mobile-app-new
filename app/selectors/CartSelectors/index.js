import { uniq } from 'lodash';
import Decimal from 'decimal.js';
import { createSelector } from 'reselect';
import { getStudioCurrency } from '../StudioSelectors';

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
 * @returns {string} error message
 */
export function getCartErrorMessage(state) {
  return getCart(state).errorMessage;
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

export const getSortedCartEvents = createSelector(
  getCartData,
  events => events.sort((itemA, itemB) => {
    if (itemA.price === 0 && itemB.price) return 1;
    if (itemB.price === 0 && itemA.price) return -1;
    return itemA.price - itemB.price;
  })
);

export const getCartEventIds = createSelector(
  getCartData,
  events => uniq(events.map(e => e.eventid))
);

export const getCartEventNames = createSelector(
  [getCartData],
  cartEvents => uniq(cartEvents.map(e => e.name))
);

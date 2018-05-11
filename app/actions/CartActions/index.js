import { createActions } from 'redux-actions';
import { cloneDeep, uniq } from 'lodash';
import moment from 'moment';
import {
  getUsersNextPassId,
  getSortedCartEvents,
  getUserHasPasses,
  getCanUseCardToPurchase,
} from '../../selectors';

import {
  clearPromoCodeData,
  clearPackagePromoCode,
  setEventSoldOut,
  requestEventData,
  setUser,
  setTransactionsConfirmed,
  requestUserEvents,
} from '../';

const range = n => [...Array(n)]; // JS implementation of Python's range() fn

export const {
  addToCart,
  clearCart,
  setCartData,
  setCartVisibleTrue,
  setCartVisibleFalse,
  setCartPurchasingTrue,
  setCartPurchasingFalse,
} = createActions({
  ADD_TO_CART: item => item,
  CLEAR_CART: () => [],
  SET_CART_DATA: payload => payload,
  SET_CART_VISIBLE_TRUE: () => true,
  SET_CART_VISIBLE_FALSE: () => false,
  SET_CART_PURCHASING_TRUE: () => true,
  SET_CART_PURCHASING_FALSE: () => false,
});

/**
 * Remove a single item from the cart. In order to ensure that
 * users get all their eligible passes applied to their classes,
 * when a user removes a single event item, the cart is rebuilt
 * and reselects the next eligible pass on each dispatch of
 * addEventToClientCart.
 *
 * @param {number} eventid id of the event being removed
 * @param {object} options optional params
 * @param {boolean} [options.toggleVisibility=true] whether or not to change visibility state
 * @returns {Object} action on the state
 */
export function removeOneEventItem(eventid, { toggleVisibility = true } = {}) {
  return function innerRemoveOneEventItem(dispatch, getState) {
    // stores items in cart before removal
    // in the order they are added
    let { data } = getState().cart;
    data = cloneDeep(data);

    const itemToRemoveFrom = data.find(item => item.eventid === eventid);
    if (!itemToRemoveFrom) return;
    const indexOfItem = data.indexOf(itemToRemoveFrom);
    if (toggleVisibility) dispatch(setCartVisibleTrue()); // so the cart view won't close before this is done
    dispatch(setCartData(data.slice(0, indexOfItem)));
    data.slice(indexOfItem).forEach(item => (
      // will iterate over the quantity of each item
      // the item to be removed will be skipped once
      [...Array(item.quantity - Number((item === itemToRemoveFrom) && 1))].forEach(() => {
        const passid = getUsersNextPassId(getState())(item.eventid);
        dispatch(addToCart({ ...item, passid }));
      })
    ));
    if (toggleVisibility) dispatch(setCartVisibleFalse());
  };
}

/**
 * Saves a previous version of the cart without any
 * items with eventids of the chosen event to remove.
 * It then rebuilds the cart, reselecting the next
 * pass to use for addEventToClientCart
 *
 * @param {type} eventid of the class to update
 * @returns {Object} action on the state
 */
export function removeEventFromCart(eventid) {
  return function innerRemoveEventFromCart(dispatch, getState) {
    // Storing all items in previous cart for every other event
    // in the order they were added
    let { data } = getState().cart;
    data = cloneDeep(data);
    data = data.filter(item => item.eventid !== eventid);

    dispatch(setCartVisibleTrue()); // so the cart view won't close before this is done
    dispatch(clearCart());
    data.forEach(item => (
      // will iterate over the quantity of each item
      [...Array(item.quantity)].forEach(() => {
        const passid = getUsersNextPassId(getState())(item.eventid);
        dispatch(addToCart({ ...item, passid }));
      })
    ));
    // dispatch(reverifyPromoCode()); TODO for promo codes
    dispatch(setCartVisibleFalse());
  };
}

/**
 * @returns {Object} action on the state
 */
export function removeExpiredEvents() {
  return function innerRemoveExpiredEventsFromCart(dispatch, getState) {
    // Storing all items in previous cart for every other event
    // in the order they were added
    let { data } = getState().cart;
    data = cloneDeep(data);
    data = data.filter(item => moment(item.start_time).isAfter(moment().local().add(10, 'minutes')));

    dispatch(setCartVisibleTrue()); // so the cart view won't close before this is done
    dispatch(clearCart());
    data.forEach(item => (
      // will iterate over the quantity of each item
      range(item.quantity).forEach(() => {
        const passid = getUsersNextPassId(getState())(item.eventid);
        dispatch(addToCart({ ...item, passid }));
      })
    ));
    dispatch(setCartVisibleFalse());
  };
}

/**
 * Check for applying a free class promo when there are passes
 * @returns {function} redux thunk
 */
export function applyFreeClassPromoToCart() {
  return function innerApplyFreeClassPromoToCart(dispatch, getState) {
    const cartData = getSortedCartEvents(getState());
    const { eventid } = cartData[0];
    const copiedItem = { ...cartData[0], passid: null };
    dispatch(setCartVisibleTrue());
    dispatch(removeOneEventItem(eventid, { toggleVisibility: false }));
    dispatch(addToCart(copiedItem));
    dispatch(setCartVisibleFalse());
  };
}

/**
 * Refresh cart once user logs in or out to account for passes
 * @returns {function} redux thunk
 */
export function refreshCart() {
  return function innerRefreshCart(dispatch, getState) {
    const cartData = getState().cart.data;
    dispatch(setCartVisibleTrue());
    dispatch(clearCart());
    cartData.forEach(cartEvent => [...Array(cartEvent.quantity)].forEach(() => {
      const nextPassId = getUsersNextPassId(getState())(cartEvent.eventid);
      cartEvent.passid = nextPassId;
      dispatch(addToCart(cartEvent));
    }));
    dispatch(setCartVisibleFalse());
  };
}

/**
 * updateQuantity of an item in the cart by adding and removing event items one by one
 * this is the best solution I can come up with to make sure the correct passes are
 * applied - DC
 * @param {Object} value the eventid and quantity of the new cart item
 * @returns {function} redux thunk
 */
export function updateQuantity({ eventid, quantity }) {
  return function innerUpdateQuantity(dispatch, getState) {
    const { data } = getState().cart;
    const initialQuantityInCart = data.filter(event => event.eventid === eventid)
                                      .reduce((acc, { quantity: q }) => acc + q, 0);
    if (!initialQuantityInCart) return;
    range(Math.abs(quantity - initialQuantityInCart)).forEach(() => {
      if (quantity < initialQuantityInCart) return dispatch(removeOneEventItem(eventid));
      const state = getState();
      const nextPassId = getUsersNextPassId(state)(eventid);
      const cartItem = state.cart.data.find(event => event.eventid === eventid);
      return dispatch(addToCart({ ...cartItem, passid: nextPassId }));
    });
  };
}

/**
 * submitCartForPurchase to the server
 * @param {function} callback on compleition, node style
 * @returns {function} redux thunk makes request
 */
export function submitCartForPurchase(callback) {
  return async function innerSubmitCartForPurchase(dispatch, getState, dibsFetch) {
    const state = getState();
    const { promoCode, cart, studio } = state;
    dispatch(setCartPurchasingTrue());

    if (!getCanUseCardToPurchase(state) && !getUserHasPasses(state)) {
      dispatch(setCartPurchasingFalse());
      return;
    }

    const cartData = cart.data.map(item => ({
      ...item,
      source: studio.source,
      studioid: studio.studioid,
    }));

    try {
      const res = await dibsFetch('/api/buy', {
        method: 'POST',
        requiresAuth: true,
        body: {
          cart: cartData,
          promoCode,
          purchasePlace: 'widget',
        },
      });

      if (res.success) {
        dispatch(setUser(res.user));
        dispatch(setTransactionsConfirmed(res.transactions));
        callback(null);
        dispatch(requestUserEvents()); // implement with upcomming classes
        // dispatch(requestUserTransactions()); implement with transaction history
        // dispatch(performTransactionAnalytics(resp.transactions)); not sure works with native
        dispatch(clearPromoCodeData());
        dispatch(clearPackagePromoCode());
      } else if (res.experimentalRoute) {
        if (res.user) dispatch(setUser(res.user));
        callback(res);
      } else {
        // let message = res.message;
        // if (res.removedEvents.every(r => r.reason === 'SOLD_OUT')) {
        //   message = 'Oh dang! The classes you chose were just recently sold out…. please pick another option.';
        //   res.removedEvents.map(event => dispatch(setEventSoldOut({ eventid: event.eventid })));
        // }
        // if (res.removedEvents.every(r => r.reason === 'PRICE_CHANGE')) {
        //   message = 'Oh dang! The classes you chose had their price increase more than 5 minutes ago. Please refresh and try again';
        // }
        // console.log(message, 'message'); // add dispatch to messages reducer?
        callback(res);
      }
    } catch (err) {
      console.log(err);
      callback(null);
    }
  };
}

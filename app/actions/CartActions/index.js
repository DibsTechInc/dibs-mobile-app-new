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
  refreshUser,
  setTransactionsConfirmed,
  requestUserEvents,
  enqueueApiError,
} from '../';

const range = n => [...Array(n)]; // JS implementation of Python's range() fn

export const {
  addEventToCart,
  addPackageToCart,
  removePackageFromCart,
  clearCart,
  setCartEventsData,
  setCartPackagesData,
  setCartVisibleTrue,
  setCartVisibleFalse,
  setCartPurchasingTrue,
  setCartPurchasingFalse,
} = createActions({
  ADD_EVENT_TO_CART: item => item,
  ADD_PACKAGE_TO_CART: item => item,
  REMOVE_PACKAGE_FROM_CART: packageid => packageid,
  CLEAR_CART: () => null,
  SET_CART_EVENTS_DATA: payload => payload,
  SET_CART_PACKAGES_DATA: payload => payload,
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
 * @param {object} cartItem id of the event being removed
 * @param {string} itemCategory optional params
 * @param {boolean} [options.toggleVisibility=true] whether or not to change visibility state
 * @returns {Object} action on the state
 */
export function removeOneEventItem(eventid, { toggleVisibility = true } = {}) {
  return function innerRemoveOneEventItem(dispatch, getState) {
    // stores items in cart before removal
    // in the order they are added
    let cart = getState().cart;
    cart = cloneDeep(cart);

    const itemToRemoveFrom = cart.events.find(item => item.eventid === eventid);

    if (!itemToRemoveFrom) return;
    const indexOfItem = cart.events.indexOf(itemToRemoveFrom);
    if (toggleVisibility) dispatch(setCartVisibleTrue());

    dispatch(setCartEventsData(cart.events.slice(0, indexOfItem)));

    // for events only applying passes
    cart.events.slice(indexOfItem).forEach((item) => {
      // will iterate over the quantity of each item
      // the item to be removed will be skipped once
      const array = [...Array(item.quantity - Number((item === itemToRemoveFrom) && 1))];
      return array.forEach(() => {
        const passid = getUsersNextPassId(getState())(item.eventid);
        dispatch(addEventToCart({ ...item, passid }));
      });
    });

    if (toggleVisibility) dispatch(setCartVisibleFalse());
  };
}

/**
 * @returns {Object} action on the state
 */
export function removeExpiredEvents() {
  return function innerRemoveExpiredEventsFromCart(dispatch, getState) {
    // Storing all items in previous cart for every other event
    // in the order they were added
    let { cart } = getState();
    cart = cloneDeep(cart);

    if (cart && cart.events) {
      cart.events = cart.events.filter(item => moment(item.start_time).isAfter(moment().local().add(10, 'minutes')));
    } else {
      console.log(cart, 'cart');
      enqueueApiError({ 'Error!': JSON.stringify(cart) });
    }

    dispatch(setCartVisibleTrue()); // so the cart view won't close before this is done
    dispatch(setCartEventsData(cart.events));

    if (cart && cart.events) {
      cart.events.forEach(item => (
        // will iterate over the quantity of each item
        range(item.quantity).forEach(() => {
          const passid = getUsersNextPassId(getState())(item.eventid);
          dispatch(addEventToCart({ ...item, passid }));
        })
      ));
    } else {
      console.log(cart, 'cart');
      enqueueApiError({ 'Error!': JSON.stringify(cart) });
    }

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
    // const cartItem = cartData[0];
    const copiedItem = { ...cartData[0], passid: null };
    dispatch(setCartVisibleTrue());
    dispatch(removeOneEventItem(copiedItem, { toggleVisibility: false }));
    dispatch(addEventToCart(copiedItem));
    dispatch(setCartVisibleFalse());
  };
}

/**
 * Refresh cart once user logs in or out to account for passes
 * @returns {function} redux thunk
 */
export function refreshCartEvents() {
  return function innerRefreshCart(dispatch, getState) {
    const { cart, events } = getState();
    dispatch(setCartVisibleTrue());
    dispatch(clearCart());

    // refresh classes

    cart.events.forEach(cartEvent => [...Array(cartEvent.quantity)].forEach(() => {
      const nextPassId = getUsersNextPassId(getState())(cartEvent.eventid);
      const selectedEvent = events.data.find(ev => ev.id === cartEvent.eventid) || {};
      cartEvent.passid = nextPassId;
      cartEvent.price = selectedEvent.price;
      dispatch(addEventToCart(cartEvent));
    }));
    dispatch(setCartVisibleFalse());
  };
}

/**
 * submitCartForPurchase to the server
 * @param {function} callback on compleition, node style
 * @returns {function} redux thunk makes request
 */
export function submitCartForPurchase() {
  return async function innerSubmitCartForPurchase(dispatch, getState, dibsFetch) {
    const state = getState();
    const { promoCode, cart } = state;
    dispatch(setCartPurchasingTrue());

    if (!getCanUseCardToPurchase(state) && !getUserHasPasses(state)) {
      dispatch(setCartPurchasingFalse());
      return;
    }

    try {
      const res = await dibsFetch('/api/user/checkout', {
        method: 'POST',
        requiresAuth: true,
        body: {
          cart: {
            events: cart.events,
            packages: cart.packages,
          },
          promoCode,
          purchasePlace: 'mobile app',
        },
      });

      if (res.success) {
        dispatch(refreshUser(res.user));
        dispatch(setTransactionsConfirmed(res.transactions));
        dispatch(clearCart());
        await dispatch(requestUserEvents());
        dispatch(refreshCartEvents());
        // dispatch(requestUserTransactions()); implement with transaction history
        // dispatch(performTransactionAnalytics(resp.transactions)); not sure works with native
        dispatch(clearPromoCodeData());
        dispatch(clearPackagePromoCode());
      } else {
        let message = `${res.message}.`;
        if (res.removedEvents.every(r => r.reason === 'SOLD_OUT')) {
          message = 'Oh no! The classes you chose were just recently sold out…. please pick another option.';
          res.removedEvents.map(event => dispatch(setEventSoldOut({ eventid: event.eventid })));
        }
        if (res.removedEvents.every(r => r.reason === 'PRICE_CHANGE')) {
          message = 'Oh no! The classes you chose had their price increase more than 5 minutes ago. Please refresh and try again';
        }
        dispatch(enqueueApiError({ title: 'Error!', message }));
      }
    } catch (err) {
      console.log(err);
      dispatch(enqueueApiError({ title: 'Error!', message: 'Something went wrong checking out your cart.' }));
    }
    const eventids = uniq(cart.events.map(({ eventid }) => eventid));
    dispatch(requestEventData({ eventids }));
    dispatch(setCartPurchasingFalse());
  };
}

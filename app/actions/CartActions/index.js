import { createActions } from 'redux-actions';
import { cloneDeep, uniq } from 'lodash';
import Sentry from 'sentry-expo';
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
  requestEventData,
  refreshUser,
  setTransactionsConfirmed,
  requestUserEvents,
  enqueueApiError,
  setUserForSpot,
} from '../';

export const {
  addEventToCart,
  addPackageToCart,
  removePackageFromCart,
  addCreditLoadToCart,
  removeCreditLoadFromCart,
  clearCart,
  setCartEventsData,
  setCartPackagesData,
  setCartVisibleTrue,
  setCartVisibleFalse,
  setCartPurchasingTrue,
  setCartPurchasingFalse,
  setAllSpotBookingSpotsPickedTrue,
  setAllSpotBookingSpotsPickedFalse,
  setLastRoomSpot,
} = createActions({
  ADD_EVENT_TO_CART: item => item,
  ADD_PACKAGE_TO_CART: item => item,
  REMOVE_PACKAGE_FROM_CART: packageid => packageid,
  ADD_CREDIT_LOAD_TO_CART: creditTierId => creditTierId,
  REMOVE_CREDIT_LOAD_FROM_CART: creditTierId => creditTierId,
  CLEAR_CART: () => null,
  SET_CART_EVENTS_DATA: payload => payload,
  SET_CART_PACKAGES_DATA: payload => payload,
  SET_CART_VISIBLE_TRUE: () => true,
  SET_CART_VISIBLE_FALSE: () => false,
  SET_CART_PURCHASING_TRUE: () => true,
  SET_CART_PURCHASING_FALSE: () => false,
  SET_ALL_SPOT_BOOKING_SPOTS_PICKED_TRUE: () => true,
  SET_ALL_SPOT_BOOKING_SPOTS_PICKED_FALSE: () => false,
  SET_LAST_ROOM_SPOT: payload => payload,
});

/**
 * setSpotsInCart
 * @param {number} eventid to set event in spot
 * @param {Object} spot spot data
 * @returns {Object} action on the state
 */
export function setSpotInCart(eventid, spot) {
  return async function innerSetSpotsInCart(dispatch, getState) {
    const state = getState();
    const { cart, user } = state;
    const cartItems = cart.events;

    const clonedCart = cloneDeep(cartItems);
    const i = clonedCart.findIndex(event => event.eventid === eventid);

    if (clonedCart[i].spotIds.length === clonedCart[i].quantity) return null;
    clonedCart[i].spotIds.push(spot.id);

    if ((clonedCart[i].spotIds.length + 1) > clonedCart[i].quantity) {
      dispatch(setAllSpotBookingSpotsPickedTrue());
    }

    dispatch(setLastRoomSpot(spot));
    dispatch(setCartEventsData(clonedCart));
    return dispatch(setUserForSpot({ eventid, userid: user.id, x: spot.x, y: spot.y }));
  };
}

/**
 * removeSpotFromCart
 * @param {number} eventid to set event in spot
 * @param {Object} spot spot data
 * @returns {Object} action on the state
 */
export function removeSpotFromCart(eventid, spot = null) {
  return function innerRemoveSpotFromCart(dispatch, getState) {
    const state = getState();
    const { cart } = state;

    const cartItems = cart.events;
    const lastRoomSpot = cart.lastRoomSpot;

    if (!spot) spot = lastRoomSpot;

    const clonedCartItems = cloneDeep(cartItems);

    const i = clonedCartItems.findIndex(event => event.eventid === eventid);
    const j = clonedCartItems[i].spotIds.findIndex(spotId => spotId === spot.id);

    clonedCartItems[i].spotIds.splice(j, 1);

    dispatch(setAllSpotBookingSpotsPickedFalse());
    dispatch(setCartEventsData(clonedCartItems));
    dispatch(setUserForSpot({ eventid, userid: null, x: spot.x, y: spot.y }));
  }
}

 /** Refresh cart once user logs in or out to account for passes
  * @returns {function} redux thunk
  */
export function refreshCartEvents({ toggleVisibility = true } = {}) {
  return function innerRefreshCart(dispatch, getState) {
    const { cart, events } = getState();
    if (toggleVisibility) dispatch(setCartVisibleTrue());
    dispatch(clearCart());
    cart.events.forEach(cartEvent => [...Array(cartEvent.quantity)].forEach(() => {
      const nextPassId = getUsersNextPassId(getState())(cartEvent.eventid);
      const selectedEvent = events.data.find(ev => ev.id === cartEvent.eventid) || {};
      cartEvent.passid = nextPassId;
      cartEvent.price = selectedEvent.price;
      dispatch(addEventToCart(cartEvent));
    }));
    if (toggleVisibility) dispatch(setCartVisibleFalse());
  };
}

/**
 * Remove a single item from the cart. In order to ensure that
 * users get all their eligible passes applied to their classes,
 * when a user removes a single event item, the cart is rebuilt
 * and reselects the next eligible pass on each dispatch of
 * addEventToClientCart.
 *
 * @param {object} eventid id of the event being removed
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
    itemToRemoveFrom.quantity -= 1; // if quantity is 1, it will become 0 and refreshCartEvents will filter it out
    dispatch(setAllSpotBookingSpotsPickedFalse());
    dispatch(setCartEventsData(cart.events));
    dispatch(refreshCartEvents({ toggleVisibility }));
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
    cart.events = cart.events.filter(item => moment(item.start_time).isAfter(moment().local().add(10, 'minutes')));
    dispatch(setAllSpotBookingSpotsPickedFalse());
    dispatch(setCartEventsData(cart.events));
    dispatch(refreshCartEvents());
  };
}

/**
 * Check for applying a free class promo when there are passes
 * @returns {function} redux thunk
 */
export function applyFreeClassPromoToCart() {
  return function innerApplyFreeClassPromoToCart(dispatch, getState) {
    const cartData = getSortedCartEvents(getState());
    const copiedItem = { ...cartData[0], passid: null };
    dispatch(setCartVisibleTrue());
    dispatch(removeOneEventItem(copiedItem, { toggleVisibility: false }));
    dispatch(addEventToCart(copiedItem));
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
            credits: cart.credits,
            events: cart.events,
            packages: cart.packages,
          },
          promoCode,
          purchasePlace: 'mobile app',
        },
      });

      if (res.success) {
        dispatch(clearCart());
        dispatch(refreshUser(res.user));
        dispatch(setTransactionsConfirmed(res.transactions));
        dispatch(setAllSpotBookingSpotsPickedFalse());
        await dispatch(requestUserEvents());
        dispatch(refreshCartEvents());
        // dispatch(requestUserTransactions()); implement with transaction history
        // dispatch(performTransactionAnalytics(resp.transactions)); not sure works with native
        dispatch(clearPromoCodeData());
        dispatch(clearPackagePromoCode());
      } else {
        const message = `${res.message}.`;
        console.log(message);
        Sentry.captureException(new Error(message), { logger: 'my.module' });
        dispatch(enqueueApiError({ title: 'Error!', message }));
      }
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
      dispatch(enqueueApiError({ title: 'Error!', message: 'Something went wrong checking out your cart.' }));
    }
    const eventids = uniq(cart.events.map(({ eventid }) => eventid));
    dispatch(requestEventData({ eventids }));
    dispatch(setCartPurchasingFalse());
  };
}


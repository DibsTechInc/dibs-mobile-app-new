import { handleActions, combineActions } from 'redux-actions';
import { cloneDeep } from 'lodash';
import {
  addEventToCart,
  addPackageToCart,
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
  removePackageFromCart,
  addCreditLoadToCart,
  removeCreditLoadFromCart,
} from '../../actions/CartActions';

const initialState = {
  credits: [],
  events: [],
  packages: [],
  visible: false,
  purchasing: false,
  allSpotBookingSpotsPicked: false,
  lastRoomSpot: {},
};

/**
 * ADD_TO_CART callback
 * @param {Object} state in store before action
 * @param {Object} action on the state
 * @returns {Object} new state
 */
function handleAddEventToCart(state, { payload }) {
  const cart = cloneDeep(state);
  const arrayElem = cart.events.find(e => (e.eventid === payload.eventid && e.passid === payload.passid));
  if (arrayElem) {
    arrayElem.quantity += 1;
    return cart;
  }
  cart.events.push({ ...payload, spotIds: payload.spotIds || [], quantity: 1 });
  return cart;
}

/**
 * @param {Object} state in store before action
 * @param {Object} action on the state
 * @returns {Object} new state
 */
function handleAddPackageToCart(state, { payload }) {
  const cart = cloneDeep(state);
  if (cart.packages.find(item => item.packageid === payload.packageid)) return cart; // TODO add ability to add multiple
  cart.packages.push({ ...payload, quantity: 1 });
  return cart;
}

/**
 * @param {Object} state in store before action
 * @param {Object} action on the state
 * @returns {Object} new state
 */
function handleAddCreditLoadToCart(state, { payload }) {
  const cart = cloneDeep(state);
  if (cart.credits.find(item => item.creditTierId)) return cart;
  cart.credits.push({ creditTierId: payload, quantity: 1 });
  return cart;
}

export default handleActions({
  [addEventToCart]: handleAddEventToCart,

  [addPackageToCart]: handleAddPackageToCart,
  [removePackageFromCart]: (state, { payload }) =>
    ({ ...state, packages: state.packages.filter(item => item.packageid !== payload) }), // TODO add ability to add multiple packs

  [setCartEventsData]: (state, { payload }) => ({ ...state, events: payload }),
  [setCartPackagesData]: (state, { payload }) => ({ ...state, packages: payload }),

  [addCreditLoadToCart]: handleAddCreditLoadToCart,
  [removeCreditLoadFromCart]: (state, { payload }) =>
    ({ ...state, credits: state.credits.filter(item => item.creditTierId !== payload) }),

  [clearCart]: state => ({ ...state, credits: [], events: [], packages: [] }),

  [combineActions(
    setCartVisibleTrue,
    setCartVisibleFalse)]: (state, { payload }) => ({ ...state, visible: payload }),

  [combineActions(
    setCartPurchasingTrue,
    setCartPurchasingFalse)]: (state, { payload }) => ({ ...state, purchasing: payload }),

  [combineActions(
    setAllSpotBookingSpotsPickedTrue,
    setAllSpotBookingSpotsPickedFalse)]: (state, { payload }) => ({ ...state, allSpotBookingSpotsPicked: payload }),

  [setLastRoomSpot]: (state, { payload }) => ({ ...state, lastRoomSpot: payload }),
}, initialState);

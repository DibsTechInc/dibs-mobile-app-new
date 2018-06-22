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
  removePackageFromCart,
} from '../../actions/CartActions';

const initialState = {
  data: [],
  events: [],
  packages: [],
  visible: false,
  purchasing: false,
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
  cart.events.push({ ...payload, quantity: 1 });
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

export default handleActions({
  [addEventToCart]: handleAddEventToCart,
  [addPackageToCart]: handleAddPackageToCart,
  [removePackageFromCart]: (state, { payload }) =>
    ({ ...state, packages: state.packages.filter(item => item.packageid !== payload) }), // TODO add ability to add multiple packs
  [setCartEventsData]: (state, { payload }) => ({ ...state, events: payload }),
  [setCartPackagesData]: (state, { payload }) => ({ ...state, packages: payload }),
  [clearCart]: state => ({ ...state, events: [], packages: [] }),
  [combineActions(
    setCartVisibleTrue,
    setCartVisibleFalse)]: (state, { payload }) => ({ ...state, visible: payload }),
  [combineActions(
    setCartPurchasingTrue,
    setCartPurchasingFalse)]: (state, { payload }) => ({ ...state, purchasing: payload }),
}, initialState);

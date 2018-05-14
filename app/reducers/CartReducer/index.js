import { handleActions, combineActions } from 'redux-actions';
import { cloneDeep } from 'lodash';
import {
  addToCart,
  clearCart,
  setCartData,
  setCartVisibleTrue,
  setCartVisibleFalse,
  setCartPurchasingTrue,
  setCartPurchasingFalse,
  setCartErrorMessage,
} from '../../actions/CartActions';

const initialState = {
  data: [],
  visible: false,
  purchasing: false,
  errorMessage: '',
};

/**
 * ADD_TO_CART callback
 * @param {Object} state in store before action
 * @param {Object} action on the state
 * @returns {Object} new state
 */
function handleAddToCart(
  state,
  { payload }
) {
  const newData = cloneDeep(state.data);
  const arrayElem = newData.find(e => (e.eventid === payload.eventid && e.passid === payload.passid));
  if (arrayElem) {
    arrayElem.quantity += 1;
    return { ...state, data: newData };
  }
  newData.push({
    quantity: 1,
    eventid: payload.eventid,
    startTime: payload.start_time,
    passid: payload.passid,
    price: payload.price,
    taxRate: payload.taxRate,
    name: payload.name,
  });
  return { ...state, data: newData };
}

export default handleActions({
  [addToCart]: handleAddToCart,
  [setCartErrorMessage]: (state, { payload }) => ({ ...state, errorMessage: payload }),
  [combineActions(setCartData, clearCart)]: (state, { payload }) => ({ ...state, data: payload }),
  [combineActions(
    setCartVisibleTrue,
    setCartVisibleFalse)]: (state, { payload }) => ({ ...state, visible: payload }),
  [combineActions(
    setCartPurchasingTrue,
    setCartPurchasingFalse)]: (state, { payload }) => ({ ...state, purchasing: payload }),
}, initialState);

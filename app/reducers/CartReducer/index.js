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
} from '../../actions/CartActions';

const initialState = {
  data: [],
  visible: false,
  purchasing: false,
};

/**
 * ADD_TO_CART callback
 * @param {Object} state in store before action
 * @param {Object} action on the state
 * @returns {Object} new state
 */
function handleAddToCart(
  state,
  { payload: { start_time: startTime, eventid, passid, price, taxRate, name } }
) {
  const newData = cloneDeep(state.data);
  const arrayElem = newData.find(e => (e.eventid === eventid && e.passid === passid));
  if (arrayElem) {
    arrayElem.quantity += 1;
    return { ...state, data: newData };
  }
  newData.push({
    quantity: 1,
    eventid,
    start_time: startTime,
    passid,
    price,
    taxRate,
    name,
  });
  return { ...state, data: newData };
}

export default handleActions({
  [addToCart]: handleAddToCart,
  [combineActions(setCartData, clearCart)]: (state, { payload }) => ({ ...state, data: payload }),
  [combineActions(
    setCartVisibleTrue,
    setCartVisibleFalse)]: (state, { payload }) => ({ ...state, visible: payload }),
  [combineActions(
    setCartPurchasingTrue,
    setCartPurchasingFalse)]: (state, { payload }) => ({ ...state, purchasing: payload }),
}, initialState);

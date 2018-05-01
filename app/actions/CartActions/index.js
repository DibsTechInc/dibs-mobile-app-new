import { createActions } from 'redux-actions';

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

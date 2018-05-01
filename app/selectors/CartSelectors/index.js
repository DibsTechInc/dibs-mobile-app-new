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

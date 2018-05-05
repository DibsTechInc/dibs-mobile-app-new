/**
 * getPromoCode
 * @param {Object} state in redux store
 * @returns {Object} promo code state tree
 */
export function getPromoCode(state) {
  return state.promoCode || {};
}

/**
 * getPromoCode
 * @param {Object} state in redux store
 * @returns {Object} current promo code to be applied
 */
export function getPromoCodeData(state) {
  return getPromoCode(state).data || {};
}

/**
 * getPromoCodeType
 * @param {Object} state in redux store
 * @returns {Object} current promo code to be applied
 */
export function getPromoCodeType(state) {
  return getPromoCodeData(state).type || '';
}

/**
 * getPromoCodeProduct
 * @param {Object} state in redux store
 * @returns {Object} current promo code to be applied
 */
export function getPromoCodeProduct(state) {
  return getPromoCodeData(state).product || '';
}

/**
 * getPromoCodeAmount
 * @param {Object} state in redux store
 * @returns {Object} current promo code to be applied
 */
export function getPromoCodeAmount(state) {
  return getPromoCodeData(state).amount || 0;
}

/**
 * getAppliedPromoCode
 * @param {Object} state in redux store
 * @returns {Object} current promo code to be applied
 */
export function getAppliedPromoCode(state) {
  return getPromoCodeData(state).code || '';
}

/**
 * @param {Object} state in store
 * @returns {boolean} if promo code is being submitted for verification
 */
export function getPromoCodeIsSubmitting(state) {
  return Boolean(getPromoCode(state).submitting);
}

/**
 * @param {Object} state in store
 * @returns {string} error message
 */
export function getPromoCodeError(state) {
  return getPromoCode(state).errorMessage || '';
}

/**
 * @param {Object} state in store
 * @returns {string} notice message
 */
export function getPromoCodeNotice(state) {
  return getPromoCode(state).noticeMessage || '';
}

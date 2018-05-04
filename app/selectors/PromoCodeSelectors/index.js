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
 * getPromoCodeName
 * @param {Object} state in redux store
 * @returns {String} current promo code name
 */
export function getPromoCodeName(state) {
  return getPromoCode(state).code || '';
}

/**
 * getPromoCodeType
 * @param {Object} state in redux store
 * @returns {Object} current promo code to be applied
 */
export function getPromoCodeType(state) {
  return getPromoCode(state).type || '';
}

/**
 * getPromoCodeProduct
 * @param {Object} state in redux store
 * @returns {Object} current promo code to be applied
 */
export function getPromoCodeProduct(state) {
  return getPromoCode(state).product || '';
}

/**
 * getPromoCodeAmount
 * @param {Object} state in redux store
 * @returns {Object} current promo code to be applied
 */
export function getPromoCodeAmount(state) {
  return getPromoCode(state).amount || 0;
}

/**
 * getAppliedPromoCode
 * @param {Object} state in redux store
 * @returns {Object} current promo code to be applied
 */
export function getAppliedPromoCode(state) {
  return getPromoCode(state).code || '';
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

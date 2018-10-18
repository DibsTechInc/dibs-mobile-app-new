import { createSelector } from 'reselect';

/**
 * getCCState
 * @param {Object} state in Redux store
 * @returns {Object} credit card info in store
 */
export function getCCState(state) {
  return state.creditCard;
}

/**
 * @param {Object} state in Redux store
 * @returns {Object} credit card info in store
 */
export function getCCIsLoading(state) {
  return Boolean(getCCState(state).loading);
}

/**
 * @param {Object} state in store
 * @returns {string} last 4 of the cc
 */
export function getCCLastFour(state) {
  return (getCCState(state).last4 || '');
}

/**
 * @param {Object} state in store
 * @returns {string} type of the CC (ie visa, american expres, etc...)
 */
export function getCCType(state) {
  return (getCCState(state).type || '');
}

/**
 * @param {Object} state in store
 * @returns {number} cc expiration month
 */
export function getCCExpMonth(state) {
  return (getCCState(state).expMonth || NaN);
}

/**
 * @param {Object} state in store
 * @returns {string} cc expiration year
 */
export function getCCExpYear(state) {
  return (getCCState(state).expYear || '');
}

/**
 * @param {Object} state in store
 * @returns {boolean} if user has no card
 */
export function getIfHasNoCC(state) {
  return (getCCState(state).hasNoCard || false);
}

/**
 * @param {Object} state in store
 * @returns {boolean} if user needs to update card
 */
export function getIfCardNeedsUpdate(state) {
  return (getCCState(state).needsUpdate || false);
}

/**
 * @param {Object} state in store
 * @returns {boolean} if user needs to update card
 */
export function getIfCardIsUnavailable(state) {
  return (getCCState(state).unavailable || false);
}

export const getCCIsValid = createSelector(
  getCCState,
  cc => Boolean(cc.last4 && cc.expMonth && cc.expYear)
);

export const getCanUseCardToPurchase = createSelector(
  [
    getIfHasNoCC,
    getIfCardNeedsUpdate,
    getIfCardIsUnavailable,
    getCCIsValid,
  ],
  (hasNoCC, needsUpdate, unavailable, isValid) => (!hasNoCC && !needsUpdate && !unavailable && isValid)
);

export const getCCNumberPlaceholder = createSelector(
  getCCLastFour,
  ccLast4 => `•••• •••• •••• ${ccLast4 || '••••'}`
);

export const getCCExpirationPlaceholder = createSelector(
  [
    getCCExpMonth,
    getCCExpYear,
  ],
  (month, year) => ((month && year) ? `${`0${month}`.slice(-2)} / ${year}` : 'MM / YYYY')
);

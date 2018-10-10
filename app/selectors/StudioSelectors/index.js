import { createSelector } from 'reselect';
import { DEFAULT_MAX_CART_QUANTITY } from '../../constants';

/**
 * @param {Object} state in store
 * @returns {Object} studio state
 */
export function getStudio(state) {
  return state.studio || {};
}

/**
 * @param {Object} state in store
 * @returns {Object} studio data
 */
export function getStudioData(state) {
  return getStudio(state).data || {};
}

/**
 * @param {Object} state in store
 * @returns {string} studio source
 */
export function getStudioSource(state) {
  return getStudioData(state).source || '';
}

/**
 * @param {Object} state in store
 * @returns {boolean} true if fetching studio data
 */
export function getStudioIsLoading(state) {
  return Boolean(getStudio(state).loading);
}

/**
 * @param {Object} state in store
 * @returns {Object} config
 */
export function getStudioDibsConfig(state) {
  return getStudioData(state).dibs_config || {};
}

/**
 * @param {Object} state in store
 * @returns {string} currency symbol
 */
export function getStudioCurrency(state) {
  return getStudioData(state).currency || 'USD';
}

/**
 * @param {Object} state in store
 * @returns {string} studio class cancel time
 */
export function getStudioCancelTime(state) {
  return getStudioData(state).cancel_time || 12;
}

/**
 * @param {Object} state in store
 * @returns {string} custom date format
 */
export function getStudioCustomTimeFormat(state) {
  return getStudioDibsConfig(state).customTimeFormat || 'LT';
}

/**
 * @param {Object} state in store
 * @returns {number} Dibs studio id
 */
export function getDibsStudioId(state) {
  return getStudioData(state).id || null;
}

/**
 * @param {Object} state in store
 * @returns {number} Dibs studio id
 */
export function getStudioId(state) {
  return getStudioData(state).studioid || null;
}

/**
 * @param {Object} state in store
 * @returns {Object} studio country
 */
export function getStudioCountry(state) {
  return getStudioData(state).country || 'US';
}

/**
 * @param {Object} state in store
 * @returns {boolean} studio waiver requirements
 */
export function getStudioWaiverRequirement(state) {
  return getStudioData(state).requiresWaiverSigned;
}

/**
 * @param {Object} state in store
 * @returns {number} of days to show
 */
export function getStudioInterval(state) {
  return getStudioDibsConfig(state).interval_end || 14;
}

/**
 * @param {Object} state in store
 * @returns {string} studio's domain
 */
export function getStudioDomain(state) {
  const { domain } = getStudioData(state);
  return (domain && domain.slice(0, -1)) || 'www.ondibs.com';
}

/**
 * @param {Object} state in store
 * @returns {string} studio name
 */
export function getStudioName(state) {
  return getStudioData(state).name || 'Dibs';
}

/**
 * @param {Object} state in store
 * @returns {number} maximum allowed number of event items in cart (per class)
 */
export function getStudioMaximumCartQuantity(state) {
  return getStudioDibsConfig(state).maximum_class_cart_quantity || DEFAULT_MAX_CART_QUANTITY;
}

export const getStudioShortDateFormat = createSelector(
  getStudioCountry,
  country => ({ US: 'M/D', UK: 'D/M' })[country]
);

export const getStudioHasSpotBooking = createSelector(
  getStudioDibsConfig,
  dibsConfig => Boolean(dibsConfig.use_spot_booking)
);

export const getStudioLateDropText = createSelector(
  getStudioDibsConfig,
  dibsConfig => dibsConfig.late_drop_text || ''
);

export const getStudioRafAwardAmount = createSelector(
  getStudioDibsConfig,
  dibsConfig => dibsConfig.raf_award || 5
);

export const getStudioSpotLabel = createSelector(
  getStudioDibsConfig,
  dibsConfig => dibsConfig.spot_label || ''
);

/**
 * @param {Object} state in store
 * @returns {boolean} if the studio has credit tiers
 */
export function getStudioShowsCredits(state) {
  return Boolean(getStudioDibsConfig(state).show_credit_load);
}

/**
 * @param {Object} state in store
 * @returns {number} fixed price for a studio's first class
 */
export function getStudioFirstClassFixedPrice(state) {
  return getStudioDibsConfig(state).first_class_fixed_price;
}

import { createSelector } from 'reselect';

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

export const getStudioCustomTimeFormat = createSelector(
  getStudioDibsConfig,
  dibsConfig => (dibsConfig.customTimeFormat || 'LT')
);

/**
 * @param {Object} state in store
 * @returns {number} Dibs studio id
 */
export function getDibsStudioId(state) {
  return getStudioData(state).id || null;
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
  return getStudioData(state).requiresWaiverSigned || false;
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

export const getStudioShortDateFormat = createSelector(
  getStudioCountry,
  country => ({ US: 'M/D', UK: 'D/M' })[country]
);

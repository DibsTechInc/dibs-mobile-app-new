// import { createSelector } from 'reselect';

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
  return getStudio(state).loading;
}

/**
 * @param {Object} state in store
 * @returns {Object} config
 */
export function getStudioDibsConfig(state) {
  return getStudioData(state).dibs_config || {};
}

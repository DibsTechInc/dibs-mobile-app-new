import { createSelector } from 'reselect';

/**
 * @param {Object} state in store
 * @returns {Object} studio state
 */
export function getStudioState(state) {
  return state.studio || {};
}

/**
 * @param {Object} state in store
 * @returns {Object} config
 */
export function getStudioDibsConfig(state) {
  return getStudioState(state).dibs_config || {};
}

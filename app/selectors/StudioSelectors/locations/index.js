import { createSelector } from 'reselect';
import { getStudioData } from '../index';

/**
 * @param {Object} state in store
 * @returns {Array<Object>} studio locations
 */
export function getStudioLocations(state) {
  return getStudioData(state).locations || [];
}

export const getStudioHasMultipleLocations = createSelector(
  getStudioLocations,
  locs => (locs.length > 1)
);

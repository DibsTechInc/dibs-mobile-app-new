import { createSelector } from 'reselect';

import {
  getStudioShortDateFormat,
  getStudioCustomTimeFormat,
  getStudioCurrency,
} from '../StudioSelectors';

import { getStudioLocations } from '../StudioSelectors/Locations';
import { generateDetailedEvents } from '../../helpers';

/**
 * @param {Object} state in store
 * @returns {Object} upcoming event state
 */
export function getPastEvents(state) {
  return state.pastEvents;
}

/**
 * @param {Object} state in store
 * @returns {boolean} if upcoming events are loading
 */
export function getPastEventsLoading(state) {
  return getPastEvents(state).loading;
}

/**
 * @param {Object} state in store
 * @returns {Array<Object>} the user's past events
 */
export function getPastEventsData(state) {
  return getPastEvents(state).data || [];
}

export const getDetailedPastEvents = createSelector(
  getPastEventsData,
  getStudioCurrency,
  getStudioCustomTimeFormat,
  getStudioShortDateFormat,
  getStudioLocations,
  generateDetailedEvents
);


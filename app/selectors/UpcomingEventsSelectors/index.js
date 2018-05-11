import moment from 'moment';

/**
 * @param {Object} state in store
 * @returns {Object} upcoming event state
 */
export function getUpcomingEvents(state) {
  return state.upcomingEvents;
}

/**
 * @param {Object} state in store
 * @returns {boolean} if upcoming events are loading
 */
export function getUpcomingEventsLoading(state) {
  return getUpcomingEvents(state).loading || getUpcomingEvents(state).syncing;
}

/**
 * @param {Object} state in store
 * @returns {Array<Object>} the user's upcoming events
 */
export function getUpcomingEventsData(state) {
  return getUpcomingEvents(state).data || [];
}

/**
 * @param {OBject} state in store
 * @returns {boolean} if user has upcoming events booked
 */
export function getUserHasUpcomingEvents(state) {
  return Boolean(getUpcomingEventsData(state).length);
}


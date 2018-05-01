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
 *
 * @param {Object} state in store
 * @returns {Array<Object>}
 */
export function getUpcomingEventsData(state) {
  return getUpcomingEvents(state).data || [];
}

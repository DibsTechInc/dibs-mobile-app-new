import { createActions } from 'redux-actions';

export const {
  setUpcomingEvents,
  removeUpcomingEvent,
  clearUpcomingEvents,
  setUpcomingEventsLoadingTrue,
  setUpcomingEventsLoadingFalse,
  setSyncingEventsTrue,
  setSyncingEventsFalse,
} = createActions({
  SET_UPCOMING_EVENTS: payload => payload,
  REMOVE_UPCOMING_EVENT: eventid => eventid,
  CLEAR_UPCOMING_EVENTS: () => [],
  SET_UPCOMING_EVENTS_LOADING_TRUE: () => true,
  SET_UPCOMING_EVENTS_LOADING_FALSE: () => false,
  SET_SYNCING_EVENTS_TRUE: () => true,
  SET_SYNCING_EVENTS_FALSE: () => false,
});

/**
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function requestUserEvents(callback = () => {}) {
  return async function innerRequestUserEvents(dispatch, getState, dibsFetch) {
    const state = getState();
    if (state.upcomingEvents.loading) return;
    dispatch(setUpcomingEventsLoadingTrue());
    try {
      const res = await dibsFetch(`/api/user/events?studio=${state.studio.data.id}`, {
        method: 'GET',
        requiresAuth: true,
      });

      if (res.success) {
        dispatch(setUpcomingEvents(res.events.upcoming));
        // TODO flash MYFIRST message
      } else console.log(res);
    } catch (err) {
      console.log(err);
    }
    dispatch(setUpcomingEventsLoadingFalse());
    callback();
  };
}

/**
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function syncUserEvents(callback = () => {}) {
  return async function innerSyncUserEvents(dispatch, getState, dibsFetch) {
    const state = getState();
    if (state.upcomingEvents.syncing) return;
    try {
      dispatch(setSyncingEventsTrue());
      const { source, studioid } = getState().studio.data;
      await dibsFetch(`/api/user/events/sync/${source}/${studioid}`, {
        method: 'PUT',
        requiresAuth: true,
      });
    } catch (err) {
      console.log(err);
    }
    dispatch(setSyncingEventsFalse());
    dispatch(requestUserEvents(callback));
  };
}

import { createActions } from 'redux-actions';
import moment from 'moment-timezone';

import Config from '../../../config.json';

export const {
  setUpcomingEvents,
  removeUpcomingEvent,
  clearUpcomingEvents,
  setUpcomingEventsLoadingTrue,
  setUpcomingEventsLoadingFalse,
  setSyncingEventsTrue,
  setSyncingEventsFalse,
  setUpcomingEventsCurrentDate,
} = createActions({
  SET_UPCOMING_EVENTS: payload => payload,
  REMOVE_UPCOMING_EVENT: eventid => eventid,
  CLEAR_UPCOMING_EVENTS: () => [],
  SET_UPCOMING_EVENTS_LOADING_TRUE: () => true,
  SET_UPCOMING_EVENTS_LOADING_FALSE: () => false,
  SET_SYNCING_EVENTS_TRUE: () => true,
  SET_SYNCING_EVENTS_FALSE: () => false,
  SET_UPCOMING_EVENTS_CURRENT_DATE: payload => payload,
});

/**
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function requestUserEvents(setCurrentDate = true, callback = () => {}) {
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
        const eventDates = res.events.upcoming.map(event => +moment.tz(event.start_time, event.mainTZ));
        const minDate = moment(Math.min(...eventDates)).tz(Config.STUDIO_TZ).startOf('day');
        dispatch(setUpcomingEventsCurrentDate(minDate));
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
    dispatch(requestUserEvents(true, callback));
  };
}

/**
 * @returns {function} thunk
 */
export function setCurrentDateToFirstEventPrevMonth() {
  return function innerSetCurrentDateToFirstEventPrevMonth(dispatch, getState) {
    const state = getState();
    const { currentDate, data } = state.upcomingEvents;
    const eventsPrevMonth = data.filter((event) => {
      const eventStart = moment.tz(event.start_time, event.mainTZ);
      return eventStart.isBefore(currentDate.clone().startOf('month'))
        && eventStart.isAfter(currentDate.clone().startOf('month').subtract(1, 'month'));
    });
    const [{ start_time: startTime, mainTZ }] = eventsPrevMonth; // data is sorted in API by event start time ASC
    return dispatch(setUpcomingEventsCurrentDate(moment.tz(startTime, mainTZ).startOf('day')));
  };
}

/**
 * @returns {function} thunk
 */
export function setCurrentDateToFirstEventNextMonth() {
  return function innerSetCurrentDateToFirstEventNextMonth(dispatch, getState) {
    const state = getState();
    const { currentDate, data } = state.upcomingEvents;
    const eventsNextMonth = data.filter(
      event => moment.tz(event.start_time, event.mainTZ).startOf('month').isAfter(currentDate)
    );
    const [{ start_time: startTime, mainTZ }] = eventsNextMonth; // data is sorted in API by event start time ASC
    return dispatch(setUpcomingEventsCurrentDate(moment.tz(startTime, mainTZ).startOf('day')));
  };
}

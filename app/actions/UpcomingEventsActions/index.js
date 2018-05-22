import { createActions } from 'redux-actions';
import moment from 'moment-timezone';
import { Alert } from 'react-native';

import Config from '../../../config.json';
import { refreshUser } from '../';

export const {
  setUpcomingEvents,
  removeUpcomingEvent,
  clearUpcomingEvents,
  setUpcomingEventsLoadingTrue,
  setUpcomingEventsLoadingFalse,
  setSyncingEventsTrue,
  setSyncingEventsFalse,
  setUpcomingEventsCurrentDate,
  setDroppingEventTrue,
  setDroppingEventFalse,
} = createActions({
  SET_UPCOMING_EVENTS: payload => payload,
  REMOVE_UPCOMING_EVENT: eventid => eventid,
  CLEAR_UPCOMING_EVENTS: () => [],
  SET_UPCOMING_EVENTS_LOADING_TRUE: () => true,
  SET_UPCOMING_EVENTS_LOADING_FALSE: () => false,
  SET_SYNCING_EVENTS_TRUE: () => true,
  SET_SYNCING_EVENTS_FALSE: () => false,
  SET_UPCOMING_EVENTS_CURRENT_DATE: payload => payload,
  SET_DROPPING_EVENT_TRUE: () => true,
  SET_DROPPING_EVENT_FALSE: () => false,
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
        const eventDates = res.events.upcoming.map(event => +moment.tz(event.start_time, event.mainTZ));
        if (res.events.upcoming.length) {
          const minDate = moment(Math.min(...eventDates)).tz(Config.STUDIO_TZ).startOf('day');
          dispatch(setUpcomingEventsCurrentDate(minDate));
        }
      } else Alert.alert('Uh oh!', res.message);
    } catch (err) {
      console.log(err);
      Alert.alert('Uh oh!', 'Something went wrong getting your upcoming classes.');
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

/**
 * @param {number} eventid to drop
 * @param {*} callback on complete
 * @returns {function} thunk
 */
export function dropUserFromEvent(eventid, callback) {
  return async function innerDropUserFromEvent(dispatch, getState, dibsFetch) {
    try {
      const { dropping } = getState().upcomingEvents;
      if (dropping) return;
      dispatch(setDroppingEventTrue());
      const res = await dibsFetch(`/api/studio/unsubscribe/${eventid}`, {
        requiresAuth: true,
        method: 'DELETE',
      });
      if (res.success) {
        dispatch(removeUpcomingEvent(eventid));
        dispatch(refreshUser(res.user));
        callback(null);
      } else callback(res);
    } catch (err) {
      console.log(err);
      callback({ message: 'Something went wrong dropping your class.' });
    }
    dispatch(setDroppingEventFalse());
  };
}

import { createActions } from 'redux-actions';
import moment from 'moment-timezone';
import Sentry from 'sentry-expo';

import Config from '../../../config.json';
import { refreshUser, enqueueApiError } from '../';

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
 * @param {boolean} [showAlert=true] if false will not show native alert on fail
 * @returns {function} thunk
 */
export function requestUserEvents(showAlert = true) {
  return async function innerRequestUserEvents(dispatch, getState, dibsFetch) {
    const state = getState();
    if (!state.user.id) return;
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
      } else if (showAlert) {
        dispatch(enqueueApiError({ title: 'Error!', message: `${res.message}.` }));
      } else { // if it does not handle the error with an alert it throws an error
        throw new Error('Failed to get upcoming classes on initial load');
      }
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
      if (showAlert) dispatch(enqueueApiError({ title: 'Error!', message: 'Something went wrong getting your upcoming classes.' }));
      else throw err;
    }
    dispatch(setUpcomingEventsLoadingFalse());
  };
}

/**
 * @returns {function} thunk
 */
export function syncUserEvents() {
  return async function innerSyncUserEvents(dispatch, getState, dibsFetch) {
    const state = getState();
    if (state.upcomingEvents.syncing) return null;
    try {
      dispatch(setSyncingEventsTrue());
      const { source, studioid } = getState().studio.data;
      await dibsFetch(`/api/user/events/sync/${source}/${studioid}`, {
        method: 'PUT',
        requiresAuth: true,
      });
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
    }
    dispatch(setSyncingEventsFalse());
    return dispatch(requestUserEvents(false));
  };
}

/**
 * @returns {function} thunk
 */
export function setCurrentDateToFirstEventPrevMonth() {
  return function innerSetCurrentDateToFirstEventPrevMonth(dispatch, getState) {
    const state = getState();
    const { currentDate, data } = state.upcomingEvents;
    const eventPrevMonth = data.find((event) => {
      const eventStart = moment.tz(event.start_time, event.mainTZ);
      return eventStart.isBefore(currentDate.clone().startOf('month'))
        && eventStart.isAfter(currentDate.clone().startOf('month').subtract(1, 'month'));
    });
    if (!eventPrevMonth) {
      return dispatch(setUpcomingEventsCurrentDate(moment().tz(Config.STUDIO_TZ).startOf('day')));
    }
    const { start_time: startTime, mainTZ } = eventPrevMonth; // data is sorted in API by event start time ASC
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
    const eventNextMonth = data.find(
      event => moment.tz(event.start_time, event.mainTZ).startOf('month').isAfter(currentDate)
    );
    if (!eventNextMonth) {
      return dispatch(setUpcomingEventsCurrentDate(moment().tz(Config.STUDIO_TZ).startOf('month').add(1, 'month')));
    }
    const { start_time: startTime, mainTZ } = eventNextMonth; // data is sorted in API by event start time ASC
    return dispatch(setUpcomingEventsCurrentDate(moment.tz(startTime, mainTZ).startOf('day')));
  };
}

/**
 * @param {number} eventid to drop
 * @param {*} callback on complete
 * @returns {function} thunk
 */
export function dropUserFromEvent(eventid) {
  return async function innerDropUserFromEvent(dispatch, getState, dibsFetch) {
    try {
      const { dropping, data } = getState().upcomingEvents;
      if (dropping) return;
      const { name: eventName } = data.find(ev => eventid === ev.eventid);
      dispatch(setDroppingEventTrue());
      const res = await dibsFetch(`/api/studio/unsubscribe/${eventid}`, {
        requiresAuth: true,
        method: 'DELETE',
      });
      if (res.success) {
        dispatch(removeUpcomingEvent(eventid));
        dispatch(refreshUser(res.user));
        dispatch(enqueueApiError({ title: 'Success!', message: `You were dropped from ${eventName}` }));
      } else {
        dispatch(enqueueApiError({ title: 'Error!', message: `${res.message}.` }));
      }
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
      dispatch(enqueueApiError({ title: 'Error!', message: 'Something went wrong dropping your class.' }));
    }
    dispatch(setDroppingEventFalse());
  };
}

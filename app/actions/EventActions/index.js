import moment from 'moment';
import { createActions } from 'redux-actions';
import Sentry from 'sentry-expo';
import { stringify } from 'qs';

import { getEventsOnCurrentDate } from '../../selectors/EventsSelectors';
import { getStudioName } from '../../selectors/StudioSelectors';
import { enqueueApiError } from '../index';

const getDateAsString = date => (
  typeof date.toISOString === 'function' ? date.toISOString() : date.toString()
);

export const {
  setEvents,
  setSpots,
  addKeyToFetchingEvents,
  removeKeyFromFetchingEvents,
  setEventSoldOut,
  setEventsLoadingFalse,
  setScheduleCurrentDate,
  addDaysToScheduleCurrentDate,
  setCurrentSpotBookingEventId,
  setUserForSpot,
  setRoomForEvent,
} = createActions({
  SET_EVENTS: payload => payload,
  SET_SPOTS: payload => payload,
  ADD_KEY_TO_FETCHING_EVENTS: getDateAsString,
  REMOVE_KEY_FROM_FETCHING_EVENTS: getDateAsString,
  SET_EVENT_SOLD_OUT: payload => payload,
  SET_EVENTS_LOADING_FALSE: () => false,
  SET_SCHEDULE_CURRENT_DATE: payload => payload,
  ADD_DAYS_TO_SCHEDULE_CURRENT_DATE: num => num,
  SET_CURRENT_SPOT_BOOKING_EVENT_ID: payload => payload,
  SET_USER_FOR_SPOT: payload => payload,
  SET_ROOM_FOR_EVENT: payload => payload,
});

/**
 * requestEventData from the server
 * @param {Object} [options={}] for request
 * @param {boolean} [showAlert=true] only show native alerts if true
 * @returns {function} dispatches actions for async request
 */
export function requestEventData({ eventids } = {}, showAlert = true) {
  return async function innerRequestEventData(dispatch, getState, dibsFetch) {
    let currentDate;
    try {
      const state = getState();
      const { studio, events: { currentDate: tmp } } = state;
      currentDate = tmp;
      if (getState().events.fetching[currentDate.toISOString()]) return;
      if (!getEventsOnCurrentDate(state).length) dispatch(addKeyToFetchingEvents(currentDate));

      let path = '/api/studio/events?';
      let data = { studios: [studio.data.id] };
      if (eventids) data.eventids = eventids;
      else {
        data.start = moment.tz(moment(currentDate), studio.data.mainTZ).startOf('day').format('YYYY-MM-DD HH:mm:ss');
        data.end = moment.tz(moment(currentDate), studio.data.mainTZ).endOf('day').format('YYYY-MM-DD HH:mm:ss');
      }
      data = stringify(data, { encode: false });
      path += data;

      const res = await dibsFetch(path, { method: 'GET' });
      if (res.success) dispatch(setEvents(res.events));
      else if (showAlert) dispatch(enqueueApiError({ title: 'Error!', message: `${res.message}.` }));
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
      if (showAlert) dispatch(enqueueApiError({ title: 'Error!', message: `Something went wrong getting classes for ${getStudioName(getState())}` }));
    }
    dispatch(removeKeyFromFetchingEvents(currentDate));
  };
}

/**
 * getSpotsForEvents
 * @param {number} eventid of the event
 * @returns {function} requests the server for the event data
 */
export function getRoomForEvent(eventid) {
  return async function innerGetSpotsForEvent(dispatch, getState, dibsFetch) {
    try {
      const response = await dibsFetch(`/api/studio/event/${eventid}/spots`);
      if (response.success) {
        dispatch(setRoomForEvent({ eventid, room: response.room }));

        const spotGridWithoutNulls = response.room.spotGrid.reduce((o, m) => [...m, ...o], []).filter(Boolean);
        dispatch(setSpots(spotGridWithoutNulls));

        return response.room;
      }
      Sentry.captureException(new Error('Something went wrong getting the spot list for your event'));
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error('Something went wrong getting the spot list for your event'));
    }
  };
}

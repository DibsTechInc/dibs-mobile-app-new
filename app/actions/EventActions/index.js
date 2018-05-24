import moment from 'moment';
import { createActions } from 'redux-actions';
import { stringify } from 'qs';
import { Alert } from 'react-native';
import { getEventsOnCurrentDate } from '../../selectors/EventsSelectors';
import { getStudioName } from '../../selectors/StudioSelectors';

const getDateAsString = date => (
  typeof date.toISOString === 'function' ? date.toISOString() : date.toString()
);

export const {
  setEvents,
  addKeyToFetchingEvents,
  removeKeyFromFetchingEvents,
  setEventSoldOut,
  setEventsLoadingFalse,
  setScheduleCurrentDate,
  addDaysToScheduleCurrentDate,
} = createActions({
  SET_EVENTS: payload => payload,
  ADD_KEY_TO_FETCHING_EVENTS: getDateAsString,
  REMOVE_KEY_FROM_FETCHING_EVENTS: getDateAsString,
  SET_EVENT_SOLD_OUT: payload => payload,
  SET_EVENTS_LOADING_FALSE: () => false,
  SET_SCHEDULE_CURRENT_DATE: payload => payload,
  ADD_DAYS_TO_SCHEDULE_CURRENT_DATE: num => num,
});

/**
 * requestEventData from the server
 * @returns {function} dispatches actions for async request
 */
export function requestEventData({ eventids } = {}) {
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
      else Alert.alert('Uh oh!', res.message);
    } catch (err) {
      console.log(err);
      Alert.alert('Uh oh!', `Something went wrong getting classes for ${getStudioName(getState())}`);
    }
    dispatch(removeKeyFromFetchingEvents(currentDate));
  };
}

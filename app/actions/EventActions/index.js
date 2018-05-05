import moment from 'moment';
import { createActions } from 'redux-actions';
import { getEventsOnCurrentDate } from '../../selectors/EventsSelectors';

const getDateAsString = date => (
  typeof date.toISOString === 'function' ? date.toISOString() : date.toString()
);

export const {
  setEvents,
  addKeyToFetchingEvents,
  removeKeyFromFetchingEvents,
  setEventsLoadingFalse,
  previewEvents,
} = createActions({
  SET_EVENTS: payload => payload,
  ADD_KEY_TO_FETCHING_EVENTS: getDateAsString,
  REMOVE_KEY_FROM_FETCHING_EVENTS: getDateAsString,
  SET_EVENTS_LOADING_FALSE: () => false,
  PREVIEW_EVENTS: () => {},
});

/**
 * requestEventData from the server
 * @returns {function} dispatches actions for async request
 */
export function requestEventData() {
  return async function innerRequestEventData(dispatch, getState, dibsFetch) {
    let currentDate;
    try {
      const state = getState();
      const { studio, currentDate: tmp } = state;
      currentDate = tmp;
      if (getState().events.fetching[currentDate.toISOString()]) return;
      if (!getEventsOnCurrentDate(state).length) dispatch(addKeyToFetchingEvents(currentDate));
      const startDate = moment(currentDate).startOf('day').toISOString();
      const endDate = moment(currentDate).endOf('day').toISOString();
      const path = `/api/studio/events?studios[0]=${studio.data.id}&start=${startDate}&end=${endDate}`;
      const res = await dibsFetch(path, { method: 'GET' });
      if (res.success) dispatch(setEvents(res.events));
      else console.log(res);
    } catch (err) {
      console.log(err);
    }
    dispatch(removeKeyFromFetchingEvents(currentDate));
  };
}

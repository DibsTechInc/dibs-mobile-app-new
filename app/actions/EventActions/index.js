import moment from 'moment';
import { createActions } from 'redux-actions';
import { getEventsOnCurrentDate } from '../../selectors/EventsSelectors';

export const {
  setEvents,
  setEventsLoadingTrue,
  setEventsLoadingFalse,
} = createActions({
  SET_EVENTS: payload => payload,
  SET_EVENTS_LOADING_TRUE: () => true,
  SET_EVENTS_LOADING_FALSE: () => false,
});

/**
 * requestEventData from the server
 * @returns {function} dispatches actions for async request
 */
export function requestEventData() {
  return async function innerRequestEventData(dispatch, getState, dibsFetch) {
    try {
      if (getState().events.loading) return;
      const state = getState();
      const { studio, currentDate } = state;
      if (!getEventsOnCurrentDate(state).length) dispatch(setEventsLoadingTrue());
      const startDate = moment(currentDate).startOf('day').toISOString();
      const endDate = moment(currentDate).endOf('day').toISOString();
      const path = `/api/studio/events?studios[0]=${studio.data.id}&start=${startDate}&end=${endDate}`;
      const res = await dibsFetch(path, { method: 'GET' });
      if (res.success) dispatch(setEvents(res.events));
      else console.log(res);
    } catch (err) {
      console.log(err);
    }
    dispatch(setEventsLoadingFalse());
  };
}

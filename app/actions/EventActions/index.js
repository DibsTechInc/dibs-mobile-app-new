import { stringify } from 'qs';
import moment from 'moment';
import {
  SET_EVENTS,
  SET_EVENT_SOLD_OUT,
  SET_EVENTS_LOADING_TRUE,
  SET_EVENTS_LOADING_FALSE,
  SETTING_EVENT_VIA_ACTION,
} from '../../constants/EventConstants';
import { getEventsOnCurrentDate } from '../../selectors/EventsSelectors';
import { setCurrentDate } from '../CurrentDateActions';

/**
 * setEvents
 * @param {Array<Object>} value the event data
 * @returns {Object} action on the state
 */
export function setEvents(value) {
  return { type: SET_EVENTS, value };
}

/**
 * setEventsLoadingTrue
 * @returns {Object} action on the state
 */
export function setEventsLoadingTrue() {
  return { type: SET_EVENTS_LOADING_TRUE };
}

/**
 * setEventsLoadingFalse
 * @returns {Object} action on the state
 */
export function setEventsLoadingFalse() {
  return { type: SET_EVENTS_LOADING_FALSE };
}

/**
 * requestEventData from the server
 * @returns {function} dispatches actions for async request
 */
export function requestEventData({ eventids } = {}) {
  return function innerRequestEventData(dispatch, getState) {
    if (getState().events.loading) return;

    // const url = '/api/studio/events';
    const state = getState();
    const { studio, currentDate } = state;
    
    if (!getEventsOnCurrentDate(state).length) dispatch(setEventsLoadingTrue());

    // TODO: deal with if eventids exists 
    const startDate = moment(currentDate).startOf('day').tz(studio.mainTZ).format('YYYY-MM-DD HH:mm:ss');
    const endDate = moment(currentDate).endOf('day').tz(studio.mainTZ).format('YYYY-MM-DD HH:mm:ss');

    // TODO: insert in current start ate
    // TODO: insert studio id in
    // TODO: set up proxy
    const query = `http://10.51.110.1:3000/api/studio/events?studios[0]=1&start=${startDate}&end=${endDate}`;

    // let data = { studios: [studio.id] };

    // if (eventsids) data.eventids = eventids;
    // else {
    //   data.start = moment(currentDate).startOf('day').tz(studio.mainTZ).format('YYYY-MM-DD HH:mm:ss');
    //   data.end = moment(currentDate).endOf('day').tz(studio.mainTZ).format('YYYY-MM-DD HH:mm:ss');
    // }

    // data = stringify(data, { encode: false });

    fetch(query)
      .then(res => res.json())
      .then((res) => {
        dispatch(setEvents(res.events));
        dispatch(setEventsLoadingFalse());
      })
      .catch(error => {
        // set error here
        console.log(error);
      });
  }
}

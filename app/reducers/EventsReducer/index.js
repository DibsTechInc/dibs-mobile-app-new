import { handleActions } from 'redux-actions';
import moment from 'moment-timezone';
import { omit } from 'lodash';
import Config from '../../../config.json';
import {
  setEvents,
  addKeyToFetchingEvents,
  removeKeyFromFetchingEvents,
  setEventSoldOut,
  setScheduleCurrentDate,
  addDaysToScheduleCurrentDate,
} from '../../actions/EventActions';

const initialState = {
  fetching: {},
  data: [],
  currentDate: moment().tz(Config.STUDIO_TZ),
};

// TODO marking event as sold out and updating spot count

/**
 * @param {Object} state of events
 * @param {Object} action on the state
 * @returns {Object} new state
 */
function handleSetEvents(state, { payload }) {
  const events = state.data.concat(payload).reduce((acc, item) => {
    const index = acc.findIndex(event => event.id === item.id);
    if (index >= 0) {
      acc[index] = item;
      return acc;
    }
    acc.push(item);
    return acc;
  }, []).sort((a, b) => {
    const dateDiff = new Date(a.start_time) - new Date(b.start_time);
    if (dateDiff !== 0) return dateDiff;
    return a.id - b.id;
  });
  return { ...state, data: events };
}

/**
 * @param {Object} state of events
 * @param {Object} action on the state
 * @returns {Object} new state
 */
function handleSetEventSoldOut(state, action) {
  const events = state.data.map(event => ({
    ...event,
    sold_out: event.sold_out || (event.id === action.event.eventid),
  }));

  return { ...state, data: events };
}

export default handleActions({
  [setEvents]: handleSetEvents,
  [addKeyToFetchingEvents]: (state, { payload }) => ({
    ...state,
    fetching: { ...state.fetching, [payload]: true },
  }),
  [removeKeyFromFetchingEvents]: (state, { payload }) => ({ ...state, fetching: omit(state.fetching, payload) }),
  [setEventSoldOut]: handleSetEventSoldOut,
  [setScheduleCurrentDate]: (state, { payload }) => ({ ...state, currentDate: payload }),
  [addDaysToScheduleCurrentDate]: (state, { payload }) => ({ ...state, currentDate: moment(state.currentDate).add(payload, 'days') }),
}, initialState);

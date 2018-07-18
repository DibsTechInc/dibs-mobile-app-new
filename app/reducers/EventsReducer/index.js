import { handleActions } from 'redux-actions';
import moment from 'moment-timezone';
import { omit, cloneDeep } from 'lodash';
import Config from '../../../config.json';
import {
  setEvents,
  setSpots,
  addKeyToFetchingEvents,
  removeKeyFromFetchingEvents,
  setEventSoldOut,
  setScheduleCurrentDate,
  addDaysToScheduleCurrentDate,
  setCurrentSpotBookingEventId,
  setUserForSpot,
  setRoomForEvent,
} from '../../actions/EventActions';

const initialState = {
  fetching: {},
  data: [],
  currentSpotRoom: {},
  currentDate: moment().tz(Config.STUDIO_TZ),
  currentSpotBookingEventId: null,
};

// TODO marking event as sold out and updating spot count
// TODO crash happens when events resync while picking spot and cart becomes empty

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

/**
 * @param {Object} state of events
 * @param {Object} payload on the state
 * @returns {Object} new state
 */
function handleSetUserForSpot(state, { payload }) {
  const { x, y, userid, eventid } = payload;
  const newData = cloneDeep(state.data);
  const i = newData.findIndex(event => event.id === eventid);

  if (!newData[i].room) {
    return { ...state, data: newData };
  }

  newData[i].room.spotGrid[x][y].userid = userid;

  return { ...state, data: newData };
}

/**
 * @param {Object} state of events
 * @param {Object} payload on the state
 * @returns {Object} new state
 */
function handleSetRoomForEvent(state, { payload }) {
  const newState = { ...state };
  const { eventid, room } = payload;
  newState.data.map((event) => {
    event.room = eventid === event.id ? room : (event.room || null);
    return event;
  });
  return newState;
}

export default handleActions({
  [setEvents]: handleSetEvents,
  [setSpots]: (state, { payload }) => ({ ...state, currentSpotRoom: payload }),
  [addKeyToFetchingEvents]: (state, { payload }) => ({
    ...state,
    fetching: { ...state.fetching, [payload]: true },
  }),
  [removeKeyFromFetchingEvents]: (state, { payload }) => ({ ...state, fetching: omit(state.fetching, payload) }),
  [setEventSoldOut]: handleSetEventSoldOut,
  [setScheduleCurrentDate]: (state, { payload }) => ({ ...state, currentDate: payload }),
  [addDaysToScheduleCurrentDate]: (state, { payload }) => ({ ...state, currentDate: moment(state.currentDate).add(payload, 'days') }),
  [setCurrentSpotBookingEventId]: (state, { payload }) => ({ ...state, currentSpotBookingEventId: payload }),
  [setUserForSpot]: handleSetUserForSpot,
  [setRoomForEvent]: handleSetRoomForEvent,
}, initialState);

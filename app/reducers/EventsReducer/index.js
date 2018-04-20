import {
  SET_EVENTS,
  SET_EVENT_SOLD_OUT,
  SET_EVENTS_LOADING_TRUE,
  SET_EVENTS_LOADING_FALSE,
  SETTING_EVENT_VIA_ACTION,
} from '../../constants/EventConstants';

const initialState = {
  loading: false,
  settingViaAction: false,
  data: [],
};

/**
 * @param {Object} state of events
 * @param {Object} action on the state
 * @returns {Object} new state
 */
function handleSetEvents(state, action) {
  const events = state.data.concat(action.value).reduce((acc, item) => {
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
 * @param {Object} state of events in feed
 * @param {Object} action on the state
 * @returns {Object} new state
 */
export default function eventReducer(state = initialState, action) {
  switch (action.type) {
    case SET_EVENTS:
      return handleSetEvents(state, action);
    case SET_EVENT_SOLD_OUT:
      return handleSetEventSoldOut(state, action);
    case SETTING_EVENT_VIA_ACTION:
      return { ...state, settingViaAction: action.value };
    case SET_EVENTS_LOADING_TRUE:
      return { ...state, loading: true };
    case SET_EVENTS_LOADING_FALSE:
      return { ...state, loading: false };
    default:
      return state;
  }
}

import { handleActions, combineActions } from 'redux-actions';
import {
  setUpcomingEvents,
  removeUpcomingEvent,
  clearUpcomingEvents,
  setUpcomingEventsLoadingTrue,
  setUpcomingEventsLoadingFalse,
  setSyncingEventsTrue,
  setSyncingEventsFalse,
  setUpcomingEventsCurrentDate,
} from '../../actions/UpcomingEventsActions';

const initialState = {
  data: [],
  loading: false,
  syncing: false,
  currentDate: null,
};

export default handleActions({
  [combineActions(
    setUpcomingEvents,
    clearUpcomingEvents)]: (state, { payload }) => ({ ...state, data: payload }),
  [removeUpcomingEvent]: (state, { payload: eventid }) => ({ ...state, data: state.data.filter(e => e.eventid !== eventid) }),
  [combineActions(
    setUpcomingEventsLoadingTrue,
    setUpcomingEventsLoadingFalse)]: (state, { payload }) => ({ ...state, loading: payload }),
  [combineActions(
    setSyncingEventsTrue,
    setSyncingEventsFalse)]: (state, { payload }) => ({ ...state, syncing: payload }),
  [setUpcomingEventsCurrentDate]: (state, { payload }) => ({ ...state, currentDate: payload }),
}, initialState);

import { handleActions, combineActions } from 'redux-actions';
import moment from 'moment-timezone';

import Config from '../../../config.json';
import {
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
} from '../../actions/UpcomingEventsActions';

const initialState = {
  data: [],
  loading: false,
  syncing: false,
  droppping: false,
  currentDate: moment().tz(Config.STUDIO_TZ),
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
  [combineActions(
    setDroppingEventTrue,
    setDroppingEventFalse)]: (state, { payload }) => ({ ...state, dropping: payload }),
}, initialState);

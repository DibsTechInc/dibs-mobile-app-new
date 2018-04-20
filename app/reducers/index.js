import { combineReducers } from 'redux';

import events from './EventsReducer';
import currentDate from './CurrentDateReducer';
import studio from './StudioReducer';

export default combineReducers({
  events,
  currentDate,
  studio,
});

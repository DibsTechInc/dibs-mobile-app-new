import { combineReducers } from 'redux';

import events from './EventsReducer';
import currentDate from './CurrentDateReducer';
import studio from './StudioReducer';
import user from './UserReducer';

export default combineReducers({
  events,
  currentDate,
  studio,
  user,
});

import { combineReducers } from 'redux';

import events from './EventsReducer';
import currentDate from './CurrentDateReducer';
import studio from './StudioReducer';
import { nav, auth } from './NavigationReducer';

export default combineReducers({
  events,
  currentDate,
  studio,
  nav,
  auth,
});

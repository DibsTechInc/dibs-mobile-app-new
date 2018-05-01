import { combineReducers } from 'redux';

import events from './EventsReducer';
import currentDate from './CurrentDateReducer';
import studio from './StudioReducer';
import user from './UserReducer';
import cart from './CartReducer';
import upcomingEvents from './UpcomingEvents';

export default combineReducers({
  events,
  currentDate,
  studio,
  user,
  cart,
  upcomingEvents,
});

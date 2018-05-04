import { combineReducers } from 'redux';

import events from './EventsReducer';
import currentDate from './CurrentDateReducer';
import studio from './StudioReducer';
import user from './UserReducer';
import cart from './CartReducer';
import upcomingEvents from './UpcomingEventsReducer';
import creditCard from './CreditCardReducer';

export default combineReducers({
  events,
  currentDate,
  studio,
  user,
  cart,
  upcomingEvents,
  creditCard,
});

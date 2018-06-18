import { combineReducers } from 'redux';

import alerts from './AlertsReducer';
import events from './EventsReducer';
import studio from './StudioReducer';
import user from './UserReducer';
import cart from './CartReducer';
import upcomingEvents from './UpcomingEventsReducer';
import creditCard from './CreditCardReducer';
import promoCode from './PromoCodeReducer';
import confirmation from './ConfirmationReducer';
import animation from './AnimationReducer';
import filters from './FiltersReducer';

export default combineReducers({
  alerts,
  events,
  studio,
  user,
  cart,
  upcomingEvents,
  creditCard,
  promoCode,
  confirmation,
  animation,
  filters,
});

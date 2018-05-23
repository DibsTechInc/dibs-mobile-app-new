import { combineReducers } from 'redux';

import events from './EventsReducer';
import studio from './StudioReducer';
import user from './UserReducer';
import cart from './CartReducer';
import upcomingEvents from './UpcomingEventsReducer';
import creditCard from './CreditCardReducer';
import promoCode from './PromoCodeReducer';
import confirmation from './ConfirmationReducer';
import animation from './AnimationReducer';

export default combineReducers({
  events,
  studio,
  user,
  cart,
  upcomingEvents,
  creditCard,
  promoCode,
  confirmation,
  animation,
});

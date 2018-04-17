import { combineReducers } from 'redux';

import events from './Events';
import currentDate from './CurrentDate';

export default combineReducers({
  events,
  currentDate,
});

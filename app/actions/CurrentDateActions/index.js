import { createActions } from 'redux-actions';

export const { setCurrentDate, addDaysToCurrentDate } = createActions({
  SET_CURRENT_DATE: payload => payload,
  ADD_DAYS_TO_CURRENT_DATE: num => num,
});

import { createAction } from 'redux-actions';

export const setCurrentDate = createAction(
  'SET_CURRENT_DATE',
  payload => (payload.toISOString ? payload.toISOString() : payload)
);

import { createActions } from 'redux-actions';

export const {
  setPastEvents,
  setPastEventsLoadingTrue,
  setPastEventsLoadingFalse,
} = createActions({
  SET_PAST_EVENTS: payload => payload,
  SET_PAST_EVENTS_LOADING_TRUE: () => true,
  SET_PAST_EVENTS_LOADING_FALSE: () => false,
});

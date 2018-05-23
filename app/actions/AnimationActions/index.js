import { createActions } from 'redux-actions';

export const {
  setUpcomingEventSliderExpandedTrue,
  setUpcomingEventSliderExpandedFalse,
} = createActions({
  SET_UPCOMING_EVENT_SLIDER_EXPANDED_TRUE: () => true,
  SET_UPCOMING_EVENT_SLIDER_EXPANDED_FALSE: () => false,
});

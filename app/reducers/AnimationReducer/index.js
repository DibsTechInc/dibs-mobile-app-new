import { handleActions, combineActions } from 'redux-actions';

import {
  setUpcomingEventSliderExpandedTrue,
  setUpcomingEventSliderExpandedFalse,
} from '../../actions/AnimationActions';

export default handleActions(
  {
    [combineActions(
      setUpcomingEventSliderExpandedTrue,
      setUpcomingEventSliderExpandedFalse)]: (state, { payload }) => ({ ...state, upcomingEventSliderExpanded: payload }),
  },
  { upcomingEventSliderExpanded: false }
);

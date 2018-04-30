import moment from 'moment';
import { handleActions } from 'redux-actions';
import { setCurrentDate, addDaysToCurrentDate } from '../../actions/CurrentDateActions';

export default handleActions(
  {
    [setCurrentDate]: (state, { payload }) => payload,
    [addDaysToCurrentDate]: (state, { payload }) => moment(state.add(payload, 'days')),
  },
  moment().local().startOf('day')
);

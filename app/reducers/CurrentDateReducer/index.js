import moment from 'moment';
import { handleActions } from 'redux-actions';
import { setCurrentDate } from '../../actions/CurrentDateActions';

export default handleActions(
  {
    [setCurrentDate]: (state, { payload }) => payload,
  },
  moment().local().startOf('day').toISOString()
);

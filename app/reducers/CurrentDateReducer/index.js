import moment from 'moment';
import { handleActions } from 'redux-actions';
import { setCurrentDate, addDaysToCurrentDate } from '../../actions/CurrentDateActions';
import Config from '../../../config.json';

const initialState = moment().tz(Config.STUDIO_TZ);

export default handleActions(
  {
    [setCurrentDate]: (state, { payload }) => payload,
    [addDaysToCurrentDate]: (state, { payload }) => moment(state).add(payload, 'days'),
  },
  initialState
);

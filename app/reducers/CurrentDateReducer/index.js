import moment from 'moment';
import { SET_CURRENT_DATE } from '../../constants/CurrentDateConstants';


/** @namespace WidgetErrorReducer */
/**
 * errorReducer - Description
 * @memberof WidgetErrorReducer
 * @param {string} [state=_dibs_config.start] the current state, or an empty array
 * @param {object}  action     the action object of the changes
 *
 * @returns {array} the new state
 */
// reducer was state = _dibs_config.start || moment().local()
// figure out what _dibs_config.start is
export default function currentDateReducer(state = moment().local(), action) {
  switch (action.type) {
    case SET_CURRENT_DATE:
      return moment(moment(action.value).local(), 'YYYY-MM-DD');
    default:
      return state;
  }
}

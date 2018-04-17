import { SET_CURRENT_DATE } from '../../constants/CurrentDateConstants';

/**
 * setCurrentDate
 * @param {string} value new date
 * @returns {type} action on the state
 */
export function setCurrentDate(value) {
  return { type: SET_CURRENT_DATE, value }
}

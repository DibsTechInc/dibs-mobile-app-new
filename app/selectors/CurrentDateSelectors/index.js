import { createSelector } from 'reselect';
import moment from 'moment-timezone';
import Config from '../../../config.json';
import { getStudioInterval } from '../StudioSelectors';

function getTodayInStudioTimezone() {
  return moment().tz(Config.STUDIO_TZ);
}

/**
 * @param {Object} state in Redux store
 * @returns {Object} moment instance representing date on schedule
 */
export function getCurrentDate(state) {
  return state.currentDate;
}

export const getCurrentDateIsToday = createSelector(
  [
    getCurrentDate,
    getTodayInStudioTimezone,
  ],
  (currentDate, today) => currentDate.isSame(today, 'day')
);

export const getCurrentDateIsAfterInterval = createSelector(
  [
    getCurrentDate,
    getStudioInterval,
    getTodayInStudioTimezone,
  ],
  (currentDate, studioInterval, today) =>
    currentDate.isAfter(today.add(studioInterval, 'days').startOf('day'))
);

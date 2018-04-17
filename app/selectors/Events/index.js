import { createSelector } from 'reselect';
import moment from 'moment-timezone';
import { format as formatCurrency } from 'currency-formatter';
import Decimal from 'decimal.js';
import { groupBy, sortBy, map } from 'lodash';
import { createUnboundedSelector } from '../../helpers';

// in progress
/*
import {
  getStudioCurrency,
  getStudioName,
  getStudioCustomTimeFormat,
} from '../studio';

import {
  getUserPasses,
} from '../user/passes';

import {
  getFiltersClassid,
  getFiltersClassNames,
  getFilterLocationIdsAsArray,
  getFiltersInstructorId,
  getFiltersSearchQuery,
} from '../filters';

import { getUpcomingEventsData } from '../upcomingEvents';
import { getConfirmedTransactionsByEvent } from '../confirmation';
import { getStudioHasMultipleLocations } from '../studio/locations';
import findLocale from '../../../shared/helpers/locale-helper';
*/

/**
 * getEventsState
 * @param {Object} state in store
 * @returns {Object} events state
 */
export function getEventsState(state) {
  return state.events;
}

/**
 * getEventsLoading
 * @param {Object} state in store
 * @returns {Object} events state
 */
export function getEventsLoading(state) {
  return getEventsState(state).loading;
}

/**
 * getEventsData
 * @param {Object} state in store
 * @returns {Object} events state
 */
export function getEventsData(state) {
  // console.log(state.events, 'helloMoopMoop')
  return getEventsState(state).data;
}

/**
 * getNumberOfEvents
 * @returns {Number} events number of events
 */
export const getNumberOfEvents = createSelector(
  getEventsData,
  events => events.length
);

/**
 * getEventsOnCurrentDate
 * @returns {Array} events events on the current date
 */
export const getEventsOnCurrentDate = createUnboundedSelector(
  [
    getEventsData,
    state => state.currentDate,
  ],
  (events, currentDate) => events.filter((event) => {
    const start = moment(event.start_time).tz(event.mainTZ);
    return (
      start.isSame(currentDate, 'day')
      && start.isAfter(moment().local())
    );
  })
);

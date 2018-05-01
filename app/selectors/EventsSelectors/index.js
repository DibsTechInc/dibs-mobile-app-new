import { createSelector } from 'reselect';
import moment from 'moment-timezone';
import { format as formatCurrency } from 'currency-formatter';
import { createUnboundedSelector } from '../../helpers';

/**
 * getEventsState
 * @param {Object} state in store
 * @returns {Object} events state
 */
export function getEvents(state) {
  return state.events;
}

/**
 * getEventsLoading
 * @param {Object} state in store
 * @returns {Object} events state
 */
export function getEventsLoading(state) {
  return Boolean(getEvents(state).loading);
}

/**
 * getEventsData
 * @param {Object} state in store
 * @returns {Object} events state
 */
export function getEventsData(state) {
  return getEvents(state).data || [];
}

export const getNumberOfEvents = createSelector(
  getEventsData,
  events => events.length
);

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

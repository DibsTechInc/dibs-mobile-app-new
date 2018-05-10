import moment from 'moment-timezone';
import { createSelector } from 'reselect';
import { groupBy } from 'lodash';
import { getStudioShortDateFormat, getStudioCustomTimeFormat } from '../StudioSelectors';
// import { createUnboundedSelector } from '../../helpers';

/**
 * @param {Object} state in store
 * @returns {Object} upcoming event state
 */
export function getUpcomingEvents(state) {
  return state.upcomingEvents;
}

/**
 * @param {Object} state in store
 * @returns {boolean} if upcoming events are loading
 */
export function getUpcomingEventsLoading(state) {
  return getUpcomingEvents(state).loading || getUpcomingEvents(state).syncing;
}

/**
 * @param {Object} state in store
 * @returns {Array<Object>} the user's upcoming events
 */
export function getUpcomingEventsData(state) {
  return getUpcomingEvents(state).data || [];
}

/**
 * @param {OBject} state in store
 * @returns {boolean} if user has upcoming events booked
 */
export function getUserHasUpcomingEvents(state) {
  return Boolean(getUpcomingEventsData(state).length);
}

export const getUpcomingEventsByDay = createSelector(
  getUpcomingEventsData,
  events => groupBy(events, event => Number(moment.tz(event.start_time, event.mainTZ).startOf('day')))
);

export const getMostRecentUpcomingEvents = createSelector(
  getUpcomingEventsByDay,
  eventsByDay => eventsByDay[Math.min(...Object.keys(eventsByDay))]
);

export const getMostRecentUpcomingSliderEvents = createSelector(
  getMostRecentUpcomingEvents,
  getStudioShortDateFormat,
  getStudioCustomTimeFormat,
  (events, shortDateFormat, timeFormat) => events.map(({ location, instructor, ...event }) => {
    const localStartTime = moment.tz(event.start_time, event.mainTZ);
    const localEndTime = moment.tz(event.end_time, event.mainTZ);
    const formatTime = time => (
      time.get('minute') || timeFormat !== 'LT' ?
        time.format(timeFormat) : time.format('hA')
    );
    return {
      ...event,
      shortDayOfWeek: localStartTime.format('ddd'),
      shortEventDate: localStartTime.format(shortDateFormat),
      formattedStartTime: formatTime(localStartTime),
      formattedEndTime: formatTime(localEndTime),
      locationName: location.name,
      instructorName: instructor.name,
    };
  })
);


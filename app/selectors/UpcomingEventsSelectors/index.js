import moment from 'moment-timezone';
import { createSelector } from 'reselect';
import { groupBy } from 'lodash';

import Config from '../../../config.json';
import { WHITE } from '../../constants';
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
 * @returns {Object} current date in upcoming events page
 */
export function getUpcomingEventsCurrentDate(state) {
  return getUpcomingEvents(state).currentDate;
}

export const getUpcomingEventsNaturalCurrrentDate = createSelector(
  getUpcomingEventsCurrentDate,
  currentDate => currentDate.format('MMMM D')
);

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
  eventsByDay => (eventsByDay[Math.min(...Object.keys(eventsByDay))] || [])
);

export const getHasUpcomingClassesNextMonth = createSelector(
  getUpcomingEventsCurrentDate,
  getUpcomingEventsByDay,
  (currentDate, eventsByDay) => {
    const eventsNextMonth = Object.keys(eventsByDay).filter(
      day => moment(+day).startOf('month').isAfter(currentDate)
    );
    return Boolean(eventsNextMonth.length);
  }
);

export const getHasUpcomingClassesPrevMonth = createSelector(
  getUpcomingEventsCurrentDate,
  getUpcomingEventsByDay,
  (currentDate, eventsByDay) => {
    const eventsPrevMonth = Object.keys(eventsByDay).filter(
      day => moment(+day).startOf('month').isBefore(currentDate.clone().startOf('month'))
    );
    return Boolean(eventsPrevMonth.length);
  }
);

/**
 * @param {Array<Object>} events data for slider
 * @param {string} shortDateFormat short date format for studio
 * @param {string} timeFormat for studio
 * @returns {Array<Object>} events for slider
 */
function generateSliderEvents(events, shortDateFormat, timeFormat) {
  return events.map(({ location, instructor, ...event }) => {
    const localStartTime = moment.tz(event.start_time, event.mainTZ);
    // const localEndTime = moment.tz(event.end_time, event.mainTZ);
    const formatTime = time => (
      time.get('minute') || timeFormat !== 'LT' ?
        time.format(timeFormat) : time.format('hA')
    );
    return {
      ...event,
      shortDayOfWeek: localStartTime.format('ddd'),
      shortEventDate: localStartTime.format(shortDateFormat),
      formattedStartTime: formatTime(localStartTime),
      // formattedEndTime: formatTime(localEndTime),
      locationName: location.name,
      instructorName: instructor.name,
    };
  });
}

export const getMostRecentUpcomingSliderEvents = createSelector(
  getMostRecentUpcomingEvents,
  getStudioShortDateFormat,
  getStudioCustomTimeFormat,
  generateSliderEvents
);

export const getUpcomingEventsOnCurrentDate = createSelector(
  getUpcomingEventsData,
  getUpcomingEventsCurrentDate,
  (events, currentDate) => events.filter(event => moment.tz(event.start_time, event.mainTZ).isSame(currentDate, 'day'))
);

export const getUpcomingSliderEventsOnCurrentDate = createSelector(
  getUpcomingEventsOnCurrentDate,
  getStudioShortDateFormat,
  getStudioCustomTimeFormat,
  generateSliderEvents
);

export const getUpcomingEventCalendarMarkings = createSelector(
  getUpcomingEventsByDay,
  getUpcomingEventsCurrentDate,
  (eventsByDay, currentDate) => {
    const daysUserHasEvents = Object.keys(eventsByDay).map(day => moment(+day)).filter(day => day.isSame(currentDate, 'month'));
    const dayMarkings = {};
    for (
      let day = moment(currentDate).tz(Config.STUDIO_TZ).startOf('month');
      day.isBefore(moment(currentDate).endOf('month'));
      day.add(1, 'day')
    ) {
      dayMarkings[day.format('YYYY-MM-DD')] = {
        selected: moment(currentDate).isSame(day, 'day'),
        marked: daysUserHasEvents.some(eventDay => eventDay.isSame(day, 'day')),
        activeOpacity: 1,
        dotColor: WHITE,
      };
    }
    return dayMarkings;
  }
);


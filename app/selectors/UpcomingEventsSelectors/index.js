import moment from 'moment-timezone';
import { createSelector } from 'reselect';
import { groupBy } from 'lodash';
import { format as formatCurrency } from 'currency-formatter';
import Decimal from 'decimal.js';

import Config from '../../../config.json';
import { WHITE } from '../../constants';
import {
  getStudioShortDateFormat,
  getStudioCustomTimeFormat,
  getStudioCurrency,
  getStudioCancelTime,
} from '../StudioSelectors';

import { getStudioLocations } from '../StudioSelectors/Locations';
import { getScheduleCurrentDate } from '../EventsSelectors';

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
 * @returns {boolean} if user is dropping event
 */
export function getDroppingUpcomingEvent(state) {
  return Boolean(getUpcomingEvents(state).dropping);
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

export const getUpcomingEventsBySchedule = createSelector(
  [
    getUpcomingEventsData,
    getScheduleCurrentDate,
  ],
  (events, currDate) => events.filter((event) => {
    const m1 = moment(event.start_time);
    const m2 = moment(currDate);

    return m1.isSame(m2, 'day');
  })
);

export const getMostRecentUpcomingEvents = createSelector(
  getUpcomingEventsByDay,
  eventsByDay => (eventsByDay[Math.min(...Object.keys(eventsByDay))] || [])
);

export const getUpcomingEventsOnCurrentDate = createSelector(
  getUpcomingEventsData,
  getUpcomingEventsCurrentDate,
  (events, currentDate) => events.filter(event => moment.tz(event.start_time, event.mainTZ).isSame(currentDate, 'day'))
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

/**
 * @param {Array<Object>} items upcoming class transaction grouped by class
 * @param {string} currency code of studio
 * @param {string} timeFormat for clock times
 * @param {string} shortDateFormat for calendar dates
 * @param {Array<Object>} locations studio locs
 * @returns {Array<Object>} upcoming events for expanded slider
 */
function generateDetailedUpcomingEvents(items, currency, timeFormat, shortDateFormat, locations) {
  return items.map(({ location, instructor, ...item }) => {
    const chargeAmount = Decimal(item.amount).minus(item.studio_credits_spent).minus(item.global_credits_spent).minus(item.raf_credits_spent);
    const eventLocation = locations.length && locations.find(l => l.id === location.id);
    const { latitude, longitude } = eventLocation;
    const localStartTime = moment.tz(item.start_time, item.mainTZ);
    const formatTime = time => (
      time.get('minute') || timeFormat !== 'LT' ?
        time.format(timeFormat) : time.format('hA')
    );

    let formattedDescription = item.description;

    if (!formattedDescription || formattedDescription.length <= 1) {
      formattedDescription = 'No class description.';
    }

    return {
      ...item,
      shortDayOfWeek: localStartTime.format('ddd'),
      shortEventDate: localStartTime.format(shortDateFormat),
      formattedSubtotal: formatCurrency(item.original_price, { code: currency, precision: (item.original_price % 1 && 2) }),
      formattedTaxAmount: formatCurrency(item.tax_amount, { code: currency, precision: (item.tax_amount % 1 && 2) }),
      formattedDiscountAmount: formatCurrency(item.discount_amount, { code: currency, precision: (item.discount_amount % 1 && 2) }),
      formattedStudioCreditAmount: formatCurrency(item.studio_credits_spent, { code: currency, precision: (item.studio_credits_spent % 1 && 2) }),
      formattedRAFCreditAmount: formatCurrency(item.raf_credits_spent, { code: currency, precision: (item.studio_credits_spent % 1 && 2) }),
      formattedTotal: formatCurrency(chargeAmount, { code: currency, precision: (chargeAmount % 1 && 2) }),
      formattedValueBack: formatCurrency(item.valueBack, { code: currency, precision: (chargeAmount % 1 && 2) }),
      formattedStartTime: formatTime(localStartTime),
      longitude,
      latitude,
      locationName: location.name,
      instructorName: instructor.name,
      formattedDescription,
    };
  });
}

export const getDetailedMostRecentUpcomingEvents = createSelector(
  getMostRecentUpcomingEvents,
  getStudioCurrency,
  getStudioCustomTimeFormat,
  getStudioShortDateFormat,
  getStudioLocations,
  generateDetailedUpcomingEvents
);

export const getUpcomingEventFromRouteParam = createSelector(
  [
    getDetailedMostRecentUpcomingEvents,
    (_, eventid) => eventid,
  ],
  (events, eventid) => events.find(event => event.eventid === eventid)
);

export const getUpcomingEventDropIsEarlyCancel = createSelector(
  [
    getUpcomingEventFromRouteParam,
    getStudioCancelTime,
  ],
  (event, studioCancelTime) => {
    if (!event) return false;
    const eventStart = moment.tz(moment.utc(event.start_time), event.MainTZ);
    return eventStart > moment().clone().add(studioCancelTime, 'h');
  }
);

export const getUserUsedPass = createSelector(
  getUpcomingEventFromRouteParam,
  event => (event ? Boolean(event.passes.find(id => id !== null)) : false)
);

export const getDetailedUpcomingEventsOnCurrentDay = createSelector(
  getUpcomingEventsOnCurrentDate,
  getStudioCurrency,
  getStudioCustomTimeFormat,
  getStudioShortDateFormat,
  getStudioLocations,
  generateDetailedUpcomingEvents
);

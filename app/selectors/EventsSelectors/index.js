import { createSelector } from 'reselect';
import moment from 'moment-timezone';
import { format as formatCurrency } from 'currency-formatter';
import {
  getStudioCurrency,
  getStudioCustomTimeFormat,
  getStudioInterval,
} from '../StudioSelectors';
import { getCartData } from '../CartSelectors';
import { getUpcomingEventsData } from '../UpcomingEventsSelectors';
import Config from '../../../config.json';
import { createUnboundedSelector } from '../../helpers';

/**
 * getEventsState
 * @param {Object} state in store
 * @returns {Object} events state
 */
export function getEvents(state) {
  return state.events || {};
}

/**
 * getEventsState
 * @param {Object} state in store
 * @returns {Object} map to what events are being loaded
 */
export function getEventsFetching(state) {
  return getEvents(state).fetching || {};
}

/**
 * getEventsLoading
 * @param {Object} state in store
 * @returns {Object} events state
 */
export const getEventsAreLoading = createSelector(
  getEventsFetching,
  state => state.events.currentDate,
  (fetchingEvents, currentDate) => Boolean(fetchingEvents[currentDate.toISOString()])
);

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

/**
 * @returns {Object} right now in studio timezone
 */
function getTodayInStudioTimezone() {
  return moment().tz(Config.STUDIO_TZ);
}

/**
 * @param {Object} state in Redux store
 * @returns {Object} moment instance representing date on schedule
 */
export function getScheduleCurrentDate(state) {
  return getEvents(state).currentDate;
}

export const getScheduleCurrentDateIsToday = createSelector(
  [
    getScheduleCurrentDate,
    getTodayInStudioTimezone,
  ],
  (currentDate, today) => currentDate.isSame(today, 'day')
);

export const getScheduleCurrentDateIsAfterInterval = createSelector(
  [
    getScheduleCurrentDate,
    getStudioInterval,
    getTodayInStudioTimezone,
  ],
  (currentDate, studioInterval, today) =>
    currentDate.isAfter(today.add(studioInterval, 'days').startOf('day'))
);

export const getEventsOnCurrentDate = createSelector(
  [
    getEventsData,
    state => state.events.currentDate,
  ],
  (events, currentDate) => events.filter((event) => {
    const start = moment(event.start_time).tz(event.mainTZ);
    return start.isSame(currentDate, 'day');
  })
);

export const getNumberOfEventsOnCurrentDate = createSelector(
  getEventsOnCurrentDate,
  events => events.length
);

export const getEventsOnCurrentDateAfterNow = createSelector(
  getEventsOnCurrentDate,
  events => events.filter(event => moment(event.start_time).isAfter(moment()))
);

export const getScheduleEvents = createUnboundedSelector(
  [
    getEventsOnCurrentDateAfterNow,
    getStudioCurrency,
    getStudioCustomTimeFormat,
    getCartData,
    getUpcomingEventsData,
  ],
  (events, currency, timeFormat, cartItems, upcomingEvents) => events.map(({ instructor, location, ...event }) => {
    const formatLocalTime = time => moment(time).tz(event.mainTZ).format(timeFormat);
    const eventItemsInCart = cartItems.filter(cartEvent => cartEvent.eventid === event.id);
    const quantityInCart = eventItemsInCart.map(({ quantity }) => quantity)
                                           .reduce((acc, quantity) => acc + quantity, 0);
    const maxSeatsReached = Boolean(
      (quantityInCart + event.current_enrollment) === event.maximum_enrollment
      || quantityInCart === 4
    );
    const bookedEvent = upcomingEvents.find(userEvent => userEvent.eventid === event.id);
    return {
      ...event,
      eventid: event.id,
      startTimeInLocalTZ: formatLocalTime(event.start_time),
      endTimeInLocalTZ: formatLocalTime(event.end_time),
      formattedRoundedPrice: formatCurrency(event.price, { precision: 0, code: currency }),
      instructorName: instructor.name,
      locationName: location.name,
      soldOut: event.seats_remaining <= 0,
      seatsSold: event.current_enrollment,
      quantity: quantityInCart,
      maxSeatsReached,
      taxRate: location.tax_rate,
      seatsUserBooked: bookedEvent ? bookedEvent.quantity : 0,
      waitlisted: bookedEvent ? bookedEvent.isWaitlist : false,
    };
  })
);

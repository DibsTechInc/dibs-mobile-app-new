import { createSelector } from 'reselect';
import moment from 'moment-timezone';
import { format as formatCurrency } from 'currency-formatter';
import {
  getStudioCurrency,
  getStudioCustomTimeFormat,
} from '../StudioSelectors';
import { getCartData } from '../CartSelectors';
import { getUpcomingEventsData } from '../UpcomingEventsSelectors';
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

export const getEventsOnCurrentDate = createSelector(
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

export const getScheduleEvents = createUnboundedSelector(
  [
    getEventsOnCurrentDate,
    getStudioCurrency,
    getStudioCustomTimeFormat,
    getCartData,
    getUpcomingEventsData,
  ],
  (events, currency, timeFormat, cartItems, upcomingEvents) => events.map(({ instructor, location, ...event }) => {
    const localeTimeInTZ = moment(event.start_time).tz(event.mainTZ);
    const eventItemsInCart = cartItems.filter(cartEvent => cartEvent.eventid === event.id);
    const quantityInCart = eventItemsInCart.map(({ quantity }) => quantity)
                                           .reduce((acc, quantity) => acc + quantity, 0);
    const maxSeatsReached = Boolean(
      eventItemsInCart.length && (
        (quantityInCart + event.current_enrollment) === event.maximum_enrollment
        || quantityInCart === 4
      ));
    const bookedEvent = upcomingEvents.find(userEvent => userEvent.eventid === event.id);
    return {
      ...event,
      eventid: event.id,
      startTimeInLocalTZ: localeTimeInTZ.format(timeFormat || 'LT'),
      formattedRoundedPrice: formatCurrency(event.price, { precision: 0, code: currency }),
      timeDuration: moment.duration(moment(event.end_time).diff(moment(event.start_time))).asMinutes(),
      instructorName: instructor.name,
      locationName: location.name,
      soldOut: event.seats_remaining <= 0,
      seatsSold: event.current_enrollment,
      quantity: quantityInCart,
      maxSeatsReached,
      seatsUserBooked: bookedEvent ? bookedEvent.quantity : 0,
    };
  })
);

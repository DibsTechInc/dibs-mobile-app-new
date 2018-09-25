import { createSelector } from 'reselect';
import moment from 'moment-timezone';
import { format as formatCurrency } from 'currency-formatter';
import Decimal from 'decimal.js';

import Config from '../../../config.json';
import { createUnboundedSelector } from '../../helpers';
import {
  getStudioCurrency,
  getStudioCustomTimeFormat,
  getStudioInterval,
  getStudioFirstClassFixedPrice,
  getStudioMaximumCartQuantity,
} from '../StudioSelectors';
import { getUpcomingEventsData } from '../UpcomingEventsSelectors';
import {
  getUsersNextPassId,
  getUsersNextPassValue,
  getUserFixedPrice,
} from '../UserSelectors/Passes';
import { getFilterLocationIdsAsArray } from '../FiltersSelectors';
import {
  getUserId,
  getUserHasMadePurchaseAtStudio,
} from '../UserSelectors';
import { setSpotInCart } from '../../actions';
import { ROOM_ITEMS_ID } from '../../constants';

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
 * getEventsCurrentSpotBookingEventId
 * @param {Object} state in store
 * @returns {Object} map to what events are being loaded
 */
export function getEventsCurrentSpotBookingEventId(state) {
  return getEvents(state).currentSpotBookingEventId || null;
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
    getScheduleCurrentDate,
  ],
  (events, currentDate) => events.filter((event) => {
    const start = moment.tz(event.start_time, event.mainTZ);
    return start.isSame(currentDate.clone().tz(event.mainTZ), 'day');
  })
);

export const getNumberOfEventsOnCurrentDate = createSelector(
  getEventsOnCurrentDate,
  events => events.length
);

export const getEventsOnCurrentDateAfterNow = createSelector(
  getEventsOnCurrentDate,
  events => events.filter(event => moment.tz(event.start_time, event.mainTZ).isAfter(moment()))
);

export const getFilteredEvents = createSelector(
  [
    getEventsOnCurrentDateAfterNow,
    getFilterLocationIdsAsArray,
  ],
  (
    events,
    locationIds
  ) => events.filter((event) => {
    if (!event.location) return false;
    if (locationIds.length && !locationIds.includes(event.location.id)) return false;
    return true;
  })
);
export const getScheduleEvents = createUnboundedSelector(
  [
    getFilteredEvents,
    getStudioCurrency,
    getStudioCustomTimeFormat,
    state => ((state.cart && state.cart.events) || []),
    getUpcomingEventsData,
    getUsersNextPassId,
    getUsersNextPassValue,
    getUserFixedPrice,
    getUserHasMadePurchaseAtStudio,
    state => [
      ...((state.cart && state.cart.credits) || []),
      ...((state.cart && state.cart.events) || []),
      ...((state.cart && state.cart.packages) || []),
    ].length,
    getStudioFirstClassFixedPrice,
    getStudioMaximumCartQuantity,
  ],
  (
    events,
    currency,
    timeFormat,
    cartItems,
    upcomingEvents,
    getPassId,
    getPassValue,
    memberFixedPrice,
    hasMadePurchaseAtStudio,
    totalCartQuantity,
    firstClassFixedPrice,
    maxCartQuantity
  ) => events.map(({ instructor, location, ...event }) => {
    const formatLocalTime = time => moment(time).tz(event.mainTZ).format(timeFormat);
    const eventItemsInCart = cartItems.filter(cartEvent => cartEvent.eventid === event.id);
    const quantityInCart = eventItemsInCart.map(({ quantity }) => quantity)
                                           .reduce((acc, quantity) => acc + quantity, 0);
    const maxSeatsReached = Boolean(
      (quantityInCart + event.current_enrollment) === event.maximum_enrollment
      || quantityInCart === maxCartQuantity
    );
    const bookedEvent = upcomingEvents.find(userEvent => userEvent.eventid === event.id);
    const passid = getPassId(event.id);
    const passValue = getPassValue(event.id);
    const valueBack = passValue ? Math.max(0, Decimal(passValue || 0).minus(event.price).toDecimalPlaces(2).toNumber()) : 0;
    let price = event.price;
    if (
      !passid
      && memberFixedPrice
      && event.can_apply_pass) price = memberFixedPrice;
    if (
      !totalCartQuantity
      && !hasMadePurchaseAtStudio
      && firstClassFixedPrice) price = firstClassFixedPrice;
    price = Math.min(price, event.price);
    return {
      ...event,
      eventid: event.id,
      startTimeInLocalTZ: formatLocalTime(event.start_time),
      endTimeInLocalTZ: formatLocalTime(event.end_time),
      price,
      formattedRoundedPrice: formatCurrency(price, { precision: 0, code: currency }),
      instructorName: instructor.name,
      instructorImageURL: instructor.image_url,
      locationName: location.name,
      soldOut: event.seats_remaining <= 0,
      seatsSold: event.current_enrollment,
      quantity: quantityInCart,
      maxSeatsReached,
      taxRate: location.tax_rate,
      userHasBooked: Boolean(bookedEvent),
      waitlisted: bookedEvent ? bookedEvent.isWaitlist : false,
      passid,
      valueBack,
      formattedValueBack: formatCurrency(valueBack, { code: currency }),
    };
  })
);

export const getCurrentSpotBookingEvent = createSelector(
  [
    getScheduleEvents,
    getEventsCurrentSpotBookingEventId,
  ],
  (events, eventid) => events.filter(event => event.eventid === eventid)[0]
);

export const getCurrentSpotBookingEventFormattedTimes = createSelector(
  getCurrentSpotBookingEvent,
  (event) => {
    if (!event) return { startTimeDate: null, startTimeHourMinute: null };

    const timeDisplay = event.mainTZ === 'Europe/London' ? 'HH:mm' : 'h:mm A';
    const startTimeDate = moment(event.start_time).tz(event.mainTZ).format('ddd MM/DD');
    const startTimeHourMinute = moment(event.start_time).tz(event.mainTZ).format(timeDisplay);

    return {
      startTimeDate,
      startTimeHourMinute,
    };
  }
);

export const getRoomForEvent = createSelector(
  getEventsData,
  events => eventid => (events.find(event => eventid === event.id) || {}).room || {}
);

export const getSpotGridForEvent = createSelector(
  getRoomForEvent,
  getRoom => eventid => getRoom(eventid).spotGrid || []
);

export const getSpotGridForEventWithSelectedSpots = createSelector(
  [
    getSpotGridForEvent,
    getUserId,
  ],
  (getSpotGrid, userid) => eventid => getSpotGrid(eventid).map(spotRow =>
    spotRow.map(spot => (spot ? {
      ...spot,
      userSelected: spot.userid === userid,
    } : null)))
);

export const getSpotGridForEventWithSetter = createSelector(
  [
    getSpotGridForEventWithSelectedSpots,
    getUserId,
  ],
  (getGridWithSelections, userid) => (eventid) => {
    const spotGrid = getGridWithSelections(eventid).map(spotRow =>
      spotRow.map(spot => (spot ? {
        ...spot,
        addUserToSpot: setSpotInCart(eventid, spot.id, userid),
      } : null))
    );
    return spotGrid;
  }
);

export const getRoomItemsWithSetter = createSelector(
  [
    getSpotGridForEvent,
  ],
  getSpotGrid => eventid => getSpotGrid(eventid)
    .map(spotRow =>
      spotRow
        .filter(spot =>
          spot && ((spot.source_id || spot.spot_label) >= ROOM_ITEMS_ID)))
    .reduce((prev, curr) => prev.concat(curr), [])
);

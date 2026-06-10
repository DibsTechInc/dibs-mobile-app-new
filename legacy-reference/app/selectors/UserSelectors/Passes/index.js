import { createSelector } from 'reselect';
import moment from 'moment-timezone';
import Decimal from 'decimal.js';

import { getUser } from '../index';
import { getEventsData } from '../../EventsSelectors';
import { getUpcomingEventsData } from '../../UpcomingEventsSelectors';
import {
  getStudioSource,
  getStudioShortDateFormat,
  getDibsStudioId,
} from '../../StudioSelectors';
import Config from '../../../../config.json';

const getCartEvents = state => ((state.cart && state.cart.events) || []);

/**
 * @param {Object} state in store
 * @returns {Array<Object>} user passes
 */
export function getUserPasses(state) {
  return getUser(state).passes || [];
}

export const getUserStudioPasses = createSelector(
  [
    getUserPasses,
    getDibsStudioId,
  ],
  (passes, dibsStudioId) => passes.filter(p => p.dibs_studio_id === dibsStudioId).filter(p => p.isValid)
);

export const getAllUserStudioPasses = createSelector(
  [
    getUserPasses,
    getDibsStudioId,
  ],
  (passes, dibsStudioId) => passes.filter(p => p.dibs_studio_id === dibsStudioId)
);

export const getUserStudioPassesLeft = createSelector(
  [
    getUserStudioPasses,
    getCartEvents,
  ],
  (passes, cartEvents) => passes.filter((pass) => {
    const cartEventsWithPass = cartEvents.filter(event => event.passid === pass.id);
    const quantityInCart = cartEventsWithPass.reduce((acc, { quantity }) => acc + quantity, 0);
    return (
      (((quantityInCart + pass.usesCount) < pass.totalUses) || pass.studioPackage.unlimited)
      && (!pass.expiresAt || (moment() < moment(pass.expiresAt)))
    );
  })
);

export const getUserStudioPassesInCart = createSelector(
  [
    getUserStudioPasses,
    getCartEvents,
  ],
  (passes, cartEvents) => (
    passes.filter(
      pass => cartEvents.find(event => event.passid === pass.id)
    )
    .map((pass) => {
      const cartItemsWithThisPass = cartEvents.filter(event => event.passid === pass.id);
      const quantity = cartItemsWithThisPass.reduce((acc, { quantity: q }) => acc + q, 0);
      const eventPrices =
        cartItemsWithThisPass.reduce(
          (acc, { price }) => acc.plus(price), Decimal(0)).toNumber();
      return {
        ...pass,
        quantity,
        eventPrices,
        displayPassValue:
          (!pass.source_serviceid
            && !pass.studioPackage.unlimited),
      };
    })
  )
);

export const getUserHasPasses = createSelector(
  getUserStudioPassesLeft,
  passes => Boolean(passes.length)
);

export const getDetailedUserPasses = createSelector(
  getUserStudioPassesLeft,
  passes => passes.map(p => ({
    ...p,
    expiration: p.expiresAt,
    name: p.studioPackage.name,
    usesLeft: p.totalUses - p.usesCount,
    unlimited: p.studioPackage.unlimited,
    dailyUsageLimit: p.studioPackage.dailyUsageLimit,
    packageFixedPrice: p.studioPackage.member_class_fixed_price,
    seriesTypeId: p.studioPackage.zf_series_type_id,
    packageIsAutopay: p.studioPackage.autopay === 'FORCE',
  })).sort((a, b) => (moment(a.expiresAt) - moment(b.expiresAt)))
);

export const getUserHasUnlmitedMembershipWithDailyUsageLimit = createSelector(
  getDetailedUserPasses,
  passes => passes.some(pass => pass.unlimited && pass.dailyUsageLimit)
);

/*

PASS FOR APPLYING TO CART

*/

export const getUsersNextPass = createSelector(
  [
    getDetailedUserPasses,
    getCartEvents,
    getStudioSource,
    getEventsData,
    getUpcomingEventsData,
  ],
  (passes, cartItems, source, events, upcomingEvents) => eventid =>
    passes.reduce((passAcc, pass) => {
      if (passAcc) return passAcc;

      const currentEvent = events.find(e => e.id === eventid);
      if (!currentEvent.can_apply_pass || !currentEvent.price) return null;

      // This is for the case where an autorenew pass user with 10 uses has used all 10
      // and is trying to book this month not the next month
      if (moment(currentEvent.start_time) < moment(pass.expiresAt) && pass.autopay && pass.usesLeft === 0 && !pass.unlimited) return null;

      if (!pass) return null;
      if (source === 'zf' && pass.studioPackage.zf_series_type_id) {
        const seriesTypeId = pass.studioPackage.zf_series_type_id;
        if (currentEvent.zf_series_types && !currentEvent.zf_series_types[seriesTypeId]) return null;
      }
      if (!pass.studioPackage.unlimited) return pass;

      // Make sure non-autopay passes cant be used passed their expiry
      if (moment.tz(currentEvent.start_time, currentEvent.mainTZ) > moment(pass.expiresAt) && !pass.autopay) return null;

      const cartItem = cartItems.find(item => (item.eventid === eventid && item.passid === pass.id));
      if (cartItem) return null;

      const passInCart = cartItems.find(item => item.passid === pass.id);
      const cartDayUsage = pass.dailyUsageLimit && cartItems.reduce((eventAcc, item) =>
        (eventAcc === pass.dailyUsageLimit && passInCart ? eventAcc :
          eventAcc + Number(moment(currentEvent.start_time).dayOfYear() === moment(item.start_time).dayOfYear())),
        0);
      const upcomingDayUsage = pass.dailyUsageLimit && upcomingEvents.reduce((eventAcc, upcomingEvent) =>
        (eventAcc === pass.dailyUsageLimit ? eventAcc :
          eventAcc + Number(moment(currentEvent.start_time).dayOfYear() === moment(upcomingEvent.start_time).dayOfYear()
            && Boolean(upcomingEvent.passes.find(p => p.id === pass.id)))
        ),
        0);
      if (((cartDayUsage + upcomingDayUsage) === pass.dailyUsageLimit)) return null;
      return pass;
    }, null)
);

export const getUsersNextPassId = createSelector(
  getUsersNextPass,
  getPass => (eventid) => {
    const pass = getPass(eventid);
    return (pass ? pass.id : null);
  }
);

export const getUsersNextPassValue = createSelector(
  getUsersNextPass,
  getPass => (eventid) => {
    const pass = getPass(eventid);
    return ((pass && pass.passValue && !pass.studioPackage.unlimited) ? pass.passValue : 0);
  }
);

export const getUserFixedPrice = createSelector(
  getAllUserStudioPasses,
  (passes) => {
    const fixedPricePasses = passes.filter(p => p.studioPackage.member_class_fixed_price !== null);
    return (fixedPricePasses.length ? Math.min.apply(null, fixedPricePasses.map(p => p.studioPackage.member_class_fixed_price)) : null);
  }
);

/*

PASS FOR SIDEBAR

*/

export const getUsersFirstActivePass = createSelector(
  getDetailedUserPasses,
  passes => (passes[0] || {})
);

export const getUsersFirstActivePassId = createSelector(
  getUsersFirstActivePass,
  pass => (pass.id || null)
);

export const getUsersFirstPassName = createSelector(
  getUsersFirstActivePass,
  pass => (pass.name || '')
);

export const getUsersFirstPassIsUnlimited = createSelector(
  getUsersFirstActivePass,
  pass => pass.unlimited
);

export const getUsersFirstPassUsesLeft = createSelector(
  getUsersFirstActivePass,
  pass => pass.usesLeft
);

export const getUsersFirstPassShortExpiresAt = createSelector(
  getUsersFirstActivePass,
  getStudioShortDateFormat,
  (pass, shortDateFormat) => moment(pass.expiresAt).tz(Config.STUDIO_TZ).format(`${shortDateFormat}/YY`)
);

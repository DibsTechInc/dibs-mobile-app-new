import { createSelector } from 'reselect';
import moment from 'moment';
import Decimal from 'decimal.js';
import { getUser } from '../index';
import { getCartData } from '../../CartSelectors';
import { getEventsData } from '../../EventsSelectors';
import { getUpcomingEventsData } from '../../UpcomingEventsSelectors';
import Config from '../../../../config.json';

/**
 * @param {Object} state in store
 * @returns {Array<Object>} user passes
 */
export function getUserPasses(state) {
  return getUser(state).passes || [];
}

export const getUserStudioPasses = createSelector(
  getUserPasses,
  passes => passes.filter(p => p.dibs_studio_id === Config.DIBS_STUDIO_ID)
);

export const getUserStudioPassesLeft = createSelector(
  [
    getUserStudioPasses,
    getCartData,
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
    getCartData,
  ],
  (passes, cartEvents) => (
    passes.filter(
      pass => cartEvents.find(event => event.passid === pass.id)
    )
    .map((pass) => {
      const cartEventsWithThisPass = cartEvents.filter(event => event.passid === pass.id);
      const quantity = cartEventsWithThisPass.reduce((acc, { quantity: q }) => acc + q, 0);
      const eventPrices = +cartEventsWithThisPass.reduce((acc, { price }) => acc.plus(price), Decimal(0));
      return { ...pass, quantity, eventPrices };
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
  })).sort((a, b) => (moment(a.expiresAt) - moment(b.expiresAt)))
);

/*

PASS FOR APPLYING TO CART

*/

export const getUsersNextPass = createSelector(
  [
    getDetailedUserPasses,
    getCartData,
    getEventsData,
    getUpcomingEventsData,
  ],
  (passes, cartItems, events, upcomingEvents) => eventid =>
    passes.reduce((passAcc, pass) => {
      if (passAcc) return passAcc;

      const currentEvent = events.find(e => e.id === eventid);
      if (!currentEvent.can_apply_pass) return null;

      if (!pass || !pass.studioPackage.unlimited) return pass;

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

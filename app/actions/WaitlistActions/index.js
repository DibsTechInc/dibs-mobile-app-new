import Sentry from 'sentry-expo';
import {
  requestUserEvents,
  removeUpcomingEvent,
  setDroppingEventTrue,
  setDroppingEventFalse,
} from '../UpcomingEventsActions';
import { refreshUser } from '../UserActions';
import { requestEventData } from '../EventActions';
import { enqueueApiError } from '../AlertsActions';

/**
 * @param {number} eventid to add to waitlist
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function addToWaitlist(eventid) {
  return async function innerAddToWaitlist(dispatch, getState, dibsFetch) {
    try {
      const { name: eventName } = getState().events.data.find(ev => ev.id === eventid);
      const res = await dibsFetch('/api/user/waitlist', {
        method: 'POST',
        requiresAuth: true,
        body: { eventid, purchasePlace: 'mobile app' },
      });
      if (res.success) {
        dispatch(refreshUser(res.user));
        dispatch(requestUserEvents());
        return dispatch(enqueueApiError({ title: 'Success', message: `You were added to the waitlist for ${eventName}.` }));
      }
      if (res.refreshEvent) dispatch(requestEventData({ eventids: [eventid] }));
      Sentry.captureException(new Error(res.message), { logger: 'my.module' });
      return dispatch(enqueueApiError({ title: 'Error!', message: `${res.message}.` }));
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
      return dispatch(enqueueApiError({ title: 'Error!', message: 'Something went wrong adding you to the waitlist.' }));
    }
  };
}

/**
 * @param {number} eventid user is being removed from waitlist for
 * @returns {undefined}
 */
export function removeFromWaitlist(eventid) {
  return async function innerRemoveFromWaitlist(dispatch, getState, dibsFetch) {
    try {
      const { dropping } = getState().upcomingEvents;
      if (dropping) return;
      dispatch(setDroppingEventTrue());
      const res = await dibsFetch(`/api/user/waitlist/${eventid}`, {
        requiresAuth: true,
        method: 'DELETE',
      });
      if (res.success) {
        dispatch(removeUpcomingEvent(eventid));
        dispatch(setDroppingEventFalse());
        dispatch(enqueueApiError({ title: 'Success', message: 'You were removed from the waitlist.' }));
        return;
      }
      Sentry.captureException(new Error(res.message), { logger: 'my.module' });
      dispatch(enqueueApiError({ title: 'Error!', message: `${res.message}.` }));
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
      dispatch(enqueueApiError({ title: 'Error!', message: 'Something went wrong removing you from the waitlist.' }));
    }
    dispatch(setDroppingEventFalse());
  };
}

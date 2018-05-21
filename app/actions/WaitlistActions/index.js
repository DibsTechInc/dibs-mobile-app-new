import { requestUserEvents } from '../UpcomingEventsActions';
import { refreshUser } from '../UserActions';
import { requestEventData } from '../EventActions';

/**
 * @param {number} eventid to add to waitlist
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function addToWaitlist(eventid, callback) {
  return async function innerAddToWaitlist(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/waitlist', {
        method: 'POST',
        requiresAuth: true,
        body: { eventid },
      });
      if (res.success) {
        dispatch(refreshUser(res.user));
        dispatch(requestUserEvents());
      }
      if (res.refreshEvent) dispatch(requestEventData({ eventids: [eventid] }));
      return callback(null, { success: res.success, message: res.message });
    } catch (err) {
      console.log(err); // todo real error handling
    }
    return callback(null, { success: false });
  };
}

export function removeFromWaitlist() {} // TODO

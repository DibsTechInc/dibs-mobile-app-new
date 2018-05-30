import { Alert } from 'react-native';

import {
  requestUserEvents,
  removeUpcomingEvent,
  setDroppingEventTrue,
  setDroppingEventFalse,
} from '../UpcomingEventsActions';
import { refreshUser } from '../UserActions';
import { requestEventData } from '../EventActions';
import {  } from '../index';

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
        body: { eventid },
      });
      if (res.success) {
        dispatch(refreshUser(res.user));
        dispatch(requestUserEvents());
        return Alert.alert('Success', `You were added to the waitlist for ${eventName}.`);
      }
      if (res.refreshEvent) dispatch(requestEventData({ eventids: [eventid] }));
      return Alert.alert('Uh oh!', res.message);
    } catch (err) {
      console.log(err); // todo real error handling
      return Alert.alert('Uh oh!', err);
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
        Alert.alert('Success', 'You were removed from the waitlist.');
        return;
      }
      Alert.alert('Uh oh!', res.message);
    } catch (err) {
      console.log(err); // todo real error handling
      Alert.alert('Uh oh!', err);
    }
    dispatch(setDroppingEventFalse());
  };
}

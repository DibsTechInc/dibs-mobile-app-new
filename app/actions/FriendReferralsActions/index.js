import { createActions } from 'redux-actions';
import Sentry from 'sentry-expo';

export const {
  setFriendReferrals,
  setFriendReferralLoading,
  addFriendReferral,
  updateFriendReferral,
} = createActions({
  SET_FRIEND_REFERRALS: payload => payload,
  SET_FRIEND_REFERRAL_LOADING: payload => payload,
  ADD_FRIEND_REFERRAL: payload => payload,
  UPDATE_FRIEND_REFERRAL: payload => payload,
});

/**
 * Request user friend referrals from the server
 * @returns {function} redux thunk
 */
export function requestFriendReferrals() {
  return async function innerRequestFriendReferrals(dispatch, getState, dibsFetch) {
    try {
      const { studio } = getState();
      const id = studio.data.id;

      const res = await dibsFetch(`/api/user/refer-a-friend?dibsStudioId=${id}`, {
        method: 'GET',
        requiresAuth: true,
      });

      if (res.success) {
        dispatch(setFriendReferrals(res.referrals));
      } else {
        console.log(res.message);
        Sentry.captureException(new Error(res.message), { logger: 'my.module' });
      }
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
    }
  };
}

/**
 * Send out the friend referral
 * @param {string} email - the user's email who is getting the invitation
 * @returns {function} redux thunk
 */
export function sendFriendReferral(email) {
  return async function innerSendFriendReferral(dispatch, getState, dibsFetch) {
    try {
      const { studio } = getState();
      const id = studio.data.id;

      dispatch(setFriendReferralLoading(true));

      const res = await dibsFetch('/api/user/refer-a-friend', {
        method: 'POST',
        body: {
          email,
          dibsStudioId: id,
          firstName: email,
          raf_source: 'mobile-app',
        },
        requiresAuth: true,
      });

      if (res.success) {
        dispatch(addFriendReferral(res.referral));
        dispatch(requestFriendReferrals());
      } else {
        Sentry.captureException(new Error(res.message), { logger: 'my.module' });
      }

      console.log(res.message);
      dispatch(setFriendReferralLoading(false));

      return res;
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
    }
  };
}

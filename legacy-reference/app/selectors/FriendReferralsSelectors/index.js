import { createSelector } from 'reselect';
import { getDibsStudioId } from '../StudioSelectors';

/**
 * getFriendReferrals
 * @param {Object} state in Redux store
 * @returns {Array<Object>} array of friend referrals
 */
export function getFriendReferrals(state) {
  return state.friendReferrals;
}

/**
 * getFriendReferralsData
 * @param {Object} state in Redux store
 * @returns {Array<Object>} array of friend referrals
 */
export function getFriendReferralsData(state) {
  return getFriendReferrals(state).data || [];
}


/**
 * getFriendReferralsLoading
 * @param {Object} state in Redux store
 * @returns {Array<Object>} array of friend referrals
 */
export function getFriendReferralsLoading(state) {
  return getFriendReferrals(state).loading || false;
}

export const getStudioSpecificFriendReferrals = createSelector(
  [
    getFriendReferralsData,
    getDibsStudioId,
  ],
  (referrals, dibsStudioId) => referrals.filter(r => r.dibs_studio_id === dibsStudioId)
);

export const getAcceptedReferrals = createSelector(
  getStudioSpecificFriendReferrals,
  referrals => referrals.filter(fr => Boolean(fr.referredTransactionId))
);

export const getAcceptedReferralsLength = createSelector(
  getAcceptedReferrals,
  referrals => referrals.length
);

export const getOutstandingReferrals = createSelector(
  getStudioSpecificFriendReferrals,
  referrals => referrals.filter(fr => !fr.referredTransactionId).sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt))
);

export const getOutstandingReferralsLength = createSelector(
  getOutstandingReferrals,
  friendReferrals => friendReferrals.length
);

export const getFriendReferralsLength = createSelector(
  getAcceptedReferralsLength,
  getOutstandingReferralsLength,
  (acceptedReferralsLength, outstandingReferralsLength) => acceptedReferralsLength + outstandingReferralsLength
);

export const getFriendReferralAmountEarned = createSelector(
  getAcceptedReferrals,
  acceptedReferrals => acceptedReferrals.reduce((acc, referral) => acc + referral.creditsAwarded, 0)
);

export const getAllFriendReferrals = createSelector(
  [
    getAcceptedReferrals,
    getOutstandingReferrals,
  ],
  (acceptedReferrals, outstandingReferrals) => acceptedReferrals.concat(outstandingReferrals)
);


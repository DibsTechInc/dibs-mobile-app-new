import { handleActions } from 'redux-actions';
import { cloneDeep } from 'lodash';

import {
  setFriendReferrals,
  addFriendReferral,
  setFriendReferralLoading,
} from '../../actions';

const initialState = {
  data: [],
  loading: false,
};

/**
 * ADD_FRIEND_REFERRAL callback
 * @param {Object} state in store before action
 * @param {Object} action on the state
 * @returns {Object} new state
 */
function handleAddFriendReferral(state, { payload }) {
  const referrals = cloneDeep(state);
  referrals.data.push(payload);
  return referrals;
}

export default handleActions({
  [setFriendReferrals]: (state, { payload }) => ({ ...state, data: payload }),
  [setFriendReferralLoading]: (state, { payload }) => ({ ...state, loading: payload }),
  [addFriendReferral]: handleAddFriendReferral,
}, initialState);

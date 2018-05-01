import { createSelector } from 'reselect';
import { getUser } from '../index';
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

/*

TODO

getUserStudioPassesLeft
getUserStudioPassesInCart
getUserHasPasses
getDetailedUserPasses
getUsersNextPass
getUsersNextPassId
getUsersNextPassValue

*/

import { SET_USER } from '../../constants/UserConstants';

/**
 * studio
 * @param {object} [state={}] the studio
 * @param {object} action on the state
 * @returns {objecr} new state
 */
export default function user(state = {}, action) {
  switch (action.type) {
    case SET_USER:
      return action.payload;
    default:
      return state;
  }
}

import { SET_STUDIO } from '../../constants/StudioConstants';

/**
 * studio
 * @param {object} [state={}] the studio
 * @param {object} action on the state
 * @returns {objecr} new state
 */
export default function studio(state = {}, action) {
  switch (action.type) {
    case SET_STUDIO:
      return action.value;
    default:
      return state;
  }
}

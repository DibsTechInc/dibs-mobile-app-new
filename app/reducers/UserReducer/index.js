import {
  SET_USER,
  SET_USER_AUTH_STATUS_ROUTE,
} from '../../constants/UserConstants';

/**
 * studio
 * @param {object} [state={}] the studio
 * @param {object} action on the state
 * @returns {objecr} new state
 */

const initialState = {
  user: null,
  authStatusRoute: null,
}

export default function user(state = initialState, action) {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload };
    case SET_USER_AUTH_STATUS_ROUTE:
      return { ...state, authStatusRoute: action.payload };
    default:
      return state;
  }
}

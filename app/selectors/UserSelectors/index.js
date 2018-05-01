/**
 * @param {Object} state in store
 * @returns {Object} user data in store
 */
export function getUser(state) {
  return state.user || {};
}

/**
 * @param {Object} state in store
 * @returns {boolean} if user is logged in
 */
export function getUserIsLoggedIn(state) {
  return Boolean(getUser(state).id);
}

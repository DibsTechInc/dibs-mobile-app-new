/**
 * @param {Object} state in store
 * @returns {Object} user data in store
 */
export function getUser(state) {
  return state.user || {};
}

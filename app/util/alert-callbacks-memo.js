export const AlertCallbacks = {};

/**
 * @param {string} key to store callbacks in
 * @param {Array<function>} callbacks to store
 * @returns {undefined}
 */
export function addAlertCallbacks(key, callbacks) {
  AlertCallbacks[key] = callbacks;
}

/**
 * @param {string} key to delete callbacks from
 * @returns {undefined}
 */
export function removeAlertCallbacks(key) {
  delete AlertCallbacks[key];
}

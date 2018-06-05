import { createSelector } from 'reselect';
import store from '../../store';
import { dequeueAlert } from '../../actions';
import { AlertCallbacks, removeAlertCallbacks } from '../../util/alert-callbacks-memo';

/**
 * @param {Object} state in store
 * @returns {Object} alerts state
 */
export function getAlerts(state) {
  return state.alerts || {};
}

/**
 * @param {Object} state in store
 * @returns {Array<Object>} alerts queue
 */
export function getAlertsQueue(state) {
  return getAlerts(state).queue || [];
}

/**
 * @param {Object} state in store
 * @returns {string} input value in alert
 */
export function getAlertInputValue(state) {
  return getAlerts(state).inputValue || '';
}

export const getQueueHasMessages = createSelector(
  getAlertsQueue,
  queue => Boolean(queue.length)
);

export const getAlertsQueueHead = createSelector(
  getAlertsQueue,
  queue => (queue[0] || {})
);

export const getAlertTitle = createSelector(
  getAlertsQueueHead,
  obj => (obj.title || '')
);

export const getAlertMessage = createSelector(
  getAlertsQueueHead,
  obj => (obj.message || '')
);

export const getAlertButtons = createSelector(
  getAlertsQueueHead,
  (obj) => {
    if (obj.callbackKey) {
      return AlertCallbacks[obj.callbackKey].map(({ text, onPress }) => ({
        text,
        onPress() {
          removeAlertCallbacks(obj.callbackKey);
          store.dispatch(dequeueAlert());
          onPress();
        },
      }));
    }
    return [{ text: 'OK', onPress: () => store.dispatch(dequeueAlert()) }];
  }
);

export const getAlertHasInput = createSelector(
  getAlertsQueueHead,
  obj => Boolean(obj.showInput)
);

export const getAlertInputPlaceholder = createSelector(
  getAlertsQueueHead,
  obj => (obj.placeholder || '')
);

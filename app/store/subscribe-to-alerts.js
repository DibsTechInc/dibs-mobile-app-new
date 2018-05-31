import { Alert } from 'react-native';
import { dequeueAlert } from '../actions/AlertsActions';
import { AlertCallbacks, removeAlertCallbacks } from '../util/alert-callbacks-memo';

let memoizedQueueHead;

/**
 * Subscribe to new alerts in the alert queue
 * @param {Object} store Redux store
 * @returns {undefined}
 */
export default function subscribeToAlerts({ getState, dispatch }) {
  const { queue } = getState().alerts;
  if (queue[0] === memoizedQueueHead) return;
  memoizedQueueHead = queue[0];
  if (!memoizedQueueHead) return; // empty queue case

  const alertQueueHead = memoizedQueueHead; // prevent concurrent overwrite
  let buttons = [{ text: 'Ok', onPress: () => dispatch(dequeueAlert()) }];
  if (alertQueueHead.callbackKey) {
    buttons = AlertCallbacks[alertQueueHead.callbackKey].map(({ text, onPress }) => ({
      text,
      onPress() {
        dispatch(dequeueAlert());
        onPress();
      },
    }));
    removeAlertCallbacks(alertQueueHead.callbackKey);
  }
  Alert.alert(
    alertQueueHead.title,
    alertQueueHead.message || '',
    buttons,
    { cancelable: false }
  );
}

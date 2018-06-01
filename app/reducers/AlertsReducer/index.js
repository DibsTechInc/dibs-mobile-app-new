import { handleActions } from 'redux-actions';
import { omit } from 'lodash';

import { CONNECTION_ERROR, API_ERROR } from '../../constants';
import {
  logFatalError,
  enqueueApiError,
  enqueueConnectionError,
  enqueueUserError,
  enqueueNotice,
  dequeueAlert,
  setAlertInputValue,
} from '../../actions/AlertsActions';
import { addAlertCallbacks, removeAlertCallbacks } from '../../util/alert-callbacks-memo';

/**
 * @param {Object} state current alerts state
 * @param {Object} action created
 * @returns {Object} new alerts state
 */
function handleEnqueueNotice(state, { payload: actionPayload }) {
  let payload = actionPayload;
  if (payload.buttons) {
    const key = Date.now();
    addAlertCallbacks(key, payload.buttons);
    payload = { callbackKey: key, ...omit(payload, 'buttons') };
  }
  return ({ ...state, queue: [payload, ...state.queue] });
}

/**
 * @param {Object} state in store
 * @returns {Object} new state
 */
function handleDequeueAlert(state) {
  const currentHead = state.queue[0];
  if (!currentHead) return state;
  if (currentHead.callbackKey) removeAlertCallbacks(currentHead.callbackKey);
  return { ...state, queue: state.queue.slice(1), inputValue: '' };
}

export default handleActions(
  {
    [logFatalError]: (state, { payload }) => ({ ...state, fatalError: payload }),

    [enqueueApiError]: (state, { payload }) => (state.queue.some(alert => alert.type === CONNECTION_ERROR) ?
      state : ({ ...state, queue: [payload, ...state.queue] })),

    [enqueueConnectionError]: (state, { payload }) => (state.queue.some(alert => alert.type === CONNECTION_ERROR) ?
      state : ({
        ...state,
        queue: [payload, ...state.queue.filter(alert => alert.type !== API_ERROR)] })),

    [enqueueUserError]: (state, { payload }) => ({ ...state, queue: [payload, ...state.queue] }),

    [enqueueNotice]: handleEnqueueNotice,

    [setAlertInputValue]: (state, { payload }) => ({ ...state, inputValue: payload }),

    [dequeueAlert]: handleDequeueAlert,
  },
  {
    fatalError: null,
    queue: [],
    inputValue: '',
  }
);

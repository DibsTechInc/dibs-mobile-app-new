import { createActions } from 'redux-actions';

import { API_ERROR, CONNECTION_ERROR, NOTICE } from '../../constants';

/*

Alert queue elements have the structure

{
  title: string,
  message?: string,
  buttons?: [{ text: string, onPress: function }],
}

callbacks for button press are stored in
app/util/alert-callbacks-memo.js

*/

export const {
  logFatalError,
  enqueueApiError,
  enqueueConnectionError,
  enqueueUserError,
  enqueueNotice,
  dequeueAlert,
} = createActions({
  LOG_FATAL_ERROR: payload => payload,
  ENQUEUE_API_ERROR: payload => ({ type: API_ERROR, ...payload }),
  ENQUEUE_CONNECTION_ERROR: payload => ({ type: CONNECTION_ERROR, ...payload }),
  ENQUEUE_USER_ERROR: payload => payload,
  ENQUEUE_NOTICE: payload => ({ type: NOTICE, ...payload }),
  DEQUEUE_ALERT: () => null,
});

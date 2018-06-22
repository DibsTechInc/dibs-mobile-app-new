import { handleActions, combineActions } from 'redux-actions';
import { setTransactionsConfirmed, clearConfirmation } from '../../actions';

export default handleActions({
  [combineActions(setTransactionsConfirmed, clearConfirmation)]: (state, { payload }) => payload,
}, {});


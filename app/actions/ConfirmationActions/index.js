import { createActions } from 'redux-actions';

export const {
  setTransactionsConfirmed,
  clearConfirmation,
} = createActions({
  SET_TRANSACTIONS_CONFIRMED: payload => payload,
  CLEAR_CONFIRMATION: () => ({}),
});

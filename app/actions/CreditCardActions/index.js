import { createActions } from 'redux-actions';
import { enqueueApiError } from '../';
import Sentry from 'sentry-expo';

export const {
  setCreditCard,
  removeCreditCard,
  setCreditCardLoadingTrue,
  setCreditCardLoadingFalse,
} = createActions({
  SET_CREDIT_CARD: payload => payload,
  REMOVE_CREDIT_CARD: () => ({}),
  SET_CREDIT_CARD_LOADING_TRUE: () => true,
  SET_CREDIT_CARD_LOADING_FALSE: () => false,
});

/**
 * @param {boolean} [showAlert=true] if false will not show native alert on fail
 * @returns {function} thunk
 */
export function requestCreditCardInfo(showAlert = true) {
  return async function innerRequestCreditCardInfo(dispatch, getState, dibsFetch) {
    if (getState().creditCard.loading) return;
    dispatch(setCreditCardLoadingTrue());
    try {
      const res = await dibsFetch('/api/user/credit_card', {
        method: 'GET',
        requiresAuth: true,
      });
      dispatch(setCreditCardLoadingFalse());
      if (res.success) dispatch(setCreditCard(res.creditCard));
      else if (showAlert && !['The user does not have a card', 'User action required'].includes(res.message)) {
        dispatch(enqueueApiError({ title: 'Error!', message: `${res.message}.` }));
      } else if (!['The user does not have a card', 'User action required'].includes(res.message)) {
        throw new Error('Failed to get the user\'s billing info');
      }
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err));
      if (showAlert) dispatch(enqueueApiError({ title: 'Error!', message: 'Something went wrong getting your billing information.' }));
      else throw err;
    }
  };
}

/**
 * @param {Object} payload for credit card update
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function updateCreditCard({ ccNum, ccCVC, expiration }, callback = () => {}) {
  return async function innerUpdateCreditCard(dispatch, getState, dibsFetch) {
    if (getState().creditCard.loading) return;
    dispatch(setCreditCardLoadingTrue());
    try {
      const res = await dibsFetch('/api/user/credit_card', {
        method: 'PUT',
        requiresAuth: true,
        body: {
          ccNum,
          ccCVC,
          expMonth: expiration.month,
          expYear: expiration.year,
        },
      });
      if (res.success) dispatch(setCreditCard(res.card));
      else enqueueApiError({ title: 'Error!', message: `${res.message}.` });
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err));
      enqueueApiError({ title: 'Error!', message: 'Something went wrong updating your credit card.' });
    }
    dispatch(setCreditCardLoadingFalse());
    callback();
  };
}

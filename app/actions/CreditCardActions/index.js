import { createActions } from 'redux-actions';
import Sentry from 'sentry-expo';

import Config from '../../../config.json';
import { enqueueApiError } from '../';

const key = __DEV__ ? Config.STRIPE_TEST_KEY : Config.STRIPE_PUBLIC_KEY;
const stripe = require('stripe-client')(key);


const id = x => x; // identity fn

export const {
  setCreditCard,
  removeCreditCard,
  setCreditCardLoading,
  setUserHasNoCard,
} = createActions({
  SET_CREDIT_CARD: id,
  REMOVE_CREDIT_CARD: () => ({}),
  SET_CREDIT_CARD_LOADING: id,
  SET_USER_HAS_NO_CARD: id,
});

/**
 * @param {boolean} [showAlert=true] if false will not show native alert on fail
 * @returns {function} thunk
 */
export function requestCreditCardInfo(showAlert = true) {
  return async function innerRequestCreditCardInfo(dispatch, getState, dibsFetch) {
    if (getState().creditCard.loading) return;
    dispatch(setCreditCardLoading(true));
    try {
      const res = await dibsFetch('/api/user/credit-card', {
        method: 'GET',
        requiresAuth: true,
      });
      dispatch(setCreditCardLoading(false));
      switch (true) {
        case res.success:
          dispatch(setCreditCard(res.creditCard));
          break;

        case res.message === 'The user does not have a card':
          dispatch(setUserHasNoCard(true));
          break;

        case Boolean(
          showAlert
          && !['The user does not have a card', 'User action required'].includes(res.message)
        ):
          dispatch(enqueueApiError({ title: 'Error!', message: `${res.message}.` }));
          break;

        case !['The user does not have a card', 'User action required'].includes(res.message):
          throw new Error(res.message);

        default:
          break;
      }
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
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
export function updateCreditCard({ ccNum, ccCVC, expiration }) {
  return async function innerUpdateCreditCard(dispatch, getState, dibsFetch) {
    if (getState().creditCard.loading) return;
    dispatch(setCreditCardLoading(true));
    try {
      const token = await stripe.createToken({
        card: {
          number: ccNum,
          exp_month: expiration.month,
          exp_year: expiration.year,
          cvc: ccCVC,
        },
      });
      if (token.error) {
        dispatch(enqueueApiError({
          title: 'Error!',
          message: token.error.message,
        }));
      } else {
        const res = await dibsFetch('/api/user/credit-card', {
          method: 'PUT',
          requiresAuth: true,
          body: { token: token.id },
        });
        if (res.success) {
          const {
            last4,
            brand,
            exp_month: expMonth,
            exp_year: expYear,
          } = token.card;
          dispatch(setCreditCard({ last4, type: brand.toLowerCase(), expMonth, expYear }));
        } else {
          dispatch(enqueueApiError({
            title: 'Error!',
            message: res.message,
          }));
        }
      }
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
      dispatch(enqueueApiError({
        title: 'Error!',
        message: 'Something went wrong updating your credit card.',
      }));
    }
    dispatch(setCreditCardLoading(false));
  };
}

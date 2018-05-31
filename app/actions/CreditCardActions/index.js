import { createActions } from 'redux-actions';
import { Alert } from 'react-native';

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
    try {
      const res = await dibsFetch('/api/user/credit_card', {
        method: 'GET',
        requiresAuth: true,
      });
      if (res.success) dispatch(setCreditCard(res.creditCard));
      else if (showAlert && res.message !== 'The user does not have a card') Alert.alert('Uh oh!', res.message);
      else throw new Error('Failed to get the user\'s billing info');
    } catch (err) {
      console.log(err);
      if (showAlert) Alert.alert('Uh oh!', 'Something went wrong getting your billing information.');
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
    } catch (err) {
      console.log(err, 'caught error in catch');
    }
    dispatch(setCreditCardLoadingFalse());
    callback();
  };
}

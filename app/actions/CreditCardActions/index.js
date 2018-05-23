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
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function requestCreditCardInfo(callback = () => {}) {
  return async function innerRequestCreditCardInfo(dispatch, getState, dibsFetch) {
    if (getState().creditCard.loading) return;
    dispatch(setCreditCardLoadingTrue());
    try {
      const res = await dibsFetch('/api/user/credit_card', {
        method: 'GET',
        requiresAuth: true,
      });
      if (res.success) dispatch(setCreditCard(res.creditCard));
      else if (res.message !== 'The user does not have a card') console.log(res.message, 'requestCCInfoAction')
    } catch (err) {
      console.log(err);
      Alert.alert('Uh oh!', 'Something went wrong getting your billing information.');
    }
    dispatch(setCreditCardLoadingFalse());
    callback();
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
      else console.log(res.message, 'updateCCActions')
    } catch (err) {
      console.log(err, 'caught error in catch');
    }
    dispatch(setCreditCardLoadingFalse());
    callback();
  };
}

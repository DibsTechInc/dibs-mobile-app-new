import { createActions } from 'redux-actions';

export const { setCreditCard, removeCreditCard } = createActions({
  SET_CREDIT_CARD: payload => payload,
  REMOVE_CREDIT_CARD: () => {},
});

/**
 * @param {function} callback on complete
 * @returns {function} thunk
 */
export function requestCreditCardInfo(callback = () => {}) {
  return async function innerRequestCreditCardInfo(dispatch, getState, dibsFetch) {
    try {
      const res = await dibsFetch('/api/user/credit_card', {
        method: 'GET',
        requiresAuth: true,
      });
      if (res.success) dispatch(setCreditCard(res.creditCard));
      else console.log(res);
    } catch (err) {
      console.log(err);
    }
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
      else console.log(res);
    } catch (err) {
      console.log(err);
    }
    callback();
  };
}

import { handleActions } from 'redux-actions';
import {
  setCreditCard,
  removeCreditCard,
  setCreditCardLoading,
  setUserHasNoCard,
} from '../../actions/CreditCardActions';

const initialState = { loading: false, hasNoCard: false };

export default handleActions({
  [setCreditCard]: (state, { payload }) => ({ ...state, ...payload, hasNoCard: false }),
  [removeCreditCard]: () => initialState,
  [setCreditCardLoading]: (state, { payload }) => ({ ...state, loading: payload }),
  [setUserHasNoCard]: (state, { payload }) => ({ ...state, hasNoCard: payload }),
}, initialState);

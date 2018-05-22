import { handleActions, combineActions } from 'redux-actions';
import {
  setCreditCard,
  removeCreditCard,
  setCreditCardLoadingTrue,
  setCreditCardLoadingFalse,
} from '../../actions/CreditCardActions';

export default handleActions({
  [combineActions(
    setCreditCard,
    removeCreditCard)]: (state, { payload }) => ({ ...state, ...payload }),
  [combineActions(
    setCreditCardLoadingTrue,
    setCreditCardLoadingFalse)]: (state, { payload }) => ({ ...state, loading: payload }),
}, { loading: false });

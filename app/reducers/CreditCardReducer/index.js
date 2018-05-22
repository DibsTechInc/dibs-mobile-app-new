import { handleActions, combineActions } from 'redux-actions';
import {
  setCreditCard,
  removeCreditCard,
  setCreditCardLoadingTrue,
  setCreditCardLoadingFalse,
} from '../../actions/CreditCardActions';

export default handleActions({
  [setCreditCard]: (state, { payload }) => ({ ...state, ...payload }),
  [removeCreditCard]: state => ({ loading: state.loading }),
  [combineActions(
    setCreditCardLoadingTrue,
    setCreditCardLoadingFalse)]: (state, { payload }) => ({ ...state, loading: payload }),
}, { loading: false });

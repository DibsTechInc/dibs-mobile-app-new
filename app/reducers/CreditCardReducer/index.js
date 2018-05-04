import { handleActions, combineActions } from 'redux-actions';
import { setCreditCard, removeCreditCard } from '../../actions/CreditCardActions';

export default handleActions({
  [combineActions(setCreditCard, removeCreditCard)]: (state, { payload }) => payload,
}, {});

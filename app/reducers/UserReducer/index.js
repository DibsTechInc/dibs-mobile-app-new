import { handleActions } from 'redux-actions';
import {
  setUser,
  setUserResettingPassword,
} from '../../actions/UserActions';

export default handleActions({
  [setUser]: (state, { payload }) => ({ ...state, ...payload }),
  [setUserResettingPassword]: (state, { payload }) => ({ ...state, resettingPassword: payload }),
}, { resettingPassword: false, signedWaiver: false });

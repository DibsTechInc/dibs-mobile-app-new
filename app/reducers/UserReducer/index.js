import { handleActions } from 'redux-actions';
import { setUser } from '../../actions/UserActions';

export default handleActions({
  [setUser]: (state, { payload }) => ({ ...state, ...payload }),
}, {});

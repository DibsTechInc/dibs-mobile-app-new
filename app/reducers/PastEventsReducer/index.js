import { handleActions, combineActions } from 'redux-actions';
import { setPastEvents, setPastEventsLoadingTrue, setPastEventsLoadingFalse } from '../../actions';

const initialState = {
  data: [],
  loading: false,
};

export default handleActions({
  [setPastEvents]: (state, { payload }) => ({ ...state, data: payload }),
  [combineActions(
    setPastEventsLoadingTrue,
    setPastEventsLoadingFalse)]: (state, { payload }) => ({ ...state, loading: payload }),
}, initialState);

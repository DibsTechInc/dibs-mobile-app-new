import { handleActions, combineActions } from 'redux-actions';
import { setStudio, setStudioLoadingTrue, setStudioLoadingFalse } from '../../actions/StudioActions';

const initialState = {
  data: null,
  loading: false,
};

export default handleActions({
  [setStudio]: (state, { payload }) => ({ ...state, data: payload }),
  [combineActions(setStudioLoadingTrue, setStudioLoadingFalse)]: (state, { payload }) => ({ ...state, loading: payload }),
}, initialState);

import { handleActions } from 'redux-actions';

const initialState = {
  purchasing: false,
  confirming: false,
  confirmId: null,
};

export default handleActions({}, initialState);

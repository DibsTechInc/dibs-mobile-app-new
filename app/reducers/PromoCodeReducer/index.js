import { handleActions, combineActions } from 'redux-actions';
import {
  setPromoCode,
  setPackagePromoCode,
  clearPromoCodeData,
  clearPackagePromoCode,
  setPromoCodeError,
  clearPromoCodeError,
  setPromoCodeNotice,
  clearPromoCodeNotice,
  setPromoCodeSubmittingTrue,
  setPromoCodeSubmittingFalse,
} from '../../actions/PromoCodeActions';

const initialState = {
  data: {},
  errorMessage: '',
  noticeMessage: '',
  submitting: false,
};

export default handleActions({
  [combineActions(
    setPromoCode,
    clearPromoCodeData,
    setPackagePromoCode,
    clearPackagePromoCode)]: (state, { payload }) => ({ ...state, data: payload }),
  [combineActions(
    setPromoCodeError,
    clearPromoCodeError)]: (state, { payload }) => ({ ...state, errorMessage: payload }),
  [combineActions(
    setPromoCodeNotice,
    clearPromoCodeNotice)]: (state, { payload }) => ({ ...state, noticeMessage: payload }),
  [combineActions(
    setPromoCodeSubmittingTrue,
    setPromoCodeSubmittingFalse)]: (state, { payload }) => ({ ...state, submitting: payload }),
}, initialState);

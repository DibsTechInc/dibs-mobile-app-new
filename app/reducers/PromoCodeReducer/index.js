import { handleActions, combineActions } from 'redux-actions';
import {
  setPromoCode,
  setPackagePromoCode,
  clearPromoCodeData,
  clearPackagePromoCodeData,
  setPromoCodeError,
  clearPromoCodeError,
  setPromoCodeNotice,
  clearPromoCodeNotice,
} from '../../actions/PromoCodeActions';

const initialState = {
  data: {},
  errorMessage: '',
  noticeMessage: '',
};

export default handleActions({
  [combineActions(
    setPromoCode,
    clearPromoCodeData,
    setPackagePromoCode,
    clearPackagePromoCodeData)]: (state, { payload }) => ({ ...state, data: payload }),
  [combineActions(
    setPromoCodeError,
    clearPromoCodeError)]: (state, { payload }) => ({ ...state, errorMessage: payload }),
  [combineActions(
    setPromoCodeNotice,
    clearPromoCodeNotice)]: (state, { payload }) => ({ ...state, noticeMessage: payload }),
}, initialState);

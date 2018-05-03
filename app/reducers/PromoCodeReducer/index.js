import { handleActions, combineActions } from 'redux-actions';
import {
  setPromoCode,
  setPackagePromoCode,
  clearPromoCodeData,
  clearPackagePromoCodeData,
} from '../../actions/PromoCodeActions';

const initialState = {};

/**
 * promoCodeReducer
 *
 * @param {Object} [state=initialState] promo code state
 * @param {Object} action on the state
 *
 * @returns {Object} new state
 */
// export default function promoCodeReducer(state = initialState, action) {
//   switch (action.type) {
//     case SET_PROMO_CODE:
//       return action.value;
//     case CLEAR_PROMO_CODE:
//       return {};
//     case SET_PACKAGE_PROMOCODE:
//       return action.value;
//     case CLEAR_PACKAGE_PROMO_CODE:
//       return {};
//     default:
//       return state;
//   }
// }

export default handleActions({
  [combineActions(clearPromoCodeData, clearPackagePromoCodeData)]: state => ({ state }),
  [combineActions(setPromoCode, setPackagePromoCode)]: (state, { payload }) => ({ ...state, payload }),
}, initialState);

// export default handleActions({
//   [combineActions(setEventsLoadingTrue, setEventsLoadingFalse)]: (state, { payload }) => ({ ...state, loading: payload }),
//   [setEvents]: handleSetEvents,
// }, initialState);

import { stringify } from 'qs';
import { format as formatCurrency } from 'currency-formatter';
import { createActions } from 'redux-actions';

import {
  applyFreeClassPromoToCart,
  addToCart,
  removeOneEventItem,
  setCartVisibleTrue,
  setCartVisibleFalse,
} from '../CartActions';
import { getStudioCurrency } from '../../selectors/StudioSelectors';
import { getSortedCartEvents, getCartEventIds, getCartEventNames } from '../../selectors/EventsSelectors';
import { getUsersNextPassId } from '../../selectors/UserSelectors/Passes';

export const {
  setPromoCode,
  setPackagePromoCode,
  clearPromoCodeData,
  clearPackagePromoCodeData,
} = createActions({
  SET_PROMO_CODE: payload => payload,
  SET_PACKAGE_PROMOCODE: payload => payload,
  CLEAR_PROMO_CODE: () => {},
  CLEAR_PACKAGE_PROMO_CODE: () => {},
});

// /**
//  * setPromoCode
//  * @param {Object} value the promo code
//  * @returns {Object} action on the state
//  */
// export function setPromoCode(value) {
//   return { type: SET_PROMO_CODE, value };
// }

// /**
//  * setPackagePromoCode
//  * @param {Object} value the promo code
//  * @returns {Object} action on the state
//  */
// export function setPackagePromoCode(value) {
//   return { type: SET_PACKAGE_PROMOCODE, value };
// }

// /**
//  * clearPromoCode
//  * @returns {Object} action on the state
//  */
// export function clearPromoCodeData() {
//   return { type: CLEAR_PROMO_CODE };
// }

// /**
//  * clearPackagePromoCodeData
//  * @returns {Object} action on the state
//  */
// export function clearPackagePromoCodeData() {
//   return { type: CLEAR_PACKAGE_PROMO_CODE };
// }

/**
 * If the promo code is a free class, the class
 * the code applied to has to be re-added to the
 * cart so that passes can be applied
 *
 * @returns {function} redux thunk
 */
export function clearPromoCode() {
  return function innerClearPromoCode(dispatch, getState) {
    const { promoCode } = getState();
    if (promoCode.type === PROMO_TYPE_FREE_CLASS) {
      const cartItem = getSortedCartEvents(getState())[0];
      dispatch(setCartVisibleTrue());
      dispatch(removeOneEventItem(cartItem.eventid));
      const passid = getUsersNextPassId(getState())(cartItem.eventid);
      dispatch(addToCart({ ...cartItem, passid }));
      dispatch(setCartVisibleFalse());
    }

    if (promoCode.product === PROMO_PRODUCT_PACKAGE) {
      dispatch(clearPackagePromoCodeData());
    } else {
      dispatch(clearPromoCodeData());
    }
  };
}
/**
 * reverifyPromoCode
 * Check to ensure if it's a class specific promo code, the class is still in the cart.
 * @returns {function} redux thunk re-verifies code
 */
export function reverifyPromoCode() {
  return function innerReverifyPromoCode(dispatch, getState) {
    const { promoCode } = getState();
    const eventNames = getCartEventNames(getState());
    if (promoCode.class_name_pattern && !eventNames.some(name => RegExp(promoCode.class_name_pattern, 'i').test(name))) {
      dispatch(clearPromoCode());
    }
  };
}

/**
 * verifyPromoCode
 * @param {string} promoCodeAttempt the attempted promo code
 * @param {string} product the type of promo code
 * @returns {function} redux thunk validates the code
 */
// export function verifyPromoCode(promoCodeAttempt, product = PROMO_PRODUCT_CLASS) {
//   return function innerVerifyPromoCode(dispatch, getState) {
//     const { source, studioid } = getState().studio;
//     const eventids = getCartEventIds(getState());

//     const query = stringify({
//       promo_code: promoCodeAttempt,
//       source,
//       studioid,
//       eventids,
//     });

//     $.ajax({
//       method: 'GET',
//       url: `/api/user/promo/${product}/verify?${query}`,
//       success(data) {
//         if (data.success && ![PROMO_TYPE_ADD_CREDITS, PROMO_TYPE_GIFT_CARD].includes(data.promoCode.type)) {
//           if (product === PROMO_PRODUCT_PACKAGE) {
//             dispatch(setPackagePromoCode({ ...data.promoCode, source, studioid }));
//           } else {
//             if (data.promoCode.type === PROMO_TYPE_FREE_CLASS) dispatch(applyFreeClassPromoToCart());
//             dispatch(setPromoCode({ ...data.promoCode, source, studioid }));
//           }
//         } else if (data.success) {
//           const currency = getStudioCurrency(getState());
//           const { amount } = data.promoCode;
//           const text = `You just received ${formatCurrency(amount, { code: currency, precision: (amount % 1 && 2) })} in credits at this studio`;
//           dispatch(addNotice({ type: NOTICE_TYPE_NOTICE, text }));
//           dispatch(refreshUser(data.user));
//         } else {
//           dispatch(addError(data.message));
//         }
//       },
//       error(err) {
//         console.log(err);
//         dispatch(addError('Failed to verify the promo code'));
//       },
//     });
//   };
// }

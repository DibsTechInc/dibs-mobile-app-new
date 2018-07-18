import { stringify } from 'qs';
import Sentry from 'sentry-expo';
import { format as formatCurrency } from 'currency-formatter';
import { createActions } from 'redux-actions';

import {
  PROMO_TYPE_FREE_CLASS,
  PROMO_PRODUCT_PACKAGE,
  PROMO_PRODUCT_CLASS,
  PROMO_TYPE_ADD_CREDITS,
  PROMO_TYPE_GIFT_CARD,
} from '../../constants';
import {
  applyFreeClassPromoToCart,
  addEventToCart,
  removeOneEventItem,
  setCartVisibleTrue,
  setCartVisibleFalse,
} from '../CartActions';
import { getStudioCurrency } from '../../selectors/StudioSelectors';
import { getSortedCartEvents, getCartEventIds, getCartEventNames } from '../../selectors';
import { getUsersNextPassId } from '../../selectors/UserSelectors/Passes';

export const {
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
} = createActions({
  SET_PROMO_CODE: payload => payload,
  SET_PACKAGE_PROMO_CODE: payload => payload,
  CLEAR_PROMO_CODE_DATA: () => ({}),
  CLEAR_PACKAGE_PROMO_CODE: () => ({}),
  SET_PROMO_CODE_ERROR: errorMsg => errorMsg,
  CLEAR_PROMO_CODE_ERROR: () => '',
  SET_PROMO_CODE_NOTICE: msg => msg,
  CLEAR_PROMO_CODE_NOTICE: () => '',
  SET_PROMO_CODE_SUBMITTING_TRUE: () => true,
  SET_PROMO_CODE_SUBMITTING_FALSE: () => false,
});

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
      dispatch(addEventToCart({ ...cartItem, passid }));
      dispatch(setCartVisibleFalse());
    }

    if (promoCode.product === PROMO_PRODUCT_PACKAGE) {
      dispatch(clearPackagePromoCode());
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
 * @param {string} promoCodeAttempt the attempted promo code
 * @param {string} product the type of promo code
 * @returns {function} redux thunk validates the code
 */
export function verifyPromoCode(promoCodeAttempt, product = PROMO_PRODUCT_CLASS) {
  return async function innerVerifyPromoCode(dispatch, getState, dibsFetch) {
    try {
      if (getState().promoCode.submitting) return;
      dispatch(setPromoCodeSubmittingTrue());
      const state = getState();
      const { source, studioid } = state.studio.data;
      const eventids = getCartEventIds(state);
      const query = stringify({
        promo_code: promoCodeAttempt,
        source,
        studioid,
        eventids,
      });
      const res = await dibsFetch(`/api/user/promo/${product}/verify?${query}`, {
        method: 'GET',
        requiresAuth: true,
      });
      if (res.success && ![PROMO_TYPE_ADD_CREDITS, PROMO_TYPE_GIFT_CARD].includes(res.promoCode.type)) {
        if (product === PROMO_PRODUCT_PACKAGE) {
          dispatch(setPackagePromoCode({ ...res.promoCode, source, studioid }));
        } else {
          if (res.promoCode.type === PROMO_TYPE_FREE_CLASS) dispatch(applyFreeClassPromoToCart());
          dispatch(setPromoCode({ ...res.promoCode, source, studioid }));
          dispatch(setPromoCodeNotice(`Successfully applied ${promoCodeAttempt} to your cart.`));
        }
      } else if (res.success) {
        const currency = getStudioCurrency(getState());
        const { amount } = res.promoCode;
        const text = `You just received ${formatCurrency(amount, { code: currency, precision: (amount % 1 && 2) })} in credits at this studio`;
        dispatch(setPromoCodeNotice(text));
      } else {
        console.log(res);
        Sentry.captureException(new Error(res.message), { logger: 'my.module' });
        dispatch(setPromoCodeError(`${res.message}.`));
      }
    } catch (err) {
      console.log(err);
      Sentry.captureException(new Error(err.message), { logger: 'my.module' });
      dispatch(setPromoCodeError('Something went wrong applying that promo code to your cart.'));
    }
    dispatch(setPromoCodeSubmittingFalse());
  };
}

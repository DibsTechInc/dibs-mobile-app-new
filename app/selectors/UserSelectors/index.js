import { createSelector } from 'reselect';
import { format as formatCurrency } from 'currency-formatter';
import Decimal from 'decimal.js';
import { getDibsStudioId, getStudioCurrency } from '../StudioSelectors';

/**
 * @param {Object} state in store
 * @returns {Object} user data in store
 */
export function getUser(state) {
  return state.user || {};
}

/**
 * @param {Object} state in store
 * @returns {number} user's id
 */
export function getUserId(state) {
  return getUser(state).id;
}

/**
 * @param {Object} state in store
 * @returns {Object} user filters
 */
export function getUserDefaultFilters(state) {
  return getUser(state).defaultFilters;
}

/**
 * @param {Object} state in store
 * @returns {string} user email
 */
export function getUserEmail(state) {
  return getUser(state).email || '';
}

/**
 * @param {Object} state in store
 * @returns {Object} user suppression list preferences
 */
export function getUserSuppressionList(state) {
  return getUser(state).suppression_lists;
}

/**
 * @param {Object} state in store
 * @returns {string} user first name
 */
export function getUserFirstName(state) {
  return getUser(state).firstName || '';
}

/**
 * @param {Object} state in store
 * @returns {string} user last name
 */
export function getUserLastName(state) {
  return getUser(state).lastName || '';
}

/**
 * @param {Object} state in store
 * @returns {Array<Object>} user credits
 */
export function getUserCredits(state) {
  return getUser(state).credits || [];
}

/**
 * @param {Object} state in store
 * @returns {boolean} true if user has made purchase at studio
 */
export function getUserHasMadePurchaseAtStudio(state) {
  return Boolean(getUser(state).hasMadePurchaseAtStudio);
}

/**
 * @param {Object} state in store
 * @returns {boolean} true if user is resetting their password
 */
export function getUserIsResettingPassword(state) {
  return Boolean(getUser(state).resettingPassword);
}

export const getUsersFullName = createSelector(
  [
    getUserFirstName,
    getUserLastName,
  ],
  (firstName, lastName) => `${firstName} ${lastName}`
);

export const getUserStudioCredits = createSelector(
  [
    getUserCredits,
    getDibsStudioId,
  ],
  (credits, id) => credits.find(c => c.dibs_studio_id === id)
);

export const getUserStudioCreditsAmount = createSelector(
  getUserStudioCredits,
  credit => ((credit && credit.credit) ? credit.credit : 0)
);

export const getUserStudioCreditLoadBonusAmount = createSelector(
  getUserStudioCredits,
  credit => ((credit && credit.load_bonus) ? credit.load_bonus : 0)
);

export const getUserHasStudioCredits = createSelector(
  getUserStudioCreditsAmount,
  credit => credit > 0
);

export const getUserStudioCreditsDisplayedAmount = createSelector(
  [
    getUserStudioCreditsAmount,
    getStudioCurrency,
  ],
  (amount, code) => formatCurrency(amount, { code })
);

export const getUserRAFCredits = createSelector(
  getUserCredits,
  credits => credits.find(c => c.source === 'raf')
);

export const getUserRAFCreditAmount = createSelector(
  getUserRAFCredits,
  credit => (credit ? credit.credit : 0)
);

export const getUserGlobalCredits = createSelector(
  getUserCredits,
  credits => credits.find(c => c.source === 'dibs')
);

export const getUserGlobalCreditAmount = createSelector(
  getUserGlobalCredits,
  credit => (credit ? credit.credit : 0)
);

export const getUserGlobalCreditCurrency = createSelector(
  getUserGlobalCredits,
  credit => (credit && credit.currency ? credit.currency : '')
);

export const getUserTotalCredits = createSelector(
  [
    getUserStudioCreditsAmount,
    getUserGlobalCreditAmount,
    getUserRAFCreditAmount,
  ],
  (studio, glb, raf) => Decimal(studio).plus(glb).plus(raf).toNumber()
);

export const getUserTotalCreditsDisplayedAmount = createSelector(
  [
    getUserTotalCredits,
    getStudioCurrency,
  ],
    (amount, code) => formatCurrency(amount, { code })
);

/**
 * getUserIsPurchasingCredits - Description
 *
 * @param {type} state Description
 *
 * @returns {type} Description
 */
export function getUserIsPurchasingCredits(state) {
  return getUser(state).purchasingCredits;
}

export const getUserFlashCredits = createSelector(
  getUser,
  user => (user.flash_credits || [])
);

export const getUserFlashCreditAtStudio = createSelector(
  [
    getUserFlashCredits,
    getDibsStudioId,
  ],
  (flashCredits, dibsStudioId) => (flashCredits.find(fc => fc.dibs_studio_id === dibsStudioId) || {})
);

export const getUserHasFlashCredit = createSelector(
  getUserFlashCreditAtStudio,
  fc => Boolean(fc.credit)
);

export const getUserFlashCreditAmount = createSelector(
  getUserFlashCreditAtStudio,
  flashCredit => (flashCredit.credit || 0)
);

export const getFormattedUserFlashCreditAmount = createSelector(
  getUserFlashCreditAmount,
  getStudioCurrency,
  (amount, code) => formatCurrency(amount, { code })
);

export const getTotalCreditsWithFlashCredits = createSelector(
  getUserTotalCredits,
  getUserFlashCreditAmount,
  (totalCredAmt, flashCredAmt) => Decimal(totalCredAmt).plus(flashCredAmt).toNumber()
);

export const getFormattedTotalCreditsWithFlashCredits = createSelector(
  getTotalCreditsWithFlashCredits,
  getStudioCurrency,
  (total, code) => formatCurrency(total, { code })
);


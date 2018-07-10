import { createSelector } from 'reselect';
import { format as formatCurrency } from 'currency-formatter';
import { getStudioData, getStudioCurrency } from '../';

/**
 * @param {Object} state in store
 * @returns {Array<Object>} studio credit tiers
 */
export function getStudioCreditTiers(state) {
  return getStudioData(state).creditTiers || [];
}

const getPricePrecision = price => ((price % 1) && 2);

export const getDetailedStudioCreditTiers = createSelector(
  getStudioCreditTiers,
  getStudioCurrency,
  state => ((state.cart || {}).credits || []),
  (creditTiers, currency, cartCreditItems) => creditTiers.map(creditTier => ({
    ...creditTier,
    formattedPayAmount: formatCurrency(creditTier.payAmount, {
      code: currency,
      precision: getPricePrecision(creditTier.payAmount),
    }),
    formattedReceiveAmount: formatCurrency(creditTier.receiveAmount, {
      code: currency,
      precision: getPricePrecision(creditTier.receiveAmount),
    }),
    quantity: (cartCreditItems.find(item => item.creditTierId === creditTier.id) || {}).quantity || 0,
  }))
);

import { createSelector } from 'reselect';
import Decimal from 'decimal.js';
import { format as formatCurrency } from 'currency-formatter';
import {
  getEventsData,
  getStudioCurrency,
  getStudioLocations,
} from '../';

/**
 * getConfirmationState
 * @param {Object} state  in Redux store
 * @returns {Array<Object>} confirmed transactions after purchase
 */
export function getConfirmationState(state) {
  return state.confirmation;
}

export const getConfirmedTransactionsByEvent = createSelector(
  getConfirmationState,
  getEventsData,
  getStudioCurrency,
  getStudioLocations,
  (transactions, events, currency, locations) => transactions.reduce((acc, transaction) => {
    const eventTransaction = acc.find(({ eventid }) => transaction.eventid === eventid);

    if (!eventTransaction) {
      const confirmedEvent = events.find(e => transaction.eventid === e.id);
      const eventLocation = locations.length && locations.find(l => l.id === confirmedEvent.location.id);

      const { latitude, longitude } = eventLocation;
      const { id } = transaction;
      const amount = new Decimal(transaction.amount).minus(transaction.studio_credits_spent)
                                                    .minus(transaction.raf_credits_spent)
                                                    .toNumber();
      const valueBack = transaction.pass ? Math.max(
        new Decimal(transaction.pass.passValue || 0).plus(transaction.discount_amount)
                                                    .minus(transaction.original_price)
                                                    .toNumber()
      ) : 0;
      const payload = {
        ...transaction,
        transactionids: [id],
        quantity: 1,
        valueBack,
        amount,
        description: confirmedEvent.description,
        name: confirmedEvent.name,
        address: confirmedEvent.address,
        latitude,
        longitude,
      };

      acc.push(payload);
      return acc;
    }

    eventTransaction.transactionids.push(transaction.id);
    eventTransaction.quantity += 1;
    eventTransaction.amount = new Decimal(eventTransaction.amount).plus(transaction.amount)
                                                                  .minus(transaction.studio_credits_spent)
                                                                  .minus(transaction.global_credits_spent)
                                                                  .minus(transaction.raf_credits_spent)
                                                                  .toNumber();
    eventTransaction.valueBack = new Decimal(
      eventTransaction.valueBack
    ).plus(
      transaction.pass ? Math.max(
        new Decimal(transaction.pass.passValue || 0).minus(transaction.original_price)
                                                    .toNumber()
      ) : 0
    )
    .plus(transaction.discount_amount)
    .toNumber();
    return acc;
  }, []).map(item => ({
    ...item,
    formattedSubtotal: formatCurrency(item.original_price, { code: currency, precision: (item.original_price % 1 && 2) }),
    formattedTaxAmount: formatCurrency(item.tax_amount, { code: currency, precision: (item.tax_amount % 1 && 2) }),
    formattedDiscountAmount: formatCurrency(item.discount_amount, { code: currency, precision: (item.discount_amount % 1 && 2) }),
    formattedStudioCreditAmount: formatCurrency(item.studio_credits_spent, { code: currency, precision: (item.studio_credits_spent % 1 && 2) }),
    formattedRAFCreditAmount: formatCurrency(item.raf_credits_spent, { code: currency, precision: (item.studio_credits_spent % 1 && 2) }),
    formattedTotal: formatCurrency(item.chargeAmount, { code: currency, precision: (item.chargeAmount % 1 && 2) }),
    formattedValueBack: formatCurrency(item.valueBack, { code: currency, precision: (item.chargeAmount % 1 && 2) }),
  }))
);


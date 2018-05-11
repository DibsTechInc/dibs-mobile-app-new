import { createSelector } from 'reselect';
import Decimal from 'decimal.js';
import { getEventsData } from '../';

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
  (transactions, events) => transactions.reduce((acc, transaction) => {
    const eventTransaction = acc.find(({ eventid }) => transaction.eventid === eventid);

    if (!eventTransaction) {
      const confirmedEvent = events.find(e => transaction.eventid === e.id);
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
        classDescription: confirmedEvent.description,
        studioAddress: confirmedEvent.address,
      };

      acc.push(payload);
      return acc;
    }
    // eventTransaction.address = confirmedEvent.address;
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
  }, [])
);


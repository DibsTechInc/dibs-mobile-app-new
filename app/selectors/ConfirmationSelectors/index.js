import { createSelector } from 'reselect';
import Decimal from 'decimal.js';
import { format as formatCurrency } from 'currency-formatter';
import moment from 'moment-timezone';

import {
  getEventsData,
  getStudioCurrency,
  getStudioLocations,
  getStudioCustomTimeFormat,
  getStudioShortDateFormat,
} from '../';

/**
 * getConfirmationState
 * @param {Object} state  in Redux store
 * @returns {Array<Object>} confirmed transactions after purchase
 */
export function getConfirmationState(state) {
  return state.confirmation || {};
}

/**
 * @param {Object} state in redux store
 * @returns {Array<Object>} confirmed pack transactions
 */
export function getConfirmationPackages(state) {
  return getConfirmationState(state).packages || [];
}

/**
 * @param {Object} state in redux store
 * @returns {Array<Object>} cofirmed event transactions
 */
export function getConfirmationEvents(state) {
  return getConfirmationState(state).events || [];
}

export const getDetailedConfirmationPackages = createSelector(
  getConfirmationPackages,
  getStudioCurrency,
  (packages, currency) => packages.reduce((acc, transaction) => {
    const packTransaction = acc.find(({ packageid }) => packageid === transaction.studioPackage.id);

    if (!packTransaction) {
      const { studioPackage, ...rest } = transaction;
      const amount = new Decimal(transaction.amount).minus(transaction.studio_credits_spent)
        .minus(transaction.raf_credits_spent)
        .toNumber();

      acc.push({
        ...rest,
        ...studioPackage,
        transactionids: [transaction.id],
        quantity: 1,
        amount,
        additionalPackageDescription: studioPackage.customDescription,
        name: studioPackage.name,
      });
    }

    // TODO handle multiple packs

    return acc;
  }, []).map(item => ({
    ...item,
    formattedSubtotal: formatCurrency(item.original_price, { code: currency, precision: (item.original_price % 1 && 2) }),
    formattedTaxAmount: formatCurrency(item.tax_amount, { code: currency, precision: (item.tax_amount % 1 && 2) }),
    formattedDiscountAmount: formatCurrency(item.discount_amount, { code: currency, precision: (item.discount_amount % 1 && 2) }),
    formattedStudioCreditAmount: formatCurrency(item.studio_credits_spent, { code: currency, precision: (item.studio_credits_spent % 1 && 2) }),
    formattedRAFCreditAmount: formatCurrency(item.raf_credits_spent, { code: currency, precision: (item.studio_credits_spent % 1 && 2) }),
    formattedTotal: formatCurrency(item.chargeAmount, { code: currency, precision: (item.chargeAmount % 1 && 2) }),
    formattedPricePerClass: formatCurrency(item.original_price / item.classAmount, { code: currency, precision: ((item.original_price / item.classAmount) % 1) && 2 }),
  }))
);

export const getDetailedConfirmationEvents = createSelector(
  getConfirmationEvents,
  getEventsData,
  getStudioCurrency,
  getStudioLocations,
  getStudioCustomTimeFormat,
  getStudioShortDateFormat,
  (transactions, events, currency, locations, timeFormat, shortDateFormat) => transactions.reduce((acc, transaction) => {
    const eventTransaction = acc.find(({ eventid }) => transaction.eventid === eventid);

    if (!eventTransaction) {
      const confirmedEvent = events.find(e => transaction.eventid === e.id);
      const eventLocation = locations.length && locations.find(l => l.id === confirmedEvent.location.id);

      const { latitude, longitude } = eventLocation;
      const { id } = transaction;

      let formattedDescription = confirmedEvent.description;

      if (!formattedDescription || formattedDescription.length <= 1) {
        formattedDescription = 'No class description.';
      }

      const sanitizedDescription = formattedDescription;

      const amount = new Decimal(transaction.amount).minus(transaction.studio_credits_spent)
                                                    .minus(transaction.raf_credits_spent)
                                                    .toNumber();
      const valueBack = transaction.pass ? Math.max(
        new Decimal(transaction.pass.passValue || 0).plus(transaction.discount_amount)
                                                    .minus(transaction.original_price)
                                                    .toNumber()
      ) : 0;

      const formatTime = time => (
        time.get('minute') || timeFormat !== 'LT' ?
          time.format(timeFormat) : time.format('hA')
      );
      const localStartTime = moment.tz(confirmedEvent.start_time, confirmedEvent.mainTZ);
      const payload = {
        ...transaction,
        transactionids: [id],
        quantity: 1,
        valueBack,
        amount,
        formattedDescription: sanitizedDescription,
        name: confirmedEvent.name,
        address: confirmedEvent.address,
        latitude,
        longitude,
        locationName: confirmedEvent.location.name,
        instructorName: confirmedEvent.instructor.name,
        formattedStartTime: formatTime(localStartTime),
        shortDayOfWeek: localStartTime.format('ddd'),
        shortEventDate: localStartTime.format(shortDateFormat),
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

export const getConfirmationItems = createSelector(
  getConfirmationPackages,
  getConfirmationEvents,
  (packs, events) => [...packs, ...events]
);


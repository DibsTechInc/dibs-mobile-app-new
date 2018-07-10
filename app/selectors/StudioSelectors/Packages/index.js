import { createSelector } from 'reselect';
import { format as formatCurrency } from 'currency-formatter';
import Decimal from 'decimal.js';

import { getUserStudioCreditsAmount } from '../../UserSelectors';
import { getStudioCurrency, getStudioData } from '../../StudioSelectors';
import { getPrimaryLocationTaxes } from '../../StudioSelectors/Locations';
import { getModifiedCharge, formatAutopayTimeText } from '../../../helpers';

/**
 * @param {Object} state in store
 * @returns {string} studio packages
 */
export function getStudioPackages(state) {
  return getStudioData(state).studio_packages || [];
}

/**
 * @param {Object} state in store
 * @returns {number} index index of the chosen package
 */
function getStudioPackageConfirmedId(state) {
  return state.packages.confirmId || 0;
}

export const getSingleStudioPackage = createSelector(
  [
    getStudioPackages,
    getStudioPackageConfirmedId,
  ],
  (studioPackages, confirmId) => studioPackages.find(studioPackage => studioPackage.id === confirmId) || {}
);

const expiresOrRenews = autopayStr => (autopayStr === 'FORCE' ? 'Renews' : 'Expires');

/**
 *
 * @param {Object} pkg studio package object
 * @returns {String} text to display
 */
function cartExpirationText({ passesValidFor, validForInterval, expires_after_first_booking: expiresAfterBooking, autopay }) {
  return `${expiresOrRenews(autopay)} ${passesValidFor} ${validForInterval}${passesValidFor > 1 ? 's' : ''} ${expiresAfterBooking ? 'after first visit' : 'from purchase date'}`;
}

/**
 *
 * @param {Object} pkg studio package object
 * @returns {String} text to display
 */
function expirationText({ passesValidFor, validForInterval, autopay }) {
  return `${expiresOrRenews(autopay)} in ${passesValidFor} ${validForInterval}${passesValidFor > 1 ? 's' : ''}`;
}

/**
 *
 * @param {Object} pkg studio package
 * @param {string} pkg.autopayIncrement length of time
 * @returns {string} abbreviated length of time
 */
function formatShortenedIncrement({ autopayIncrement }) {
  switch (autopayIncrement) {
    case 'year':
      return 'yr';
    case 'month':
      return 'mo';
    case 'week':
      return 'wk';
    case 'day':
    default:
      return autopayIncrement;
  }
}

/**
 * formatClassAmount
 * @param {object} pkg the class package
 * @returns {string} variation of the amount of class(es) as package offers
 */
function formatClassAmount(pkg) {
  switch (true) {
    case pkg.unlimited:
      return '';

    case pkg.classAmount === 1:
      return '1 class';

    default:
      return `${pkg.classAmount} classes`;
  }
}

export const getDetailedStudioPackages = createSelector(
  [
    getStudioPackages,
    getStudioCurrency,
    getUserStudioCreditsAmount,
    getPrimaryLocationTaxes,
    state => ((state.cart || {}).packages || []),
  ],
  (
    packages,
    currency,
    userCredits,
    primaryTaxes,
    packageCartItems
  ) => packages.map((pkg) => {
    const autoPayText = formatAutopayTimeText(pkg);
    const taxRate = new Decimal(primaryTaxes).dividedBy(100);

    const price = pkg.discount_price || pkg.price;

    const packageTaxes = new Decimal(price).times(taxRate).toDP(2).toNumber();
    const packageAutopayTaxes = new Decimal(price).times(taxRate).toDP(2).toNumber();

    const modifiedPrice = getModifiedCharge(Decimal(price).plus(packageTaxes), userCredits).toNumber();
    const creditsSpent = new Decimal(price).plus(packageTaxes).minus(modifiedPrice).toNumber();

    const cartItem = packageCartItems.find(item => item.packageid === pkg.id);

    return {
      ...pkg,
      quantity: cartItem ? cartItem.quantity : 0,
      price,
      taxRate: +taxRate,
      hasPromotion: Boolean(pkg.discount_price),
      hasAutopayPromotion: Boolean(pkg.discount_price_autopay),
      formattedClassAmount: formatClassAmount(pkg),
      additionalPackageDescription: pkg.customDescription,
      formattedOriginalPrice: formatCurrency(pkg.price, { code: currency }),
      formattedOriginalPriceAutopay: formatCurrency(pkg.priceAutopay, { code: currency }),
      formattedOriginalRoundedPrice: formatCurrency(pkg.price, { code: currency, precision: (pkg.price % 1) && 2 }),
      formattedOriginalRoundedPriceAutopay: formatCurrency(pkg.priceAutopay, { code: currency, precision: (pkg.priceAutopay % 1) && 2 }),
      formattedPrice: formatCurrency(price, { code: currency }),
      formattedRoundedPrice: formatCurrency(price, { code: currency, precision: (pkg.price % 1) && 2 }),
      formattedPricePerClass: formatCurrency(price / pkg.classAmount, { code: currency, precision: ((price / pkg.classAmount) % 1) && 2 }),
      formattedPriceAutopayPerClass: formatCurrency(price / pkg.classAmount, { code: currency, precision: ((price / pkg.classAmount) % 1) && 2 }),
      shortenedIncrement: formatShortenedIncrement(pkg),
      autoPayText,
      cartExpirationText: cartExpirationText(pkg),
      expirationText: expirationText(pkg),
      formattedModifiedPrice: formatCurrency(modifiedPrice, { code: currency }),
      formattedCreditsSpent: formatCurrency(creditsSpent, { code: currency }),
      packageTaxes,
      packageAutopayTaxes,
      packageFormattedTaxes: formatCurrency(packageTaxes, { code: currency }),
      packageFormattedAutopayTaxes: formatCurrency(packageAutopayTaxes, { code: currency }),
      autopay: pkg.autopay === 'FORCE',
    };
  }).sort((a, b) => {
    const a1 = a.sortIndex;
    const b1 = b.sortIndex;
    if (a1 === b1) return 0;
    return a1 > b1 ? 1 : -1;
  })
);


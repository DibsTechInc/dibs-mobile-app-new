import Decimal from 'decimal.js';
import moment from 'moment';
import * as _ from 'lodash';

/**
 * Finds the index for the credit object in question in the credit array
 * @param  {array} creditArray  Array of credit objects
 * @param  {number} studioId    studio id
 * @param  {string} source      source of studio "mb" or "zf"
 * @return {number}             index of credit object
 */
export function findStudioCreditIndex(creditArray, studioId, source) {
  return _.findIndex(creditArray, o =>
    Number(o.studioid) === Number(studioId) && o.source === source && o.credit > 0
  );
}
/**
 * Finds the index for the flash_credit object in question in the flash_credit array
 * @param  {array} creditArray  Array of flash_credit objects
 * @param  {number} studioId    studio id
 * @param  {string} source      source of studio "mb" or "zf"
 * @return {number}             index of flash_credit object
 */
export function findFlashCreditIndex(creditArray, studioId, source) {
  return _.findIndex(creditArray, o =>
    Number(o.studioid) === Number(studioId) && o.source === source && o.credit > 0 && moment(o.expiration) > moment()
  );
}

/**
 * Determines price of class after applying a credit
 * @param  {Decimal} fullAmount full amount of the class
 * @param  {number} credit     amount of credits a user has
 * @return {Decimal}            cost of class after applying credits
 */
export function getModifiedCharge(fullAmount, credit) {
  let modifiedAmount = fullAmount.minus(credit);
  if (modifiedAmount.lessThan(0)) {
    // need to make sure we stay within the proper type
    // Should only convert back to number at the END of the preparation steps in the purchase controller
    modifiedAmount = new Decimal(0);
  }
  return modifiedAmount;
}
/**
 * Determines how many credits a user has remaining after buying the class
 * @param  {Decimal} fullAmount full amount of the class
 * @param  {number} credit     amount of credits a user has
 * @return {Decimal}           remaining credits after application
 */
export function getRemainingCredit(fullAmount, credit) {
  const potentialRemainingCredit = new Decimal(fullAmount).minus(credit);
  if (potentialRemainingCredit.lt(0)) {
    return Math.abs(potentialRemainingCredit.toNumber());
  }
  return 0;
}

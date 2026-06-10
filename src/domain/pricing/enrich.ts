import Decimal from 'decimal.js';

import type { CartPackageItem, PassInCart } from './types';

/**
 * Legacy cart sort: ascending by price, but free (price 0) items always last.
 * The order matters — promo discounts and their tax adjustments apply to the
 * FIRST item only. (Ports getSortedCartEvents / getSortedCartPackages.)
 */
export function sortCartItemsByPrice<T extends { price: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.price === 0 && b.price) return 1;
    if (b.price === 0 && a.price) return -1;
    return a.price - b.price;
  });
}

export interface StudioPackageRow {
  id: number;
  price: number;
  discount_price?: number | null;
}

/**
 * Computes the priced fields of a package cart line.
 * Ports the pricing portion of getDetailedStudioPackages: effective price is
 * the discount price when present; per-unit tax uses the studio's PRIMARY
 * location tax rate, rounded half-up to 2dp per unit.
 */
export function computeDetailedPackage(
  pkg: StudioPackageRow,
  primaryLocationTaxRatePercent: number,
  quantity: number,
): CartPackageItem {
  const taxRate = new Decimal(primaryLocationTaxRatePercent).dividedBy(100);
  const price = pkg.discount_price || pkg.price;
  const packageTaxes = new Decimal(price).times(taxRate).toDecimalPlaces(2).toNumber();
  return {
    packageid: pkg.id,
    price,
    quantity,
    packageTaxes,
    taxRate: taxRate.toNumber(),
  };
}

export interface UserPassRow {
  id: number;
  passValue: number;
  source_serviceid: string | number | null;
  studioPackage: { unlimited: boolean };
}

export interface RawCartEventRow {
  passid: number | null;
  price: number;
  quantity: number;
}

/**
 * Enriches the user's valid studio passes against raw cart lines.
 * Ports getUserStudioPassesInCart. Note two legacy behaviors preserved
 * deliberately:
 * - `eventPrices` sums UNIT prices of lines using the pass, ignoring quantity.
 * - `displayPassValue` is false for third-party-synced or unlimited passes,
 *   which flips the value math from passValue to eventPrices downstream.
 */
export function enrichPassesInCart(
  validStudioPasses: UserPassRow[],
  rawCartEvents: RawCartEventRow[],
): PassInCart[] {
  return validStudioPasses
    .filter((pass) => rawCartEvents.find((event) => event.passid === pass.id))
    .map((pass) => {
      const lines = rawCartEvents.filter((event) => event.passid === pass.id);
      const quantity = lines.reduce((acc, { quantity: q }) => acc + q, 0);
      const eventPrices = lines
        .reduce((acc, { price }) => acc.plus(price), new Decimal(0))
        .toNumber();
      return {
        id: pass.id,
        passValue: pass.passValue,
        quantity,
        eventPrices,
        displayPassValue: !pass.source_serviceid && !pass.studioPackage.unlimited,
      };
    });
}

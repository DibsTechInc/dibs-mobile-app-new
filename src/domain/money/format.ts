/**
 * How money is written, in one place.
 *
 * Two formats, and the difference between them is deliberate:
 *
 *   `formatPrice`   — a PRICE. Drops the cents when there are none, so a $22 class reads "$22"
 *                     rather than "$22.00". Prices are quoted, and quoting trailing zeroes is
 *                     fussy.
 *   `formatBalance` — money the client HOLDS. Always two decimals. "$40" reads as an
 *                     approximation; a balance is not an approximation, it is a statement of
 *                     account, and a client checking whether they can cover a $40 class needs to
 *                     see that it is exactly $40.00 and not $40.4 rounded down.
 *
 * Both take the studio's currency because `dibs_config` carries one and a Canadian studio's
 * balance must not be labelled in US dollars.
 */

function format(amount: number, currency: string, minimumFractionDigits: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** A quoted price. Cents only when there are cents. */
export function formatPrice(amount: number, currency = 'USD'): string {
  return format(amount, currency, Number.isInteger(amount) ? 0 : 2);
}

/** Money in an account. Always cents. */
export function formatBalance(amount: number, currency = 'USD'): string {
  return format(amount, currency, 2);
}

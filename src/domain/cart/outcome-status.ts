/**
 * Does this cart line still count toward the checkout button?
 *
 * PURE TypeScript. One named rule, because the answer being wrong produces the same bug every
 * time and this codebase has now shipped it twice: a line that keeps its share of the total and
 * its share of the button while being incapable of ever succeeding. The client taps
 * "Try again · $22.00" underneath a sentence explaining why it cannot work, and taps it forever.
 *
 * The first instance was `already_booked` — the server counts attendee rows, so pressing a button
 * does not remove one. The second was `class_unavailable_in_app` — the server reads the event row
 * and the studio config, so the answer is a property of the class. Same shape as the widget's
 * "Use this card" button that dispatched nothing.
 *
 * ── The rule ────────────────────────────────────────────────────────────────────────────────
 * A line counts unless it is finished (`booked`) or unanswerable by the CTA. "Unanswerable by the
 * CTA" is not the same as "failed": a failed line is usually worth retrying, and excluding those
 * would leave a client unable to recover from a network blip. The distinction is whether pressing
 * the button again could produce a different answer.
 *
 * Lines that stop counting do NOT disappear. They keep their explanation and their own action —
 * "Book another spot" for a duplicate, Remove for an unavailable one. Silently dropping a line
 * from a cart is worse than leaving a line that says why.
 */

/** Just the discriminant — this module must not depend on the checkout hook's payload shapes. */
export type CartOutcomeKind =
  | 'pending'
  | 'working'
  | 'booked'
  | 'priceChanged'
  | 'coveredByPass'
  | 'alreadyBooked'
  | 'unavailable'
  | 'creditChanged'
  | 'failed';

/**
 * Outcomes the primary CTA cannot resolve, however many times it is pressed.
 *
 * `booked` is here because it is done, not because it is stuck — but it lands in the same place:
 * the button must not offer to do it again.
 */
const NOT_ACTIONABLE_BY_CTA: ReadonlySet<CartOutcomeKind> = new Set([
  'booked',
  'alreadyBooked',
  'unavailable',
]);

/**
 * Should this line contribute to the CTA's count and total?
 *
 * @param kind the line's current outcome
 * @param bookable whether the line is in a bookable state at all (`ready` / `covered`) — a class
 *        that is full, free, gone or unpriced never counted in the first place
 */
export function countsTowardCheckout(kind: CartOutcomeKind, bookable: boolean): boolean {
  if (!bookable) return false;
  return !NOT_ACTIONABLE_BY_CTA.has(kind);
}

/**
 * Is this outcome one the client can act on FROM THE LINE, rather than from the button?
 *
 * The counterpart of the rule above, and the reason excluding a line from the CTA is not a dead
 * end: everything excluded here has somewhere to go.
 */
export function hasOwnLineAction(kind: CartOutcomeKind): boolean {
  return kind === 'alreadyBooked' || kind === 'unavailable';
}

/**
 * The rule that keeps the checkout button honest.
 *
 * This bug has shipped twice in this codebase and once in the widget, always in the same shape: a
 * line that cannot succeed keeps its share of the total and its share of the CTA, so the client
 * presses a button that can only reproduce the refusal it was offered in response to.
 */
import { countsTowardCheckout, hasOwnLineAction, type CartOutcomeKind } from '../outcome-status';

describe('what the checkout button acts on', () => {
  it('counts a line nobody has tried yet', () => {
    expect(countsTowardCheckout('pending', true)).toBe(true);
  });

  it('counts a RETRYABLE failure — a blip must not cost the client their booking', () => {
    // The distinction that matters: `failed` is a network error, a decline, a full class. Pressing
    // again genuinely can produce a different answer, so excluding it would strand a recoverable
    // cart.
    expect(countsTowardCheckout('failed', true)).toBe(true);
  });

  it('counts priceChanged — the client confirms the new figure with the same button', () => {
    expect(countsTowardCheckout('priceChanged', true)).toBe(true);
  });

  describe('stops counting a line the button cannot resolve', () => {
    it.each<[CartOutcomeKind, string]>([
      ['booked', 'it is done — offering to do it again would double-charge'],
      ['alreadyBooked', 'the server counts attendee rows; pressing a button removes none'],
      ['unavailable', 'the server reads the event row; the answer is a property of the class'],
    ])('%s — %s', (kind) => {
      expect(countsTowardCheckout(kind, true)).toBe(false);
    });
  });

  it('never counts a line that was not bookable to begin with', () => {
    // full / gone / free / noPrice lines never reached the button in the first place.
    const everyKind: CartOutcomeKind[] = [
      'pending',
      'working',
      'booked',
      'priceChanged',
      'coveredByPass',
      'alreadyBooked',
      'unavailable',
      'failed',
    ];
    for (const kind of everyKind) {
      expect(countsTowardCheckout(kind, false)).toBe(false);
    }
  });
});

describe('nothing excluded from the button is a dead end', () => {
  it('every non-terminal outcome the CTA drops has its own action on the line', () => {
    // This is the actual guarantee. Dropping a line from the CTA is only safe because the line
    // itself offers somewhere to go — "Book another spot" for a duplicate, Remove for an
    // unavailable one. A future outcome added to the excluded set without a line action would
    // recreate the dead end in a new costume, and this test is what fails.
    const excluded: CartOutcomeKind[] = ['alreadyBooked', 'unavailable'];
    for (const kind of excluded) {
      expect(countsTowardCheckout(kind, true)).toBe(false);
      expect(hasOwnLineAction(kind)).toBe(true);
    }
  });

  it('booked is excluded WITHOUT a line action, because it is finished rather than stuck', () => {
    expect(countsTowardCheckout('booked', true)).toBe(false);
    expect(hasOwnLineAction('booked')).toBe(false);
  });
});

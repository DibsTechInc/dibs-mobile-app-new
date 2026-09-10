/**
 * `chooseFirstClassLine` — the ONE owner of "which cart line carries the first-class price".
 * PLAN D6/D7: eligible, not pass-covered (unless overridden), has the row offer, highest saving,
 * tie → earliest, exactly one.
 */
import {
  chooseFirstClassLine,
  describeFirstClassOffer,
  type FirstClassCandidate,
} from '../first-class';

const cand = (o: Partial<FirstClassCandidate> & { eventId: number }): FirstClassCandidate => ({
  startsAt: '2026-09-15T18:00:00.000Z',
  offer: { priceCents: 1500, savingsCents: 700, listPriceCents: 2200 },
  coveredByPass: false,
  chargeable: true,
  ...o,
});

const ELIGIBLE = { eligible: true };

describe('chooseFirstClassLine', () => {
  it('returns null when the client is not eligible, unknown, or absent', () => {
    expect(chooseFirstClassLine([cand({ eventId: 1 })], { eligible: false })).toBeNull();
    expect(chooseFirstClassLine([cand({ eventId: 1 })], undefined)).toBeNull();
    expect(chooseFirstClassLine([cand({ eventId: 1 })], null)).toBeNull();
  });

  it('picks the only eligible line', () => {
    expect(chooseFirstClassLine([cand({ eventId: 7 })], ELIGIBLE)).toBe(7);
  });

  it('skips lines whose row carries no offer', () => {
    expect(chooseFirstClassLine([cand({ eventId: 1, offer: null }), cand({ eventId: 2 })], ELIGIBLE)).toBe(2);
    expect(chooseFirstClassLine([cand({ eventId: 1, offer: null })], ELIGIBLE)).toBeNull();
  });

  it('never displaces a pass on its own', () => {
    expect(chooseFirstClassLine([cand({ eventId: 1, coveredByPass: true })], ELIGIBLE)).toBeNull();
  });

  it('honours the explicit override on a covered line, and it wins outright', () => {
    const lines = [
      cand({ eventId: 1, coveredByPass: true, offer: { priceCents: 1500, savingsCents: 100, listPriceCents: 1600 } }),
      cand({ eventId: 2 }),
    ];
    expect(chooseFirstClassLine(lines, ELIGIBLE, { overPassEventId: 1 })).toBe(1);
    // An override naming a line that is not a candidate is ignored.
    expect(chooseFirstClassLine(lines, ELIGIBLE, { overPassEventId: 99 })).toBe(2);
  });

  it('skips unchargeable lines (full, free, unpriced)', () => {
    expect(chooseFirstClassLine([cand({ eventId: 1, chargeable: false })], ELIGIBLE)).toBeNull();
  });

  it('prefers the highest saving', () => {
    const lines = [
      cand({ eventId: 1, offer: { priceCents: 1500, savingsCents: 700, listPriceCents: 2200 } }),
      cand({ eventId: 2, offer: { priceCents: 1500, savingsCents: 1300, listPriceCents: 2800 } }),
      cand({ eventId: 3, offer: { priceCents: 1500, savingsCents: 150, listPriceCents: 2200 } }),
    ];
    expect(chooseFirstClassLine(lines, ELIGIBLE)).toBe(2);
  });

  it('breaks a tie by the earliest start', () => {
    const lines = [
      cand({ eventId: 1, startsAt: '2026-09-16T18:00:00.000Z' }),
      cand({ eventId: 2, startsAt: '2026-09-15T18:00:00.000Z' }),
      cand({ eventId: 3, startsAt: '2026-09-17T18:00:00.000Z' }),
    ];
    expect(chooseFirstClassLine(lines, ELIGIBLE)).toBe(2);
  });

  it('never chooses a line the server refused', () => {
    const lines = [cand({ eventId: 1 }), cand({ eventId: 2, offer: { priceCents: 1500, savingsCents: 100, listPriceCents: 1600 } })];
    expect(chooseFirstClassLine(lines, ELIGIBLE, { excludedEventIds: new Set([1]) })).toBe(2);
    expect(chooseFirstClassLine(lines, ELIGIBLE, { excludedEventIds: new Set([1, 2]) })).toBeNull();
  });

  it('describes the offer the way the server does', () => {
    expect(describeFirstClassOffer(1500, 2200)).toBe('First class price — $15 instead of $22');
    expect(describeFirstClassOffer(1500, 1650)).toBe('First class price — $15 instead of $16.50');
  });
});

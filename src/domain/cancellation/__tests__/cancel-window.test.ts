/**
 * The cancellation window, stated as a moment.
 *
 * `.claude/CANCELLATION.md` §3: early when the cancel happens at least `cancel_time` hours before
 * the session, late otherwise, boundary counts as early. Every case here is really a check that
 * the subtraction happened in the studio's frame rather than the device's.
 */
import { cancelWindowSentence, describeCancelWindow } from '../cancel-window';

const LA = 'America/Los_Angeles';
const NY = 'America/New_York';

describe('describeCancelWindow', () => {
  it('puts the deadline 12 hours before a 6pm class', () => {
    const w = describeCancelWindow('2026-08-06T18:00:00.000Z', LA, 12, new Date('2026-08-05T20:00:00.000Z'));
    expect(w?.deadline).toBe('2026-08-06T06:00:00.000Z');
    expect(w?.deadlineLabel).toBe('6:00 AM tomorrow');
  });

  it('says today when the deadline is later the same studio day', () => {
    // 2026-08-06T15:00Z is 08:00 in Los Angeles on the 6th; the deadline is 18:00 that evening.
    const w = describeCancelWindow('2026-08-07T06:00:00.000Z', LA, 12, new Date('2026-08-06T15:00:00.000Z'));
    expect(w?.deadlineLabel).toBe('6:00 PM today');
  });

  it('names the weekday for anything further out', () => {
    const w = describeCancelWindow('2026-08-09T18:00:00.000Z', LA, 12, new Date('2026-08-05T20:00:00.000Z'));
    expect(w?.deadlineLabel).toBe('Sunday at 6:00 AM');
  });

  it('falls back to a date past a week, where a weekday would be ambiguous', () => {
    const w = describeCancelWindow('2026-08-20T18:00:00.000Z', LA, 12, new Date('2026-08-05T20:00:00.000Z'));
    expect(w?.deadlineLabel).toBe('August 20 at 6:00 AM');
  });

  it('handles a long subscription-style window in days', () => {
    // Studio 263 runs 744 hours — 31 days.
    const w = describeCancelWindow('2026-09-06T18:00:00.000Z', NY, 744, new Date('2026-08-01T12:00:00.000Z'));
    expect(w?.deadline).toBe('2026-08-06T18:00:00.000Z');
  });
});

describe('describeCancelWindow — early vs late', () => {
  const classAt6pm = '2026-08-06T18:00:00.000Z';

  it('is still free well before the deadline', () => {
    const w = describeCancelWindow(classAt6pm, LA, 12, new Date('2026-08-05T20:00:00.000Z'));
    expect(w?.isStillFree).toBe(true);
  });

  it('is no longer free after it', () => {
    // 2026-08-06T17:00Z is 10:00 in Los Angeles on the 6th — eight hours before a 6pm class.
    const w = describeCancelWindow(classAt6pm, LA, 12, new Date('2026-08-06T17:00:00.000Z'));
    expect(w?.isStillFree).toBe(false);
  });

  it('counts the exact boundary as early, matching the backend', () => {
    // Exactly 12 hours out in the studio's clock: 06:00 Pacific on the 6th.
    const w = describeCancelWindow(classAt6pm, LA, 12, new Date('2026-08-06T13:00:00.000Z'));
    expect(w?.isStillFree).toBe(true);
  });

  it('does the subtraction in the STUDIO frame, not the device one', () => {
    // The trap: 2026-08-06T05:30Z is 22:30 on the 5th in Los Angeles, which is 19.5 hours before
    // a 6pm class on the 6th — comfortably free. Comparing the stored time against a real
    // instant would make it look like 12.5 hours and, at other offsets, flip the answer outright.
    const w = describeCancelWindow(classAt6pm, LA, 12, new Date('2026-08-06T05:30:00.000Z'));
    expect(w?.isStillFree).toBe(true);
  });

  it('gives a New York studio a different answer than a California one at the same instant', () => {
    // Same real instant, same stored class time, three hours of offset between the studios.
    const instant = new Date('2026-08-06T09:30:00.000Z'); // 05:30 NY, 02:30 LA
    expect(describeCancelWindow(classAt6pm, NY, 12, instant)?.isStillFree).toBe(true);
    expect(describeCancelWindow(classAt6pm, LA, 12, instant)?.isStillFree).toBe(true);
    // ...and at an instant that straddles them, they disagree — correctly.
    const later = new Date('2026-08-06T10:30:00.000Z'); // 06:30 NY (late), 03:30 LA (early)
    expect(describeCancelWindow(classAt6pm, NY, 12, later)?.isStillFree).toBe(false);
    expect(describeCancelWindow(classAt6pm, LA, 12, later)?.isStillFree).toBe(true);
  });
});

describe('describeCancelWindow — no policy', () => {
  it('returns null rather than inventing one on the studio’s behalf', () => {
    const at = '2026-08-06T18:00:00.000Z';
    const now = new Date('2026-08-05T20:00:00.000Z');
    expect(describeCancelWindow(at, LA, null, now)).toBeNull();
    expect(describeCancelWindow(at, LA, undefined, now)).toBeNull();
    expect(describeCancelWindow(at, LA, 0, now)).toBeNull();
    expect(describeCancelWindow(at, LA, Number.NaN, now)).toBeNull();
  });
});

describe('cancelWindowSentence', () => {
  it('states the deadline while it is still open', () => {
    const w = describeCancelWindow('2026-08-06T18:00:00.000Z', LA, 12, new Date('2026-08-05T20:00:00.000Z'));
    expect(cancelWindowSentence(w)).toBe('Free to cancel until 6:00 AM tomorrow — 12 hours before class.');
  });

  it('tells the client the window has closed BEFORE they book', () => {
    const w = describeCancelWindow('2026-08-06T18:00:00.000Z', LA, 12, new Date('2026-08-06T17:00:00.000Z'));
    const sentence = cancelWindowSentence(w)!;
    expect(sentence).toContain('has passed');
    // It must still say the spot is freed — a client who cannot attend should not be discouraged
    // from releasing it just because they are being charged either way.
    expect(sentence).toContain('frees your spot');
  });

  it('singularises a one-hour window', () => {
    const w = describeCancelWindow('2026-08-06T18:00:00.000Z', LA, 1, new Date('2026-08-05T20:00:00.000Z'));
    expect(cancelWindowSentence(w)).toContain('1 hour before class');
  });

  it('says nothing when there is no policy', () => {
    expect(cancelWindowSentence(null)).toBeNull();
  });
});

/**
 * The monthly-commitment date math — golden masters against the widget's own functions
 * (`getAllRemainingSessionDates`, `addFutureHoldSessions`, `getRemainingSessionsInMonth('next')`),
 * because the recurring endpoint bills whatever the client computes. A drift here is a drift in
 * somebody's charge.
 */
import {
  futureHoldSessions,
  nextMonthWeekdayCount,
  remainingWeeklyDatesInMonth,
} from '../recurring';

describe('remainingWeeklyDatesInMonth', () => {
  it('books Sat Aug 22 → Aug 22 + Aug 29 (the handoff’s own example)', () => {
    expect(remainingWeeklyDatesInMonth('2026-08-22T11:00:00.000Z')).toEqual([
      '2026-08-22T11:00:00.000Z',
      '2026-08-29T11:00:00.000Z',
    ]);
  });

  it('books Sat Aug 1 → five Saturdays (the expensive end of the swing)', () => {
    expect(remainingWeeklyDatesInMonth('2026-08-01T11:00:00.000Z')).toEqual([
      '2026-08-01T11:00:00.000Z',
      '2026-08-08T11:00:00.000Z',
      '2026-08-15T11:00:00.000Z',
      '2026-08-22T11:00:00.000Z',
      '2026-08-29T11:00:00.000Z',
    ]);
  });

  it('includes the last day of the month itself', () => {
    // Aug 31 2026 is a Monday.
    expect(remainingWeeklyDatesInMonth('2026-08-31T09:00:00.000Z')).toEqual([
      '2026-08-31T09:00:00.000Z',
    ]);
  });

  it('keeps the wall-clock time on every date (no DST shear — UTC stepping)', () => {
    // The US DST boundary (Nov 1 2026) sits inside this window; stored times are wall-clock
    // worn as UTC, so every occurrence must keep 09:00 exactly.
    const dates = remainingWeeklyDatesInMonth('2026-10-25T09:00:00.000Z');
    expect(dates).toEqual(['2026-10-25T09:00:00.000Z']);

    const december = remainingWeeklyDatesInMonth('2026-12-01T18:30:00.000Z');
    for (const iso of december) expect(iso.slice(11)).toBe('18:30:00.000Z');
    expect(december).toHaveLength(5); // Dec 2026 has five Tuesdays: 1, 8, 15, 22, 29.
  });

  it('handles February in a leap year', () => {
    // Feb 29 2028 is a Tuesday: booking Feb 1 2028 (Tue) runs 1, 8, 15, 22, 29.
    expect(remainingWeeklyDatesInMonth('2028-02-01T07:00:00.000Z')).toHaveLength(5);
    // Non-leap: Feb 2026 from Sun Feb 1 → 1, 8, 15, 22.
    expect(remainingWeeklyDatesInMonth('2026-02-01T07:00:00.000Z')).toHaveLength(4);
  });

  it('is empty for garbage input', () => {
    expect(remainingWeeklyDatesInMonth('')).toEqual([]);
    expect(remainingWeeklyDatesInMonth('not a date')).toEqual([]);
  });
});

describe('futureHoldSessions', () => {
  it('reserves 40 weekly holds after the LAST paid session', () => {
    const holds = futureHoldSessions([
      '2026-08-22T11:00:00.000Z',
      '2026-08-29T11:00:00.000Z',
    ]);
    expect(holds).toHaveLength(40);
    expect(holds[0]).toBe('2026-09-05T11:00:00.000Z');
    expect(holds[1]).toBe('2026-09-12T11:00:00.000Z');
    expect(holds[39]).toBe('2027-06-05T11:00:00.000Z');
  });

  it('keeps the wall-clock hour across the year (UTC stepping, widget parity)', () => {
    const holds = futureHoldSessions(['2026-08-29T11:00:00.000Z']);
    for (const iso of holds) expect(iso.slice(11)).toBe('11:00:00.000Z');
  });

  it('is empty with no paid sessions — the widget’s own guard', () => {
    expect(futureHoldSessions([])).toEqual([]);
  });
});

describe('nextMonthWeekdayCount', () => {
  it('counts next month’s Saturdays from its 1st, wherever the booking falls', () => {
    // Booking any August 2026 Saturday → September 2026 has 4 Saturdays (5, 12, 19, 26).
    expect(nextMonthWeekdayCount('2026-08-22T11:00:00.000Z')).toBe(4);
    // Booking a Monday in August → September has 4 Mondays.
    expect(nextMonthWeekdayCount('2026-08-31T09:00:00.000Z')).toBe(4);
    // Booking a Tuesday in November → December 2026 has 5 Tuesdays.
    expect(nextMonthWeekdayCount('2026-11-03T18:00:00.000Z')).toBe(5);
  });

  it('crosses the year boundary', () => {
    // A Thursday in December 2026 → January 2027 has 4 Thursdays (7, 14, 21, 28).
    expect(nextMonthWeekdayCount('2026-12-31T10:00:00.000Z')).toBe(4);
  });

  it('is 0 for garbage input', () => {
    expect(nextMonthWeekdayCount('not a date')).toBe(0);
  });
});

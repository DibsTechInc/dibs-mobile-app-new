import {
  describeTimeUntil,
  formatStoredTime,
  hoursUntilStoredTime,
  isEarlyCancel,
  isStoredTimeInPast,
  parseStoredTime,
  studioNow,
  toRealInstant,
} from '../studio-now';

const NY = 'America/New_York';
const LA = 'America/Los_Angeles';

/** A real UTC instant, for injecting as "now". */
const at = (iso: string) => new Date(iso);

describe('studioNow', () => {
  it('re-encodes the present as the studio wall clock, not the real instant', () => {
    // 18:00 real UTC is 14:00 in New York (EDT, UTC-4) in August.
    expect(studioNow(NY, at('2026-08-04T18:00:00Z')).toISOString()).toBe('2026-08-04T14:00:00.000Z');
    // …and 11:00 in California (PDT, UTC-7).
    expect(studioNow(LA, at('2026-08-04T18:00:00Z')).toISOString()).toBe('2026-08-04T11:00:00.000Z');
  });

  it('rolls the date backwards when the studio is still on the previous day', () => {
    // 02:00 UTC on the 5th is 22:00 on the 4th in New York — the classic evening-class bug.
    expect(studioNow(NY, at('2026-08-05T02:00:00Z')).toISOString()).toBe('2026-08-04T22:00:00.000Z');
  });

  it('tracks daylight saving rather than assuming a fixed offset', () => {
    // January: New York is EST (UTC-5), not EDT (UTC-4).
    expect(studioNow(NY, at('2026-01-15T18:00:00Z')).toISOString()).toBe('2026-01-15T13:00:00.000Z');
    expect(studioNow(NY, at('2026-07-15T18:00:00Z')).toISOString()).toBe('2026-07-15T14:00:00.000Z');
  });

  it('handles midnight without producing hour 24', () => {
    // 04:00 UTC = exactly midnight in New York during EDT.
    expect(studioNow(NY, at('2026-08-05T04:00:00Z')).toISOString()).toBe('2026-08-05T00:00:00.000Z');
  });

  it('works for zones with a non-whole-hour offset', () => {
    // Kolkata is UTC+5:30.
    expect(studioNow('Asia/Kolkata', at('2026-08-04T18:00:00Z')).toISOString()).toBe(
      '2026-08-04T23:30:00.000Z',
    );
  });
});

describe('hoursUntilStoredTime — the comparison that must never use device now', () => {
  it('measures against the studio clock, not the real instant', () => {
    // A 6:00pm New York class, stored as fake-UTC 18:00Z.
    const classTime = '2026-08-05T18:00:00.000Z';
    // Real instant: 2026-08-05T18:00Z, which is 14:00 in New York — four hours before class.
    expect(hoursUntilStoredTime(classTime, NY, at('2026-08-05T18:00:00Z'))).toBe(4);
  });

  it('is exactly the bug the plan warns about if you use device now instead', () => {
    const classTime = '2026-08-05T18:00:00.000Z';
    const realNow = at('2026-08-05T18:00:00Z');

    const correct = hoursUntilStoredTime(classTime, NY, realNow);
    const naive = (parseStoredTime(classTime).getTime() - realNow.getTime()) / 3_600_000;

    expect(correct).toBe(4);
    expect(naive).toBe(0);
    // Four hours of error — enough to flip a 12-hour cancellation window.
    expect(correct - naive).toBe(4);
  });

  it('goes negative once the class has started', () => {
    expect(hoursUntilStoredTime('2026-08-05T18:00:00.000Z', NY, at('2026-08-05T23:00:00Z'))).toBe(-1);
    expect(isStoredTimeInPast('2026-08-05T18:00:00.000Z', NY, at('2026-08-05T23:00:00Z'))).toBe(true);
    expect(isStoredTimeInPast('2026-08-05T18:00:00.000Z', NY, at('2026-08-05T18:00:00Z'))).toBe(false);
  });

  it('is bigger for a west-coast studio at the same real instant', () => {
    // Same stored hour, same moment: California is three hours further from its own 6pm.
    const classTime = '2026-08-05T18:00:00.000Z';
    const realNow = at('2026-08-05T18:00:00Z');
    expect(hoursUntilStoredTime(classTime, LA, realNow)).toBe(7);
    expect(hoursUntilStoredTime(classTime, NY, realNow)).toBe(4);
  });
});

describe('isEarlyCancel', () => {
  const classTime = '2026-08-05T18:00:00.000Z'; // 6pm at the studio
  const NOTICE = 12; // both v1 studios use 12 hours

  it('is early with more than the required notice', () => {
    // 2026-08-05T02:00Z = 22:00 on the 4th in NY = 20 hours before class.
    expect(isEarlyCancel(classTime, NY, NOTICE, at('2026-08-05T02:00:00Z'))).toBe(true);
  });

  it('is late inside the window', () => {
    // 20:00Z = 16:00 NY = 2 hours before class.
    expect(isEarlyCancel(classTime, NY, NOTICE, at('2026-08-05T20:00:00Z'))).toBe(false);
  });

  it('treats exactly the notice threshold as early', () => {
    // 10:00Z = 06:00 NY = precisely 12 hours before.
    expect(hoursUntilStoredTime(classTime, NY, at('2026-08-05T10:00:00Z'))).toBe(12);
    expect(isEarlyCancel(classTime, NY, NOTICE, at('2026-08-05T10:00:00Z'))).toBe(true);
  });

  it('would misjudge a real cancellation if device now were used', () => {
    // A client cancels at 05:00 NY — 13 hours ahead, comfortably early, entitlement returned.
    const realNow = at('2026-08-05T09:00:00Z');
    expect(isEarlyCancel(classTime, NY, NOTICE, realNow)).toBe(true);

    // The naive comparison sees 9 hours and would charge them.
    const naiveHours = (parseStoredTime(classTime).getTime() - realNow.getTime()) / 3_600_000;
    expect(naiveHours).toBe(9);
    expect(naiveHours >= NOTICE).toBe(false);
  });

  it('handles the 744-hour subscription window without overflow', () => {
    // Studio 263's subscription notice is 31 days.
    const far = '2026-09-30T18:00:00.000Z';
    expect(isEarlyCancel(far, NY, 744, at('2026-08-05T18:00:00Z'))).toBe(true);
    expect(isEarlyCancel(far, NY, 744, at('2026-09-20T18:00:00Z'))).toBe(false);
  });
});

describe('toRealInstant — the one sanctioned conversion (calendar inserts)', () => {
  it('turns a 6pm New York class into the correct real instant', () => {
    // 6pm EDT = 22:00 UTC.
    expect(toRealInstant('2026-08-05T18:00:00.000Z', NY).toISOString()).toBe(
      '2026-08-05T22:00:00.000Z',
    );
  });

  it('respects the studio zone, not the stored Z', () => {
    // The same stored reading is a different real moment for a California studio: 6pm PDT = 01:00Z next day.
    expect(toRealInstant('2026-08-05T18:00:00.000Z', LA).toISOString()).toBe(
      '2026-08-06T01:00:00.000Z',
    );
  });

  it('uses the right offset on each side of a DST boundary', () => {
    // EST (UTC-5) in January, EDT (UTC-4) in July — an offset constant would get one wrong.
    expect(toRealInstant('2026-01-15T18:00:00.000Z', NY).toISOString()).toBe(
      '2026-01-15T23:00:00.000Z',
    );
    expect(toRealInstant('2026-07-15T18:00:00.000Z', NY).toISOString()).toBe(
      '2026-07-15T22:00:00.000Z',
    );
  });

  it('round-trips: converting back through the studio clock returns the stored reading', () => {
    for (const stored of [
      '2026-01-15T09:30:00.000Z',
      '2026-03-08T14:00:00.000Z', // US DST spring-forward day
      '2026-11-01T09:00:00.000Z', // US DST fall-back day
      '2026-07-04T20:15:00.000Z',
    ]) {
      for (const zone of [NY, LA, 'Asia/Kolkata']) {
        const real = toRealInstant(stored, zone);
        expect(studioNow(zone, real).toISOString()).toBe(stored);
      }
    }
  });

  it('handles a half-hour-offset zone', () => {
    // 18:00 in Kolkata (UTC+5:30) is 12:30 UTC.
    expect(toRealInstant('2026-08-05T18:00:00.000Z', 'Asia/Kolkata').toISOString()).toBe(
      '2026-08-05T12:30:00.000Z',
    );
  });
});

describe('formatStoredTime — display is verbatim', () => {
  it('prints the stored hour regardless of where the device is', () => {
    // No device conversion: a 6pm class reads "6:00 PM" on every phone on earth.
    expect(formatStoredTime('2026-08-05T18:00:00.000Z')).toBe('6:00 PM');
    expect(formatStoredTime('2026-08-05T09:30:00.000Z')).toBe('9:30 AM');
  });

  it('formats dates verbatim too', () => {
    expect(
      formatStoredTime('2026-08-05T18:00:00.000Z', { weekday: 'short', month: 'short', day: 'numeric' }),
    ).toBe('Wed, Aug 5');
  });

  it('does not shift a late-evening class onto the next day', () => {
    // The failure mode of device conversion: 11:30pm reads as tomorrow morning.
    expect(
      formatStoredTime('2026-08-05T23:30:00.000Z', { month: 'short', day: 'numeric', hour: 'numeric' }),
    ).toBe('Aug 5, 11 PM');
  });
});

describe('describeTimeUntil', () => {
  const classTime = '2026-08-05T18:00:00.000Z';

  it.each([
    ['2026-08-05T18:00:00Z', 'in 4 hours'],
    ['2026-08-05T21:30:00Z', 'in 30 minutes'],
    ['2026-08-05T23:00:00Z', '1 hour ago'],
    ['2026-08-03T18:00:00Z', 'in 2 days'],
  ])('at real instant %s says "%s"', (now, expected) => {
    expect(describeTimeUntil(classTime, NY, at(now))).toBe(expected);
  });

  it('returns null beyond a week, where a relative phrase stops helping', () => {
    expect(describeTimeUntil('2026-09-30T18:00:00.000Z', NY, at('2026-08-05T18:00:00Z'))).toBeNull();
  });
});

describe('parseStoredTime', () => {
  it('accepts the formats dibs-api actually returns', () => {
    expect(parseStoredTime('2026-08-05T18:00:00.000Z').getUTCHours()).toBe(18);
    expect(parseStoredTime('2026-08-05T18:00:00Z').getUTCHours()).toBe(18);
    expect(parseStoredTime(new Date('2026-08-05T18:00:00Z')).getUTCHours()).toBe(18);
  });

  it('throws loudly on garbage rather than yielding an Invalid Date downstream', () => {
    expect(() => parseStoredTime('not a date')).toThrow(/parseable/);
    expect(() => parseStoredTime('')).toThrow();
  });
});

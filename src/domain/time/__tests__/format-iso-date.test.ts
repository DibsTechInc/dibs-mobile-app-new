import { formatIsoDate } from '../studio-now';

describe('formatIsoDate', () => {
  it('renders the parts it was given', () => {
    expect(formatIsoDate('2026-11-02')).toBe('Nov 2, 2026');
  });

  it('does NOT shift the day, whatever the device timezone', () => {
    // The whole point. `new Date('2026-11-03').toLocaleDateString()` is Nov 2 in every
    // negative-offset zone — i.e. every Dibs studio — and this must never do that.
    const original = process.env.TZ;
    for (const tz of ['America/Los_Angeles', 'America/New_York', 'UTC', 'Pacific/Auckland']) {
      process.env.TZ = tz;
      expect(formatIsoDate('2026-11-03')).toBe('Nov 3, 2026');
    }
    process.env.TZ = original;
  });

  it('uses Sept, not Sep', () => {
    // Matches the widget's hand-rolled table; toLocaleDateString({month:'short'}) gives "Sep".
    expect(formatIsoDate('2026-09-07')).toBe('Sept 7, 2026');
  });

  it('can drop the year for tighter copy', () => {
    expect(formatIsoDate('2026-11-02', false)).toBe('Nov 2');
  });

  it('returns null rather than "Invalid Date" for junk', () => {
    for (const bad of [null, undefined, '', 'tomorrow', '2026-11', '2026-13-01', '2026-11-00']) {
      expect(formatIsoDate(bad as string)).toBeNull();
    }
  });

  it('refuses a full instant — this field is a DATE, and accepting both hides a contract slip', () => {
    expect(formatIsoDate('2026-11-02T00:00:00.000Z')).toBeNull();
  });
});

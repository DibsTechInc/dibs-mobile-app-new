/**
 * "Your next class" — which booking, and how it is labelled.
 *
 * The endpoint returns everything from the start of today onwards, so this morning's class is
 * still in the list at 6pm. Every case here is about not showing that one.
 */
import type { UpcomingBookingRow } from '@/api/schemas/upcoming';

import { selectNextBooking } from '../select-next-booking';

function row(startsAt: string, overrides: Partial<UpcomingBookingRow> = {}): UpcomingBookingRow {
  return {
    eventid: Number(startsAt.replace(/\D/g, '').slice(-8)),
    start_date: startsAt,
    name: 'Vinyasa Flow',
    dropped: false,
    instructor: { firstname: 'Marta', lastname: ' Estellés' },
    location: { locationName: 'Carlsbad Village Yoga Co-op' },
    ...overrides,
  } as UpcomingBookingRow;
}

const OPTIONS = { timeZone: 'America/Los_Angeles', showInstructor: true };
/** 2026-08-05T22:30Z is 15:30 in Los Angeles. */
const AFTERNOON = new Date('2026-08-05T22:30:00.000Z');

describe('selectNextBooking', () => {
  it('skips the class that already started today', () => {
    const next = selectNextBooking(
      [row('2026-08-05T06:00:00.000Z'), row('2026-08-05T18:00:00.000Z')],
      { ...OPTIONS, now: AFTERNOON },
    );
    expect(next?.startsAt).toBe('2026-08-05T18:00:00.000Z');
  });

  it('picks the soonest, not the first row', () => {
    const next = selectNextBooking(
      [row('2026-08-08T09:00:00.000Z'), row('2026-08-06T09:00:00.000Z')],
      { ...OPTIONS, now: AFTERNOON },
    );
    expect(next?.startsAt).toBe('2026-08-06T09:00:00.000Z');
  });

  it('ignores a cancelled booking', () => {
    const next = selectNextBooking(
      [row('2026-08-05T18:00:00.000Z', { dropped: true }), row('2026-08-06T09:00:00.000Z')],
      { ...OPTIONS, now: AFTERNOON },
    );
    expect(next?.startsAt).toBe('2026-08-06T09:00:00.000Z');
  });

  it('is null when everything has passed', () => {
    expect(
      selectNextBooking([row('2026-08-05T06:00:00.000Z')], { ...OPTIONS, now: AFTERNOON }),
    ).toBeNull();
    expect(selectNextBooking([], { ...OPTIONS, now: AFTERNOON })).toBeNull();
  });

  it('compares against the studio clock, not the device one', () => {
    // 2026-08-06T02:00Z is 19:00 on Aug 5 in Los Angeles, so a 20:00 class that evening is still
    // ahead. Compared against a real-instant "now" it would read as four hours in the past.
    const next = selectNextBooking([row('2026-08-05T20:00:00.000Z')], {
      ...OPTIONS,
      now: new Date('2026-08-06T02:00:00.000Z'),
    });
    expect(next?.startsAt).toBe('2026-08-05T20:00:00.000Z');
  });

  it('labels the day rather than assuming today', () => {
    expect(
      selectNextBooking([row('2026-08-05T18:00:00.000Z')], { ...OPTIONS, now: AFTERNOON })?.whenLabel,
    ).toBe('Today');
    expect(
      selectNextBooking([row('2026-08-06T09:00:00.000Z')], { ...OPTIONS, now: AFTERNOON })?.whenLabel,
    ).toBe('Tomorrow');
    expect(
      selectNextBooking([row('2026-08-08T09:00:00.000Z')], { ...OPTIONS, now: AFTERNOON })?.whenLabel,
    ).toBe('Sat, Aug 8');
  });

  it('cleans up the name and the instructor', () => {
    const next = selectNextBooking([row('2026-08-06T09:00:00.000Z', { name: 'Flow ' })], {
      ...OPTIONS,
      now: AFTERNOON,
    });
    expect(next?.name).toBe('Flow');
    expect(next?.instructor).toBe('Marta Estellés');
  });

  it('hides the instructor for a studio that does not show them', () => {
    const next = selectNextBooking([row('2026-08-06T09:00:00.000Z')], {
      timeZone: 'America/Los_Angeles',
      showInstructor: false,
      now: AFTERNOON,
    });
    expect(next?.instructor).toBeNull();
  });

  it('skips rows the backend returned without the fields it needs', () => {
    // add-data-to-appts.js can emit partial rows; a card with no event id has nothing to open.
    const next = selectNextBooking(
      [
        row('2026-08-06T09:00:00.000Z', { eventid: null }),
        row('2026-08-07T09:00:00.000Z', { start_date: null }),
        row('2026-08-08T09:00:00.000Z'),
      ],
      { ...OPTIONS, now: AFTERNOON },
    );
    expect(next?.startsAt).toBe('2026-08-08T09:00:00.000Z');
  });

  it('falls back to classtitle when name is missing', () => {
    const next = selectNextBooking(
      [row('2026-08-06T09:00:00.000Z', { name: null, classtitle: 'Candlelight Yin' })],
      { ...OPTIONS, now: AFTERNOON },
    );
    expect(next?.name).toBe('Candlelight Yin');
  });
});

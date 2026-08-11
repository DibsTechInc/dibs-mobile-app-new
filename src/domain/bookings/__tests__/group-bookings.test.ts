/**
 * The split the API does NOT draw for us. See `group-bookings.ts` for why neither returned array
 * means what its name says.
 */
import { groupBookings, toDaySections } from '../group-bookings';

const TZ = 'America/New_York';
/** 6pm in New York on 2026-08-07. */
const EVENING = new Date('2026-08-07T22:00:00.000Z');

const OPTS = { timeZone: TZ, showInstructor: true, now: EVENING };

function row(over: Record<string, unknown> = {}) {
  return {
    eventid: 1,
    start_date: '2026-08-08T18:30:00.000Z',
    name: 'Beginner BASIC Ballet',
    instructor: { firstname: 'aimee', lastname: 'ozeki' },
    location: { locationName: 'Studio A' },
    serviceName: '10-class package',
    ...over,
  };
}

describe('groupBookings', () => {
  it('shapes a booking into what the row renders, without re-deriving the time', () => {
    const { upcoming } = groupBookings({ upcomingAppts: [row()] }, OPTS);

    expect(upcoming).toHaveLength(1);
    expect(upcoming[0]).toMatchObject({
      eventId: 1,
      startsAt: '2026-08-08T18:30:00.000Z',
      name: 'Beginner BASIC Ballet',
      instructor: 'Aimee Ozeki',
      locationLabel: 'Studio A',
      timeLabel: '6:30 PM',
      paidWithLabel: '10-class package',
      isCancelled: false,
    });
  });

  it("puts THIS MORNING's class in the past, though the API still calls it upcoming", () => {
    // The endpoint returns from the start of the studio's today, so a 6am class is in
    // `upcomingAppts` at 6pm. "Upcoming" has to mean not-yet-started, or the list opens on
    // something the client has already been to.
    const { upcoming, past } = groupBookings(
      { upcomingAppts: [row({ start_date: '2026-08-07T06:00:00.000Z' })] },
      OPTS,
    );

    expect(upcoming).toHaveLength(0);
    expect(past).toHaveLength(1);
  });

  it('never counts a cancelled booking as upcoming, however far in the future', () => {
    // A cancel leaves the row in place with dropped:true rather than removing it.
    const { upcoming, past } = groupBookings(
      { upcomingAppts: [row({ dropped: true, start_date: '2026-12-01T18:30:00.000Z' })] },
      OPTS,
    );

    expect(upcoming).toHaveLength(0);
    expect(past[0].isCancelled).toBe(true);
  });

  it('dedupes a session returned in BOTH arrays rather than rendering it twice', () => {
    const boundary = row({ eventid: 42, start_date: '2026-08-07T06:00:00.000Z' });
    const { past } = groupBookings(
      { upcomingAppts: [boundary], previousAppts: [boundary] },
      OPTS,
    );

    expect(past).toHaveLength(1);
    expect(past[0].eventId).toBe(42);
  });

  it('orders upcoming soonest-first and past most-recent-first', () => {
    const { upcoming, past } = groupBookings(
      {
        upcomingAppts: [
          row({ eventid: 2, start_date: '2026-08-10T18:30:00.000Z' }),
          row({ eventid: 1, start_date: '2026-08-08T18:30:00.000Z' }),
        ],
        previousAppts: [
          row({ eventid: 3, start_date: '2026-08-01T18:30:00.000Z' }),
          row({ eventid: 4, start_date: '2026-08-05T18:30:00.000Z' }),
        ],
      },
      OPTS,
    );

    expect(upcoming.map((b) => b.eventId)).toEqual([1, 2]);
    expect(past.map((b) => b.eventId)).toEqual([4, 3]);
  });

  it('compares against the STUDIO clock, not the device', () => {
    // 01:00 UTC on the 8th is still 9pm on the 7th in New York, so a 10pm class that evening has
    // NOT started. A device-clock comparison in UTC would file it as past.
    const { upcoming } = groupBookings(
      { upcomingAppts: [row({ start_date: '2026-08-07T22:00:00.000Z' })] },
      { ...OPTS, now: new Date('2026-08-08T01:00:00.000Z') },
    );

    expect(upcoming).toHaveLength(1);
  });

  it('drops rows it cannot place in time or identify, rather than rendering a blank', () => {
    const { upcoming, past } = groupBookings(
      { upcomingAppts: [row({ start_date: null }), row({ eventid: null })] },
      OPTS,
    );

    expect(upcoming).toHaveLength(0);
    expect(past).toHaveLength(0);
  });

  it('honours showInstructor:false for the rental studios that hide names', () => {
    const { upcoming } = groupBookings(
      { upcomingAppts: [row()] },
      { ...OPTS, showInstructor: false },
    );

    expect(upcoming[0].instructor).toBeNull();
  });

  it('leaves paidWithLabel null rather than inventing a payment the row does not state', () => {
    const { upcoming } = groupBookings(
      { upcomingAppts: [row({ serviceName: null })] },
      OPTS,
    );

    expect(upcoming[0].paidWithLabel).toBeNull();
  });

  it('falls back through name → classtitle before giving up on a title', () => {
    const { upcoming } = groupBookings(
      { upcomingAppts: [row({ name: null, classtitle: 'VIRTUAL Mixed Intermediate' })] },
      OPTS,
    );

    expect(upcoming[0].name).toBe('VIRTUAL Mixed Intermediate');
  });

  it('survives both arrays being absent', () => {
    expect(groupBookings({}, OPTS)).toEqual({ upcoming: [], past: [] });
  });
});

describe('toDaySections', () => {
  const item = (eventId: number, startsAt: string, whenLabel: string) => ({
    eventId, startsAt, whenLabel,
    name: 'Class', instructor: null, locationLabel: null,
    timeLabel: '6:30 PM', paidWithLabel: null, isCancelled: false, didAttend: false,
  });

  it('puts two classes on one day under a single heading', () => {
    const sections = toDaySections([
      item(1, '2026-08-08T09:00:00.000Z', 'Tomorrow'),
      item(2, '2026-08-08T18:30:00.000Z', 'Tomorrow'),
    ]);

    expect(sections).toHaveLength(1);
    expect(sections[0].label).toBe('Tomorrow');
    expect(sections[0].bookings.map((b) => b.eventId)).toEqual([1, 2]);
  });

  it('sections on the DATE, so two days sharing a label stay apart', () => {
    // Past a week `describeBookingDay` falls back to a weekday, so a booking on the 15th and one
    // on the 22nd are both "Sat, Aug ..." shaped. Grouping by label would merge them into one day.
    const sections = toDaySections([
      item(1, '2026-08-15T18:30:00.000Z', 'Sat, Aug 15'),
      item(2, '2026-08-22T18:30:00.000Z', 'Sat, Aug 15'),
    ]);

    expect(sections).toHaveLength(2);
  });

  it('keeps the order it was given rather than re-sorting', () => {
    const sections = toDaySections([
      item(1, '2026-08-08T18:30:00.000Z', 'Tomorrow'),
      item(2, '2026-08-09T18:30:00.000Z', 'Sunday'),
    ]);

    expect(sections.map((s) => s.label)).toEqual(['Tomorrow', 'Sunday']);
  });

  it('returns nothing for nothing', () => {
    expect(toDaySections([])).toEqual([]);
  });
});

/**
 * Cutting the schedule into the studio's own days.
 *
 * Every interesting case is a timezone case: at 9pm Pacific it is already tomorrow in UTC, so
 * anything that asks a `Date` what day it is puts the evening's classes on the wrong page.
 */
import type { ScheduleEvent } from '@/api/schemas/schedule';

import {
  fillEmptyDays,
  findEvent,
  groupByStudioDay,
  longDayLabel,
  monthLabelFor,
  storedDate,
} from '../days';

function event(startsAt: string, overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    eventid: Number(startsAt.replace(/\D/g, '').slice(-8)),
    start_date: startsAt,
    name: 'Flow',
    eventtype: 'class',
    ...overrides,
  } as ScheduleEvent;
}

const LA = 'America/Los_Angeles';
/** 15:30 in Los Angeles on Aug 5. */
const AFTERNOON = new Date('2026-08-05T22:30:00.000Z');

describe('groupByStudioDay', () => {
  it('groups into days and labels them for the strip', () => {
    const days = groupByStudioDay(
      [
        event('2026-08-05T18:00:00.000Z'),
        event('2026-08-05T19:30:00.000Z'),
        event('2026-08-06T09:00:00.000Z'),
      ],
      LA,
      AFTERNOON,
    );

    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({
      date: '2026-08-05',
      weekdayLabel: 'WED',
      dayOfMonth: '5',
      longLabel: 'Wednesday, August 5',
      isToday: true,
    });
    expect(days[0].events).toHaveLength(2);
    expect(days[1]).toMatchObject({ date: '2026-08-06', weekdayLabel: 'THU', isToday: false });
  });

  it('marks today by the STUDIO day, not the UTC one', () => {
    // 2026-08-06T04:00Z is 21:00 on the 5th in Los Angeles. A UTC reading would call the 6th
    // today and leave the studio's own evening classes filed under yesterday.
    const days = groupByStudioDay(
      [event('2026-08-05T22:00:00.000Z'), event('2026-08-06T09:00:00.000Z')],
      LA,
      new Date('2026-08-06T04:00:00.000Z'),
    );
    expect(days.find((d) => d.date === '2026-08-05')?.isToday).toBe(true);
    expect(days.find((d) => d.date === '2026-08-06')?.isToday).toBe(false);
  });

  it('drops classes that have already started', () => {
    const days = groupByStudioDay(
      [event('2026-08-05T06:00:00.000Z'), event('2026-08-05T18:00:00.000Z')],
      LA,
      AFTERNOON,
    );
    expect(days[0].events.map((e) => e.start_date)).toEqual(['2026-08-05T18:00:00.000Z']);
  });

  it('omits a day entirely once nothing is left on it', () => {
    // A day strip entry that leads to an empty list is a tap that goes nowhere.
    const days = groupByStudioDay(
      [event('2026-08-05T06:00:00.000Z'), event('2026-08-06T09:00:00.000Z')],
      LA,
      AFTERNOON,
    );
    expect(days.map((d) => d.date)).toEqual(['2026-08-06']);
  });

  it('sorts days, and classes within a day', () => {
    const days = groupByStudioDay(
      [
        event('2026-08-07T09:00:00.000Z'),
        event('2026-08-05T19:30:00.000Z'),
        event('2026-08-05T18:00:00.000Z'),
      ],
      LA,
      AFTERNOON,
    );
    expect(days.map((d) => d.date)).toEqual(['2026-08-05', '2026-08-07']);
    expect(days[0].events.map((e) => e.start_date)).toEqual([
      '2026-08-05T18:00:00.000Z',
      '2026-08-05T19:30:00.000Z',
    ]);
  });

  it('excludes appointments, private sessions and on-demand content', () => {
    const days = groupByStudioDay(
      [
        event('2026-08-05T18:00:00.000Z', { eventtype: 'appt' }),
        event('2026-08-05T19:00:00.000Z', { private: true }),
        event('2026-08-05T20:00:00.000Z', { on_demand: true }),
        event('2026-08-05T21:00:00.000Z'),
      ],
      LA,
      AFTERNOON,
    );
    expect(days).toHaveLength(1);
    expect(days[0].events.map((e) => e.start_date)).toEqual(['2026-08-05T21:00:00.000Z']);
  });

  it('is empty rather than throwing when the studio has posted nothing', () => {
    expect(groupByStudioDay([], LA, AFTERNOON)).toEqual([]);
  });
});

describe('storedDate / longDayLabel / findEvent', () => {
  it('reads the date part without a timezone round trip', () => {
    expect(storedDate('2026-08-05T18:00:00.000Z')).toBe('2026-08-05');
  });

  it('labels a stored time as the studio calendar day it belongs to', () => {
    // Late evening: still the 5th, even though UTC has moved on.
    expect(longDayLabel('2026-08-05T23:30:00.000Z')).toBe('Wednesday, August 5');
  });

  it('finds an event by id, or nothing', () => {
    const events = [event('2026-08-05T18:00:00.000Z', { eventid: 42 })];
    expect(findEvent(events, 42)?.eventid).toBe(42);
    expect(findEvent(events, 99)).toBeNull();
  });
});

describe('fillEmptyDays', () => {
  // The month label is DERIVED, not hardcoded: a fixture that stamps 'August' on a September date
  // makes the month-boundary test pass or fail for reasons that have nothing to do with the code.
  const day = (date: string, events: unknown[] = [{}]) =>
    ({
      date,
      weekdayLabel: 'X',
      dayOfMonth: date.slice(-2),
      longLabel: date,
      monthLabel: new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${date}T12:00:00.000Z`)),
      isToday: false,
      events,
    }) as never;

  it('returns an empty list unchanged', () => {
    expect(fillEmptyDays([])).toEqual([]);
  });

  it('inserts the days that have nothing on them', () => {
    // Without this the strip runs 8 · 10 and looks like a broken sort rather than an empty Sunday.
    const filled = fillEmptyDays([day('2026-08-08'), day('2026-08-10')]);
    expect(filled.map((d) => d.date)).toEqual(['2026-08-08', '2026-08-09', '2026-08-10']);
    expect(filled[1].events).toEqual([]);
  });

  it('labels an invented day the same way a real one is labelled', () => {
    const filled = fillEmptyDays([day('2026-08-08'), day('2026-08-10')]);
    expect(filled[1]).toMatchObject({ weekdayLabel: 'SUN', dayOfMonth: '9', monthLabel: 'August 2026' });
  });

  it('crosses a month boundary without losing a day', () => {
    // The case that made the strip read 19 · 2 on device.
    const filled = fillEmptyDays([day('2026-08-31'), day('2026-09-02')]);
    expect(filled.map((d) => d.date)).toEqual(['2026-08-31', '2026-09-01', '2026-09-02']);
    // The INVENTED day is the one this function labels, and it must land in the right month.
    expect(filled[1]).toMatchObject({ date: '2026-09-01', monthLabel: 'September 2026' });
  });

  it('never marks an invented day as today', () => {
    const filled = fillEmptyDays([day('2026-08-08'), day('2026-08-12')]);
    expect(filled.filter((d) => d.isToday)).toHaveLength(0);
  });

  it('caps the run so a far-future class cannot generate an unbounded strip', () => {
    const filled = fillEmptyDays([day('2026-08-01'), day('2027-08-01')], 30);
    expect(filled).toHaveLength(30);
  });
});

describe('monthLabelFor', () => {
  const day = (date: string, monthLabel: string) =>
    ({ date, weekdayLabel: 'X', dayOfMonth: '1', longLabel: date, monthLabel, isToday: false, events: [] }) as never;

  it('follows the SELECTED day, so scrolling into September relabels the header', () => {
    const days = [day('2026-08-31', 'August 2026'), day('2026-09-02', 'September 2026')];
    expect(monthLabelFor(days, '2026-09-02')).toBe('September 2026');
  });

  it('falls back to the first day when nothing is selected yet', () => {
    const days = [day('2026-08-31', 'August 2026')];
    expect(monthLabelFor(days, null)).toBe('August 2026');
  });

  it('is empty rather than undefined when there are no days', () => {
    expect(monthLabelFor([], null)).toBe('');
  });
});

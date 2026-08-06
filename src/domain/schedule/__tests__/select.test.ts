/**
 * Which sessions belong on the classes surface, and which are "today".
 *
 * The interesting cases are all timezone cases. Studio 210 is America/Los_Angeles: at 21:00
 * Pacific it is already tomorrow in UTC, so anything that asks the device — or `Date` — what day
 * it is gets the wrong answer and Home shows tomorrow's classes tonight.
 */
import type { ScheduleEvent } from '@/api/schemas/schedule';

import { isPublicClass, selectTodaysClasses, selectUpcomingClasses } from '../select';

function event(startsAt: string, overrides: Partial<ScheduleEvent> = {}): ScheduleEvent {
  return {
    eventid: Number(startsAt.replace(/\D/g, '').slice(-8)),
    start_date: startsAt,
    name: 'Flow',
    eventtype: 'class',
    private: false,
    on_demand: false,
    ...overrides,
  } as ScheduleEvent;
}

/** A real instant. 2026-08-05T22:30Z is 15:30 in Los Angeles and 18:30 in New York. */
const AFTERNOON = new Date('2026-08-05T22:30:00.000Z');

describe('isPublicClass', () => {
  it('keeps ordinary classes', () => {
    expect(isPublicClass(event('2026-08-05T18:00:00.000Z'))).toBe(true);
  });

  it('drops appointments — out of v1 entirely', () => {
    expect(isPublicClass(event('2026-08-05T18:00:00.000Z', { eventtype: 'appt' }))).toBe(false);
  });

  it('drops private sessions and on-demand content', () => {
    expect(isPublicClass(event('2026-08-05T18:00:00.000Z', { private: true }))).toBe(false);
    expect(isPublicClass(event('2026-08-05T18:00:00.000Z', { on_demand: true }))).toBe(false);
  });
});

describe('selectTodaysClasses', () => {
  const events = [
    event('2026-08-05T06:00:00.000Z'), // this morning, already gone
    event('2026-08-05T18:00:00.000Z'), // this evening
    event('2026-08-05T19:30:00.000Z'),
    event('2026-08-06T09:00:00.000Z'), // tomorrow
  ];

  it("returns today's classes that have not started yet", () => {
    // 15:30 Pacific: the 06:00 has gone, the 18:00 and 19:30 are still to come.
    const picked = selectTodaysClasses(events, 'America/Los_Angeles', AFTERNOON);
    expect(picked.map((e) => e.start_date)).toEqual([
      '2026-08-05T18:00:00.000Z',
      '2026-08-05T19:30:00.000Z',
    ]);
  });

  it('uses the STUDIO day, not the UTC day', () => {
    // 2026-08-06T04:00Z is 21:00 on the 5th in Los Angeles. A UTC-based "today" would return
    // the 6th's classes while the studio is still in Wednesday evening.
    const lateEvening = new Date('2026-08-06T04:00:00.000Z');
    const picked = selectTodaysClasses(
      [event('2026-08-05T22:00:00.000Z'), event('2026-08-06T09:00:00.000Z')],
      'America/Los_Angeles',
      lateEvening,
    );
    expect(picked.map((e) => e.start_date)).toEqual(['2026-08-05T22:00:00.000Z']);
  });

  it('goes empty once the studio day is over, rather than borrowing tomorrow', () => {
    const lateNight = new Date('2026-08-06T06:30:00.000Z'); // 23:30 Pacific on the 5th
    expect(selectTodaysClasses(events, 'America/Los_Angeles', lateNight)).toHaveLength(0);
  });

  it('sorts by start time even if the response did not', () => {
    const shuffled = [event('2026-08-05T19:30:00.000Z'), event('2026-08-05T18:00:00.000Z')];
    const picked = selectTodaysClasses(shuffled, 'America/Los_Angeles', AFTERNOON);
    expect(picked.map((e) => e.start_date)).toEqual([
      '2026-08-05T18:00:00.000Z',
      '2026-08-05T19:30:00.000Z',
    ]);
  });

  it('excludes appointments and private sessions from the same window', () => {
    const mixed = [
      event('2026-08-05T18:00:00.000Z', { eventtype: 'appt' }),
      event('2026-08-05T19:30:00.000Z', { private: true }),
      event('2026-08-05T20:00:00.000Z'),
    ];
    const picked = selectTodaysClasses(mixed, 'America/Los_Angeles', AFTERNOON);
    expect(picked.map((e) => e.start_date)).toEqual(['2026-08-05T20:00:00.000Z']);
  });
});

describe('selectUpcomingClasses', () => {
  it('crosses the day boundary and honours the limit', () => {
    const events = [
      event('2026-08-05T06:00:00.000Z'), // past
      event('2026-08-06T09:00:00.000Z'),
      event('2026-08-06T18:00:00.000Z'),
      event('2026-08-07T09:00:00.000Z'),
    ];
    const lateNight = new Date('2026-08-06T06:30:00.000Z'); // 23:30 Pacific on the 5th
    const picked = selectUpcomingClasses(events, 'America/Los_Angeles', 2, lateNight);
    expect(picked.map((e) => e.start_date)).toEqual([
      '2026-08-06T09:00:00.000Z',
      '2026-08-06T18:00:00.000Z',
    ]);
  });
});

/**
 * The day strip's calendar and the daypart grouping. Wall-clock rules throughout: a slot's hour
 * is read with the UTC accessor, and the strip's "today" is the STUDIO's today.
 */
import type { AvailabilitySlot } from '@/api/schemas/appointments';

import { bookableDays, groupSlotsByDaypart } from '../slots';

function slot(startTime: string): AvailabilitySlot {
  return { start_time: startTime } as AvailabilitySlot;
}

describe('bookableDays', () => {
  // 11 PM Aug 16 in New York is already Aug 17 in UTC — the classic boundary.
  const LATE_EVENING_NY = new Date('2026-08-17T03:00:00.000Z');

  it("starts on the STUDIO's today, not the device's or UTC's", () => {
    const days = bookableDays('America/New_York', 30, LATE_EVENING_NY);
    expect(days[0].date).toBe('2026-08-16');
    expect(days[0].isToday).toBe(true);
    expect(days[1].isToday).toBe(false);
  });

  it('runs the studio-configured window, clamped to something renderable', () => {
    expect(bookableDays('America/New_York', 30, LATE_EVENING_NY)).toHaveLength(30);
    expect(bookableDays('America/New_York', null, LATE_EVENING_NY)).toHaveLength(30);
    expect(bookableDays('America/New_York', 500, LATE_EVENING_NY)).toHaveLength(60);
    expect(bookableDays('America/New_York', 0, LATE_EVENING_NY)).toHaveLength(30);
  });

  it('labels come from the shared schedule labeller — consecutive dates, no skips', () => {
    const days = bookableDays('America/New_York', 5, LATE_EVENING_NY);
    expect(days.map((day) => day.date)).toEqual([
      '2026-08-16',
      '2026-08-17',
      '2026-08-18',
      '2026-08-19',
      '2026-08-20',
    ]);
    expect(days[0].weekdayLabel).toBe('SUN');
    expect(days[0].monthLabel).toBe('August 2026');
  });
});

describe('groupSlotsByDaypart', () => {
  it('cuts at noon and 5pm on the stored wall clock, sections in time order', () => {
    const groups = groupSlotsByDaypart([
      slot('2026-08-20T17:30:00.000Z'),
      slot('2026-08-20T09:00:00.000Z'),
      slot('2026-08-20T11:59:00.000Z'),
      slot('2026-08-20T12:00:00.000Z'),
      slot('2026-08-20T16:59:00.000Z'),
      slot('2026-08-20T17:00:00.000Z'),
    ]);

    expect(groups.map((group) => group.key)).toEqual(['morning', 'afternoon', 'evening']);
    expect(groups[0].slots.map((row) => row.start_time)).toEqual([
      '2026-08-20T09:00:00.000Z',
      '2026-08-20T11:59:00.000Z',
    ]);
    expect(groups[1].slots.map((row) => row.start_time)).toEqual([
      '2026-08-20T12:00:00.000Z',
      '2026-08-20T16:59:00.000Z',
    ]);
    expect(groups[2].slots.map((row) => row.start_time)).toEqual([
      '2026-08-20T17:00:00.000Z',
      '2026-08-20T17:30:00.000Z',
    ]);
  });

  it('omits an empty section entirely — a heading with no answers under it is noise', () => {
    const groups = groupSlotsByDaypart([slot('2026-08-20T18:00:00.000Z')]);
    expect(groups.map((group) => group.key)).toEqual(['evening']);
  });

  it('drops a slot whose time cannot be parsed — a chip that cannot say when it is cannot be booked', () => {
    expect(groupSlotsByDaypart([slot('garbage')])).toEqual([]);
  });

  it('empty in, empty out', () => {
    expect(groupSlotsByDaypart([])).toEqual([]);
  });
});

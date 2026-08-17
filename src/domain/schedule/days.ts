/**
 * The schedule, cut into the studio's own days.
 *
 * PURE TypeScript. "Which day is this class on" is a question about the studio's calendar, not
 * the device's — a 9pm Pacific class is already tomorrow in UTC, and a phone in London looking at
 * a New York studio must still agree with the studio about what Tuesday means.
 */
import type { ScheduleEvent } from '@/api/schemas/schedule';
import { formatStoredTime, hoursUntilStoredTime, studioNow } from '@/domain/time/studio-now';

import { isPublicClass } from './select';

export interface ScheduleDay {
  /** `YYYY-MM-DD` in the studio's clock. The stable key, and what a route param carries. */
  date: string;
  /** 'TUE' — the day strip's top line. */
  weekdayLabel: string;
  /** '5' — the day strip's numeral. */
  dayOfMonth: string;
  /** 'Tuesday, August 5' — the heading and the class-detail back link. */
  longLabel: string;
  /** 'August 2026' — the strip's own heading. See `monthLabelFor` for why it is load-bearing. */
  monthLabel: string;
  isToday: boolean;
  events: ScheduleEvent[];
}

/** The `YYYY-MM-DD` of a stored wall-clock string, without a round trip through Date. */
export function storedDate(storedTime: string): string {
  return storedTime.slice(0, 10);
}

/**
 * Render a `YYYY-MM-DD` as if it were a stored time, so the labels come out in the studio's
 * calendar rather than the device's. Noon avoids any chance of a boundary rounding to the
 * neighbouring day.
 *
 * Exported for the appointment flow's day strip, which builds its days from a date RANGE rather
 * than from events — the labels must come from one place or the two strips drift.
 */
export function labelsFor(date: string) {
  const midday = `${date}T12:00:00.000Z`;
  return {
    weekdayLabel: formatStoredTime(midday, { weekday: 'short' }).toUpperCase(),
    dayOfMonth: formatStoredTime(midday, { day: 'numeric' }),
    longLabel: formatStoredTime(midday, { weekday: 'long', month: 'long', day: 'numeric' }),
    monthLabel: formatStoredTime(midday, { month: 'long', year: 'numeric' }),
  };
}

/**
 * Which month the strip is showing — and it is not decoration.
 *
 * The strip runs past the end of a month, so without this it reads `… 18 · 19 · 2 · 8 · 9`, which
 * looks like a broken sort. Those are September dates; naming the month is what makes the sequence
 * legible. Reported on device 2026-08-07.
 *
 * Derived from the SELECTED day rather than the first, so scrolling into September relabels the
 * header instead of leaving it stuck on August.
 */
export function monthLabelFor(days: ScheduleDay[], selectedDate: string | null): string {
  const active = days.find((day) => day.date === selectedDate) ?? days[0];
  return active?.monthLabel ?? '';
}

/**
 * Every day that has at least one class still to come, in order.
 *
 * Days with nothing left are omitted rather than rendered empty: a day strip with dead entries
 * invites taps that go nowhere, and the studio's real answer to "what about Sunday" is that
 * there is nothing on Sunday.
 */
export function groupByStudioDay(
  events: ScheduleEvent[],
  timeZone: string,
  now: Date = new Date(),
): ScheduleDay[] {
  const today = studioNow(timeZone, now).toISOString().slice(0, 10);

  const byDate = new Map<string, ScheduleEvent[]>();
  for (const event of events) {
    if (!isPublicClass(event)) continue;
    // Already started means unbookable, and an unbookable row wearing an "Open" tag is a lie.
    if (hoursUntilStoredTime(event.start_date, timeZone, now) < 0) continue;

    const date = storedDate(event.start_date);
    const bucket = byDate.get(date);
    if (bucket) bucket.push(event);
    else byDate.set(date, [event]);
  }

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayEvents]) => ({
      date,
      ...labelsFor(date),
      isToday: date === today,
      events: dayEvents.sort((a, b) => a.start_date.localeCompare(b.start_date)),
    }));
}

/**
 * Fill the gaps between the days that have classes, so the strip shows a real calendar.
 *
 * `groupByStudioDay` returns only days with something on them, which is right for a LIST — there
 * is nothing to render for an empty day. It is wrong for the day STRIP: dropping Sunday makes the
 * numerals jump `8 · 10`, and a strip that skips looks broken rather than empty. So the strip gets
 * every day in the range and renders the empty ones dimmed.
 *
 * They stay tappable on purpose. A dimmed day that refuses the tap is a dead control; one that
 * opens onto "nothing scheduled" has answered the question the client asked.
 *
 * Capped at `maxDays` so a studio publishing months ahead cannot generate an unbounded strip.
 */
export function fillEmptyDays(days: ScheduleDay[], maxDays = 60): ScheduleDay[] {
  if (days.length === 0) return days;

  const byDate = new Map(days.map((day) => [day.date, day]));
  const filled: ScheduleDay[] = [];
  // Midday, so adding whole days can never trip over a DST boundary into the previous date.
  const cursor = new Date(`${days[0].date}T12:00:00.000Z`);
  const last = new Date(`${days[days.length - 1].date}T12:00:00.000Z`);

  while (cursor.getTime() <= last.getTime() && filled.length < maxDays) {
    const date = cursor.toISOString().slice(0, 10);
    filled.push(
      byDate.get(date) ?? {
        date,
        ...labelsFor(date),
        // An invented day is never "today" in any sense that matters — if today had classes it
        // came from the real list, and if it did not, nothing should be highlighted.
        isToday: false,
        events: [],
      },
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return filled;
}

/** Find one event across the whole window. Class detail is routed by id, not by day. */
export function findEvent(events: ScheduleEvent[], eventId: number): ScheduleEvent | null {
  return events.find((event) => event.eventid === eventId) ?? null;
}

/** The long label for one stored time — the class-detail back link ("← Tuesday, August 5"). */
export function longDayLabel(storedTime: string): string {
  return labelsFor(storedDate(storedTime)).longLabel;
}

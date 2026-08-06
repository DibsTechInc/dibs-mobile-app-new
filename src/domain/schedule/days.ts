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
 */
function labelsFor(date: string) {
  const midday = `${date}T12:00:00.000Z`;
  return {
    weekdayLabel: formatStoredTime(midday, { weekday: 'short' }).toUpperCase(),
    dayOfMonth: formatStoredTime(midday, { day: 'numeric' }),
    longLabel: formatStoredTime(midday, { weekday: 'long', month: 'long', day: 'numeric' }),
  };
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

/** Find one event across the whole window. Class detail is routed by id, not by day. */
export function findEvent(events: ScheduleEvent[], eventId: number): ScheduleEvent | null {
  return events.find((event) => event.eventid === eventId) ?? null;
}

/** The long label for one stored time — the class-detail back link ("← Tuesday, August 5"). */
export function longDayLabel(storedTime: string): string {
  return labelsFor(storedDate(storedTime)).longLabel;
}

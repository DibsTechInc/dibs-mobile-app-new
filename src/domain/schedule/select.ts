/**
 * Which of the studio's sessions belong on a given surface.
 *
 * PURE TypeScript. Selection is separated from presentation (`entry.ts`) because every screen
 * renders the same entry shape but asks a different question of the same list: Home asks
 * "what is left today", the schedule screen asks "what is on this day".
 */
import type { ScheduleEvent } from '@/api/schemas/schedule';
import { hoursUntilStoredTime, studioNow } from '@/domain/time/studio-now';

/**
 * Drop everything the class surface should never show.
 *
 * `get-schedule` is shared with the widget and returns whatever the studio has on the calendar,
 * including one-to-one appointments and on-demand content. A classes build renders neither:
 *  • `eventtype: 'appt'` — appointments are out of v1 entirely (§0.1-B);
 *  • `private` — a booked private session is somebody else's, not an offer;
 *  • `on_demand` — library content, not a session with a start time.
 */
export function isPublicClass(event: ScheduleEvent): boolean {
  if (event.eventtype === 'appt') return false;
  if (event.private === true) return false;
  if (event.on_demand === true) return false;
  return true;
}

/** The `YYYY-MM-DD` of a stored wall-clock string, without parsing it back through a Date. */
function storedDatePart(storedTime: string): string {
  return storedTime.slice(0, 10);
}

/**
 * Today's remaining classes, in the studio's own clock.
 *
 * "Remaining" is deliberate — a class that started ten minutes ago cannot be booked, and Home's
 * empty state reads "Nothing left today." Showing an unbookable row would be a dead end wearing
 * an Open tag.
 *
 * `now` is injectable so tests can pin a moment; production always passes the real one.
 */
export function selectTodaysClasses(
  events: ScheduleEvent[],
  timeZone: string,
  now: Date = new Date(),
): ScheduleEvent[] {
  const today = storedDatePart(studioNow(timeZone, now).toISOString());
  return events
    .filter(
      (event) =>
        isPublicClass(event) &&
        storedDatePart(event.start_date) === today &&
        hoursUntilStoredTime(event.start_date, timeZone, now) >= 0,
    )
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
}

/**
 * The next N classes from now on, whatever day they fall on.
 *
 * Home falls back to this when today is over. An empty screen at 8pm is a worse answer than
 * "here is what's next", and it keeps a real next action on the screen at every hour of the day
 * — the alternative is an empty state whose only button leads somewhere that does not exist yet.
 *
 * Sorted here rather than trusting the response: the backend does order by `start_date`, but a
 * screen that silently depends on someone else's ORDER BY breaks quietly when it changes.
 */
export function selectUpcomingClasses(
  events: ScheduleEvent[],
  timeZone: string,
  limit: number,
  now: Date = new Date(),
): ScheduleEvent[] {
  return events
    .filter(
      (event) => isPublicClass(event) && hoursUntilStoredTime(event.start_date, timeZone, now) >= 0,
    )
    .sort((a, b) => a.start_date.localeCompare(b.start_date))
    .slice(0, limit);
}

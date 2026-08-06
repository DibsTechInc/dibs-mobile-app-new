/**
 * Which of a client's bookings is "your next class".
 *
 * PURE TypeScript. The whole question is a time comparison, which is precisely the arithmetic
 * that must happen in the studio's frame rather than the device's — a phone in London looking at
 * a New York studio would otherwise disagree with the studio about what is still to come.
 */
import type { UpcomingBookingRow } from '@/api/schemas/upcoming';
import { formatInstructorName } from '@/domain/schedule/entry';
import { hoursUntilStoredTime } from '@/domain/time/studio-now';

import type { UpcomingBooking } from '@/domain/home/build-home-data';
import { describeBookingDay } from '@/domain/home/build-home-data';

export interface SelectNextBookingOptions {
  timeZone: string;
  showInstructor: boolean;
  now?: Date;
}

/**
 * The soonest booking that has not started, or null.
 *
 * The endpoint returns everything from the start of today onwards, so this morning's class is in
 * the list at 6pm. "Next" means next, not "first row".
 */
export function selectNextBooking(
  rows: UpcomingBookingRow[],
  { timeZone, showInstructor, now = new Date() }: SelectNextBookingOptions,
): UpcomingBooking | null {
  const next = rows
    .filter(
      (row): row is UpcomingBookingRow & { start_date: string; eventid: number } =>
        typeof row.start_date === 'string' &&
        typeof row.eventid === 'number' &&
        // A dropped booking is a cancellation. It stays in the table; it is not upcoming.
        row.dropped !== true &&
        hoursUntilStoredTime(row.start_date, timeZone, now) >= 0,
    )
    .sort((a, b) => a.start_date.localeCompare(b.start_date))[0];

  if (!next) return null;

  return {
    eventId: next.eventid,
    startsAt: next.start_date,
    name: (next.name ?? next.classtitle ?? 'Your booking').trim(),
    instructor: showInstructor
      ? formatInstructorName(next.instructor?.firstname, next.instructor?.lastname)
      : null,
    locationLabel: next.location?.locationName?.trim() || null,
    whenLabel: describeBookingDay(next.start_date, timeZone, now),
  };
}

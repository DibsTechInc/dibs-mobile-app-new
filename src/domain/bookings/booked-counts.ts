/**
 * "Am I already in this class, and how many spots do I hold?" — pure, one owner, read by the
 * schedule row, class detail and the cart. A COUNT, not a boolean: a client can hold two spots.
 */
import type { UpcomingBookingRow } from '@/api/schemas/upcoming';

/** Event id → how many live spots this client holds in it. A missing id means "not booked". */
export type BookedCounts = ReadonlyMap<number, number>;

export const NO_BOOKINGS: BookedCounts = new Map();

/** @param bookings the client's UPCOMING bookings only — a class attended last week says nothing. */
export function buildBookedCounts(bookings: UpcomingBookingRow[] | undefined | null): BookedCounts {
  const counts = new Map<number, number>();
  if (!bookings) return counts;

  for (const booking of bookings) {
    if (booking.dropped === true) continue;
    const eventId = booking.eventid;
    if (typeof eventId !== 'number' || !Number.isFinite(eventId)) continue;
    counts.set(eventId, (counts.get(eventId) ?? 0) + 1);
  }

  return counts;
}

/** How many spots the client holds in one class. Zero when they hold none. */
export function bookedSpotsFor(counts: BookedCounts | undefined, eventId: number): number {
  return counts?.get(eventId) ?? 0;
}

/** Null at zero so callers render nothing; the singular drops the number ("Booked", not "1 spot"). */
export function bookedSpotsLabel(spots: number): string | null {
  if (spots < 1) return null;
  return spots === 1 ? 'Booked' : `${spots} spots booked`;
}

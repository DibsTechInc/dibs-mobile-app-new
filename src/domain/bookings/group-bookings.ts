/**
 * The client's bookings, split into what is still to come and what already happened.
 *
 * PURE TypeScript, for the same reason `select-next-booking.ts` is: every question here is a time
 * comparison, and a time comparison against stored wall-clock has to happen in the STUDIO's frame.
 * A phone in London looking at a New York studio must agree with the studio about what is upcoming.
 *
 * ── Why this is not just a `.filter()` at the screen ────────────────────────────────────────
 * `POST /get-upcoming-appts` returns TWO arrays and neither means what its name promises.
 * `upcomingAppts` runs from the start of the studio's today, so this morning's 6am class is still
 * in it at 9pm. And a booking the client cancelled stays in the table with `dropped: true` rather
 * than disappearing. So "upcoming" is neither array as given: it is rows that have not started AND
 * were not cancelled. Screens that answer that inline get it subtly wrong.
 */
import type { UpcomingBookingRow } from '@/api/schemas/upcoming';
import { describeBookingDay } from '@/domain/home/build-home-data';
import { formatInstructorName } from '@/domain/schedule/entry';
import { formatStoredTime, hoursUntilStoredTime } from '@/domain/time/studio-now';

export interface BookingListItem {
  eventId: number;
  /** Stored wall-clock, carried verbatim so the screen never re-derives a time. */
  startsAt: string;
  name: string;
  instructor: string | null;
  locationLabel: string | null;
  /** "Today" / "Tomorrow" / "Fri, Aug 8". */
  whenLabel: string;
  /** "6:30 PM". */
  timeLabel: string;
  /**
   * The pass or package this booking drew on — "10-class package", "Drop In".
   *
   * Null rather than a placeholder when the backend omits it, which it does for some legacy rows.
   * A row that invents "Drop In" for an unknown payment is lying about the client's money.
   */
  paidWithLabel: string | null;
  /** The client cancelled this one. Kept in history; never counted as upcoming. */
  isCancelled: boolean;
  /** The studio marked them present. Only ever meaningful on a past booking. */
  didAttend: boolean;
}

export interface GroupedBookings {
  /** Not started, not cancelled. Soonest first — the next thing you have to be somewhere for. */
  upcoming: BookingListItem[];
  /** Already started, or cancelled. Most recent first. */
  past: BookingListItem[];
}

export interface GroupBookingsOptions {
  timeZone: string;
  showInstructor: boolean;
  now?: Date;
}

/** A row is only usable if it can be placed in time and identified. */
function isRenderable(
  row: UpcomingBookingRow,
): row is UpcomingBookingRow & { start_date: string; eventid: number } {
  return typeof row.start_date === 'string' && typeof row.eventid === 'number';
}

function toItem(
  row: UpcomingBookingRow & { start_date: string; eventid: number },
  { timeZone, showInstructor, now }: Required<GroupBookingsOptions>,
): BookingListItem {
  return {
    eventId: row.eventid,
    startsAt: row.start_date,
    name: (row.name ?? row.classtitle ?? 'Your booking').trim(),
    instructor: showInstructor
      ? formatInstructorName(row.instructor?.firstname, row.instructor?.lastname)
      : null,
    locationLabel: row.location?.locationName?.trim() || null,
    whenLabel: describeBookingDay(row.start_date, timeZone, now),
    timeLabel: formatStoredTime(row.start_date),
    paidWithLabel: row.serviceName?.trim() || null,
    isCancelled: row.dropped === true,
    didAttend: row.checkedin === true,
  };
}

/**
 * Split every booking the endpoint returned into upcoming and past.
 *
 * Takes both arrays because the split that matters is not the one the API drew. Rows are deduped
 * on (eventId, startsAt): the two arrays are assembled by separate queries in
 * `add-data-to-appts.js` and a session sitting on the boundary of the studio's today can appear in
 * both, which would otherwise render the same class twice in one list.
 */
export function groupBookings(
  rows: {
    upcomingAppts?: UpcomingBookingRow[] | null;
    previousAppts?: UpcomingBookingRow[] | null;
  },
  { timeZone, showInstructor, now = new Date() }: GroupBookingsOptions,
): GroupedBookings {
  const seen = new Set<string>();
  const items: BookingListItem[] = [];

  for (const row of [...(rows.upcomingAppts ?? []), ...(rows.previousAppts ?? [])]) {
    if (!isRenderable(row)) continue;
    const key = `${row.eventid}@${row.start_date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(toItem(row, { timeZone, showInstructor, now }));
  }

  const upcoming: BookingListItem[] = [];
  const past: BookingListItem[] = [];

  for (const item of items) {
    const stillToCome = !item.isCancelled && hoursUntilStoredTime(item.startsAt, timeZone, now) >= 0;
    (stillToCome ? upcoming : past).push(item);
  }

  upcoming.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  past.sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  return { upcoming, past };
}

export interface BookingDaySection {
  /** "Today" / "Tomorrow" / "Fri, Aug 15". */
  label: string;
  bookings: BookingListItem[];
}

/**
 * Upcoming bookings under one heading per day.
 *
 * Sectioned on the DATE, then labelled from the first booking's `whenLabel` — not grouped by the
 * label itself. The labels are relative ("Today", "Tomorrow"), and grouping by a relative string
 * would silently merge two different days the moment two of them shared wording, which is exactly
 * what happens on any date past the next week where the label falls back to a weekday.
 *
 * Input is assumed already sorted, which `groupBookings` guarantees; the sections come out in the
 * same order without a second sort.
 */
export interface NextUpSplit {
  /** The very next thing the client has to be somewhere for. Null when nothing is upcoming. */
  next: BookingListItem | null;
  /** Everything after it, still grouped by day. The day `next` is on keeps its other bookings. */
  rest: BookingDaySection[];
}

/**
 * Lift the next booking out of the sections.
 *
 * My Calendar gives it an editorial treatment of its own — the time set large, the day named in
 * words — because "where do I have to be next" is the question the screen exists to answer, and
 * making somebody read it out of row one of a list is making them do the work.
 *
 * It is REMOVED from the list rather than repeated in it. A hero above a list whose first row is
 * the same booking reads as a rendering bug, and the client counts their classes wrong.
 *
 * A day that had only the next booking on it disappears from `rest` entirely — an empty day header
 * is a heading with nothing under it.
 */
export function splitNextUp(sections: BookingDaySection[]): NextUpSplit {
  const next = sections[0]?.bookings[0] ?? null;
  if (!next) return { next: null, rest: [] };

  const rest = sections
    .map((section, index) =>
      index === 0 ? { ...section, bookings: section.bookings.slice(1) } : section,
    )
    .filter((section) => section.bookings.length > 0);

  return { next, rest };
}

export function toDaySections(upcoming: BookingListItem[]): BookingDaySection[] {
  const sections: BookingDaySection[] = [];
  let currentDate: string | null = null;

  for (const booking of upcoming) {
    const date = booking.startsAt.slice(0, 10);
    if (date !== currentDate) {
      currentDate = date;
      sections.push({ label: booking.whenLabel, bookings: [booking] });
    } else {
      sections[sections.length - 1].bookings.push(booking);
    }
  }

  return sections;
}

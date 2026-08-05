/**
 * What Home renders. Deliberately a narrow, presentational shape rather than raw API payloads.
 *
 * P1 fills these from `get-schedule` and the account endpoints; keeping the screen decoupled
 * from the wire format means a backend field rename cannot reach into the layout, and the
 * screen can be reviewed before the endpoints are wired.
 *
 * Every time here is a STORED wall-clock string (studio time labelled UTC). Render it with
 * `formatStoredTime`; do any past/upcoming maths through `studioNow`. Never `new Date()`.
 */

export interface ScheduleEntry {
  eventId: number;
  /** Stored wall-clock ISO string. */
  startsAt: string;
  name: string;
  /** Null when the studio hides instructor names, or the class genuinely has none. */
  instructor: string | null;
  durationMinutes: number | null;
  /** Remaining capacity. Null when the studio does not publish it. */
  spotsLeft: number | null;
  isFull: boolean;
  hasWaitlist: boolean;
  /** What this costs the client: an entitlement, or a price. */
  price:
    | { kind: 'covered'; label: string }
    | { kind: 'amount'; amountLabel: string }
    | { kind: 'unknown' };
}

export interface UpcomingBooking {
  eventId: number;
  startsAt: string;
  name: string;
  instructor: string | null;
  locationLabel: string | null;
}

export interface HomeData {
  /** First name only. Null while the client is browsing signed out. */
  firstName: string | null;
  /** The studio's own display name, from get-basic-config. */
  studioName: string;
  /** Today in the STUDIO's clock, already formatted. */
  todayLabel: string;
  heroUri: string | null;
  nextBooking: UpcomingBooking | null;
  todaysClasses: ScheduleEntry[];
  /** False when the studio is offboarded or in soft lockout — booking CTAs come down. */
  acceptingBookings: boolean;
}

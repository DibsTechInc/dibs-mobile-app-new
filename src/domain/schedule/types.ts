/**
 * The view model for one bookable session.
 *
 * Deliberately NOT the wire shape. `get-schedule` returns raw Sequelize rows whose column names
 * and nullability are backend implementation detail; screens render this instead, so a column
 * rename cannot reach into a layout and so a screen can be reviewed before its endpoint exists.
 *
 * Every time on it is a STORED wall-clock string (studio time wearing a Z). Render with
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

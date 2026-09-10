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
  /**
   * A pass the client holds that the studio's package allowlist turns away from THIS class —
   * named, so class detail and the cart can say why a usually-covering pass is not covering,
   * instead of silently pricing the class (which reads as the app losing the membership).
   * Null when a pass covers, when nothing was excluded, or when we have no pass data.
   */
  excludedPassName: string | null;
  /**
   * The studio's first-class price on THIS row (client-agnostic, from the feed). "$15" — cents
   * dropped when there are none. Null when the studio's price does not beat this class. A screen
   * shows it ONLY when the offer endpoint also says this client is eligible.
   */
  firstClassPriceLabel: string | null;
}

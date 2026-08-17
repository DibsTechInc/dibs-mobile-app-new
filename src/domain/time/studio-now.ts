/**
 * The canonical time helpers for a platform that stores studio wall-clock times labelled UTC.
 *
 * PURE TypeScript. See `docs/time-semantics.md` for the field-by-field classification, and
 * MOBILE_MASTER_PLAN §3.7 for why this module exists at all.
 *
 * ── The problem, stated once ────────────────────────────────────────────────────────────────
 * Dibs stores a 6:00pm class at a New York studio as `2026-08-05T18:00:00.000Z`. That is NOT
 * 18:00 UTC — it is 18:00 *in the studio's own clock*, wearing a Z. Call this the **fake-UTC
 * frame**. The convention is fine for display (print the stored hour, done) and lethal for
 * arithmetic, because `Date.now()` is a real instant in a different frame. Comparing the two
 * is wrong by the studio's UTC offset: 4 hours in New York, 7–8 in California. That is more
 * than enough to classify an early cancel as late and charge somebody for it.
 *
 * ── The rule ────────────────────────────────────────────────────────────────────────────────
 * NEVER compare a stored time against `Date.now()`. Compare it against `studioNow(tz)`, which
 * re-encodes the present moment into the same fake-UTC frame the stored times live in. Then
 * both sides speak the same language and subtraction means something.
 *
 * Exactly one function here crosses back into real time: `toRealInstant`, for device-calendar
 * inserts. Do not add a second without reading §3.7.
 */

/** A Date whose UTC fields carry a studio wall-clock reading. Never a real instant. */
export type FakeUtcDate = Date;

export const MS_PER_HOUR = 3_600_000;

interface WallClockParts {
  year: number;
  month: number; // 1-12
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * Read the wall-clock reading in `timeZone` at a real instant.
 *
 * Uses Intl with an explicit timeZone, so the device's own timezone never participates. A
 * helper built on local-time getters would produce different answers on a phone in Denver than
 * on one in London, which is precisely the class of bug this module exists to prevent.
 */
function wallClockPartsIn(timeZone: string, instant: Date): WallClockParts {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const found = parts.find((p) => p.type === type);
    if (!found) throw new Error(`Intl did not return a "${type}" part for zone "${timeZone}"`);
    return Number(found.value);
  };

  // Intl renders midnight as hour 24 in some environments; normalize it to 0.
  const hour = get('hour');
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: hour === 24 ? 0 : hour,
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * "Now", expressed in the same fake-UTC frame as stored event times.
 *
 * This is the ONLY acceptable left-hand side for any comparison against `start_date`,
 * `end_date`, `visitDate`, or any other wall-clock field.
 *
 * @param timeZone the studio's IANA zone (`timezone` from get-basic-config, `mainTZ` in the DB)
 * @param now      inject a real instant in tests; defaults to the actual present
 */
export function studioNow(timeZone: string, now: Date = new Date()): FakeUtcDate {
  const { year, month, day, hour, minute, second } = wallClockPartsIn(timeZone, now);
  return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
}

/**
 * Parse a stored wall-clock timestamp into the fake-UTC frame.
 *
 * Stored values already arrive in that frame, so this is mostly a validating parse. It exists
 * so call sites read as a deliberate frame declaration rather than a bare `new Date(...)`,
 * which is indistinguishable from parsing a real instant.
 */
export function parseStoredTime(value: string | Date): FakeUtcDate {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Not a parseable stored timestamp: ${String(value)}`);
  }
  return date;
}

/**
 * Hours from now until a stored time, positive for the future and negative for the past.
 *
 * This is the number every cancellation window compares against: "12 hours of notice required"
 * means `hoursUntilStoredTime(...) >= 12`.
 */
export function hoursUntilStoredTime(
  storedTime: string | Date,
  timeZone: string,
  now: Date = new Date(),
): number {
  const target = parseStoredTime(storedTime);
  return (target.getTime() - studioNow(timeZone, now).getTime()) / MS_PER_HOUR;
}

/** Has this stored time already passed, in the studio's own clock? */
export function isStoredTimeInPast(
  storedTime: string | Date,
  timeZone: string,
  now: Date = new Date(),
): boolean {
  return hoursUntilStoredTime(storedTime, timeZone, now) < 0;
}

/**
 * Does this booking still meet the studio's notice requirement?
 *
 * @param noticeHours the studio's configured window — `defaultCancelTimeGroup` for classes,
 *                    `defaultCancelTimePrivate` for appointments,
 *                    `defaultCancelTimeSubscription` for subscription sessions.
 * @returns true when the cancel is EARLY (entitlement returned), false when LATE.
 *
 * Boundary rule: exactly at the window counts as early. The widget's determination is the
 * reference; a booking cancelled at precisely the notice threshold is not penalised.
 */
export function isEarlyCancel(
  storedTime: string | Date,
  timeZone: string,
  noticeHours: number,
  now: Date = new Date(),
): boolean {
  return hoursUntilStoredTime(storedTime, timeZone, now) >= noticeHours;
}

/**
 * ⚠️ THE ONE SANCTIONED CONVERSION OUT OF THE FAKE-UTC FRAME (MOBILE_MASTER_PLAN §3.7).
 *
 * A device calendar entry needs a real instant. Reconstruct it by reading the stored value's
 * UTC fields as a wall clock and asking what real moment that was in the studio's zone.
 *
 * Without this, a 6:00pm New York class saved from a phone in California lands at 6:00pm
 * Pacific — three hours late — and even a phone already in New York gets shifted, because the
 * OS interprets the stored Z literally.
 *
 * Implemented by search rather than by an offset lookup: an offset is itself a function of the
 * instant, so "apply the offset" is circular across a DST boundary. Two probes converge for
 * every real zone, including half-hour and 45-minute offsets.
 */
export function toRealInstant(storedTime: string | Date, timeZone: string): Date {
  const wall = parseStoredTime(storedTime);
  const targetUtcMs = wall.getTime();

  // First guess: pretend the stored reading IS the real instant, then correct by however far
  // its wall clock in the studio zone lands from the reading we wanted.
  let guess = new Date(targetUtcMs);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const seenAsWall = studioNow(timeZone, guess).getTime();
    const drift = targetUtcMs - seenAsWall;
    if (drift === 0) return guess;
    guess = new Date(guess.getTime() + drift);
  }
  return guess;
}

/**
 * Format a stored time for display: the stored reading, verbatim, never device-converted.
 *
 * Reads the UTC fields deliberately — that is where the studio's wall clock lives.
 */
export function formatStoredTime(
  storedTime: string | Date,
  options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' },
  locale = 'en-US',
): string {
  const date = parseStoredTime(storedTime);
  // Forcing timeZone: 'UTC' is what makes this verbatim — it prints the stored fields as-is.
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
}

/**
 * Format a REAL INSTANT as the studio would read it off its own wall.
 *
 * ⚠️ Not for stored class times. Those are wall-clock readings wearing a Z and are printed
 * verbatim by `formatStoredTime`. This is for the handful of values that are genuine instants —
 * `passes.expiresAt` above all.
 *
 * A pass expiry is written as `moment().tz(studio.mainTZ).endOf('day').add(…)` (dibs-api
 * `database/models/passes.js`), which is a true UTC instant: end of day in Los Angeles is
 * `07:59:59Z` the FOLLOWING day. So both of the app's usual habits are wrong here —
 *
 *   • verbatim-UTC would print **Dec 1** for a pass the client's studio says expires Nov 30;
 *   • device-local would print Nov 30 at home and Dec 1 from a phone in London.
 *
 * Reading it back in the studio's zone is the only rendering that says the same thing the studio
 * says, from anywhere on earth.
 */
export function formatInstantInStudioZone(
  instant: string | Date,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
  locale = 'en-US',
): string {
  const date = typeof instant === 'string' ? new Date(instant) : instant;
  return new Intl.DateTimeFormat(locale, { ...options, timeZone }).format(date);
}

/**
 * "in 2 hours" / "in 3 days" / "started 20 minutes ago", computed in the studio's frame.
 * Returns null past a week out, where a relative phrase stops being useful.
 */
export function describeTimeUntil(
  storedTime: string | Date,
  timeZone: string,
  now: Date = new Date(),
): string | null {
  const hours = hoursUntilStoredTime(storedTime, timeZone, now);
  const abs = Math.abs(hours);
  if (abs > 24 * 7) return null;

  const past = hours < 0;
  const phrase = (value: number, unit: string): string => {
    const rounded = Math.round(value);
    const plural = rounded === 1 ? unit : `${unit}s`;
    return past ? `${rounded} ${plural} ago` : `in ${rounded} ${plural}`;
  };

  if (abs < 1 / 60) return past ? 'just now' : 'now';
  if (abs < 1) return phrase(abs * 60, 'minute');
  if (abs < 24) return phrase(abs, 'hour');
  return phrase(abs / 24, 'day');
}

/** Month names for `formatIsoDate`. Hand-rolled for the same reason the widget's are: */
const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec',
] as const;

/**
 * Render a bare `YYYY-MM-DD` as "Nov 2, 2026" — WITHOUT ever constructing a Date.
 *
 * `new Date('2026-11-03')` is parsed as UTC midnight, so `.toLocaleDateString()` renders it as
 * Nov 2 in every negative-offset timezone — which is every Dibs studio. The server already
 * resolved this date in the studio's frame; the app's only job is to print the parts it was
 * given. Parsing it back into an instant is the entire bug class.
 *
 * `Sept` rather than `Sep`, matching the widget's table — `toLocaleDateString({month:'short'})`
 * gives "Sep", which is why that table is hand-rolled there too.
 *
 * @returns null for anything that is not a well-formed date string, so a caller renders nothing
 *          rather than "Invalid Date".
 */
export function formatIsoDate(isoDate: string | null | undefined, withYear = true): string | null {
  if (typeof isoDate !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate.trim());
  if (!match) return null;

  const [, year, month, day] = match;
  const monthIndex = Number(month) - 1;
  if (monthIndex < 0 || monthIndex > 11) return null;

  const dayNumber = Number(day);
  if (dayNumber < 1 || dayNumber > 31) return null;

  return withYear
    ? `${MONTH_ABBR[monthIndex]} ${dayNumber}, ${year}`
    : `${MONTH_ABBR[monthIndex]} ${dayNumber}`;
}

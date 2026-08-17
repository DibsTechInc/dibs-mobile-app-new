/**
 * "Free to cancel until 6:00 AM tomorrow."
 *
 * PURE TypeScript. The studio's cancellation policy, stated as a moment the client can picture
 * rather than as a number of hours they have to do arithmetic on.
 *
 * ── The rule (`.claude/CANCELLATION.md` §3) ─────────────────────────────────────────────────
 * A studio stores a window in HOURS. A cancel is EARLY when it happens at least that many hours
 * before the session starts, and LATE otherwise — exactly at the boundary counts as early. Early
 * returns the entitlement; late does not.
 *
 * ── Why this is worth its own module ────────────────────────────────────────────────────────
 * The arithmetic is a subtraction, and the subtraction is the trap. Stored session times are
 * studio wall-clock wearing a Z, so the deadline has to be computed in that same frame and
 * compared against `studioNow` — never `Date.now()`. Getting it wrong is off by the studio's UTC
 * offset, which is four hours in New York and seven or eight in California: more than enough to
 * tell somebody a cancel is free when the backend is about to charge them for it.
 *
 * This is display copy, not an authorisation. The backend decides what a cancel actually costs.
 */
import { formatStoredTime, hoursUntilStoredTime, parseStoredTime, studioNow } from '@/domain/time/studio-now';

const MS_PER_HOUR = 3_600_000;

export interface CancelWindow {
  /** The studio's configured notice, in hours. */
  noticeHours: number;
  /** The deadline as a stored wall-clock ISO string, in the same frame as the session. */
  deadline: string;
  /** '6:00 AM tomorrow' / 'Tuesday at 6:00 AM' / '6:00 PM today'. */
  deadlineLabel: string;
  /** True while cancelling would still be free. */
  isStillFree: boolean;
}

/**
 * Where a deadline falls relative to the studio's today: 'today', 'tomorrow', or its weekday.
 *
 * Named days rather than dates because a deadline is something you plan around, and "Tuesday at
 * 6:00 AM" is easier to hold in your head than "8/5 at 6:00 AM". Past a week it falls back to a
 * date, where the weekday alone would be ambiguous.
 */
function describeDay(deadline: Date, timeZone: string, now: Date): string {
  const todayMs = studioNow(timeZone, now).setUTCHours(0, 0, 0, 0);
  const deadlineMs = new Date(deadline).setUTCHours(0, 0, 0, 0);
  const days = Math.round((deadlineMs - todayMs) / (24 * MS_PER_HOUR));

  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return 'yesterday';
  if (days > 1 && days < 7) return formatStoredTime(deadline, { weekday: 'long' });
  return formatStoredTime(deadline, { month: 'long', day: 'numeric' });
}

/**
 * The group-class notice window, in hours.
 *
 * MIRRORS the server's `resolveNoticeHours` (`class-drop/drop-class.js`) and the widget's
 * `indiClass.jsx` — group window first, the studio-level `cancelTime` as the fallback, 12 as the
 * column default. `||` rather than `??` so a 0 falls through, exactly as both do.
 *
 * The server decides what a cancel actually costs; this only decides what the client is TOLD it
 * will cost. They must agree, or the sheet names a deadline the backend does not honour.
 */
export function resolveClassNoticeHours(config: {
  defaultCancelTimeGroup?: number;
  cancelTime?: number;
} | null | undefined): number {
  return Number(config?.defaultCancelTimeGroup) || Number(config?.cancelTime) || 12;
}

/**
 * The cancellation deadline for one session.
 *
 * Returns null when the studio publishes no window — better to say nothing than to invent a
 * policy on their behalf.
 */
export function describeCancelWindow(
  startsAt: string,
  timeZone: string,
  noticeHours: number | null | undefined,
  now: Date = new Date(),
): CancelWindow | null {
  if (typeof noticeHours !== 'number' || !Number.isFinite(noticeHours) || noticeHours <= 0) {
    return null;
  }

  const deadline = new Date(parseStoredTime(startsAt).getTime() - noticeHours * MS_PER_HOUR);
  const day = describeDay(deadline, timeZone, now);
  const time = formatStoredTime(deadline, { hour: 'numeric', minute: '2-digit' });

  return {
    noticeHours,
    deadline: deadline.toISOString(),
    // "at" reads naturally before a named day but not before "today"/"tomorrow".
    deadlineLabel: day === 'today' || day === 'tomorrow' || day === 'yesterday'
      ? `${time} ${day}`
      : `${day} at ${time}`,
    // The boundary counts as early, matching the backend's own determination.
    isStillFree: hoursUntilStoredTime(startsAt, timeZone, now) >= noticeHours,
  };
}

/**
 * The whole sentence, ready to render.
 *
 * Two states, and they say materially different things — which is the point. A client deciding
 * whether to book at 9pm for a 7am class deserves to know the window has already closed on them
 * before they commit, not after.
 */
export function cancelWindowSentence(window: CancelWindow | null): string | null {
  if (!window) return null;
  const hours = `${window.noticeHours} hour${window.noticeHours === 1 ? '' : 's'} before class`;
  return window.isStillFree
    ? `Free to cancel until ${window.deadlineLabel} — ${hours}.`
    : `The free-cancellation window has passed. Cancelling now still frees your spot, but the class is not returned to your account.`;
}

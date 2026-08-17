/**
 * The slots screen's raw material: which days a client can ask about, and how one day's
 * openings group into dayparts.
 *
 * PURE TypeScript. Availability is fetched PER DAY (that is the endpoint's shape), so unlike the
 * class schedule the day strip cannot know which days have openings — it is a plain calendar of
 * the studio's bookable window, and every day is equally tappable. Same `labelsFor` as the
 * schedule strip so the two surfaces cannot disagree about what Tuesday is called.
 */
import type { AvailabilitySlot } from '@/api/schemas/appointments';
import { labelsFor } from '@/domain/schedule/days';
import { studioNow } from '@/domain/time/studio-now';

export interface BookableDay {
  /** `YYYY-MM-DD` in the studio's clock — the availability request's day. */
  date: string;
  weekdayLabel: string;
  dayOfMonth: string;
  longLabel: string;
  monthLabel: string;
  isToday: boolean;
}

/**
 * Today (the studio's today) through `windowDays` ahead.
 *
 * `windowDays` comes from the studio's `intervalEnd` config — the same window the widget's
 * calendar offers — clamped so a mis-set config cannot build a thousand-cell strip.
 */
export function bookableDays(
  timeZone: string,
  windowDays: number | null | undefined,
  now: Date = new Date(),
): BookableDay[] {
  const days = Math.min(Math.max(Math.trunc(windowDays ?? 30) || 30, 1), 60);
  const today = studioNow(timeZone, now).toISOString().slice(0, 10);

  const result: BookableDay[] = [];
  // Midday, so adding whole days can never trip a boundary into the neighbouring date.
  const cursor = new Date(`${today}T12:00:00.000Z`);
  for (let i = 0; i < days; i += 1) {
    const date = cursor.toISOString().slice(0, 10);
    result.push({ date, ...labelsFor(date), isToday: i === 0 });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

export type DaypartKey = 'morning' | 'afternoon' | 'evening';

export interface DaypartGroup {
  key: DaypartKey;
  /** Uppercase section label — 'MORNING'. */
  label: string;
  slots: AvailabilitySlot[];
}

/** The stored wall-clock hour of a slot, read with the UTC accessor — never device-local. */
function wallClockHour(slot: AvailabilitySlot): number {
  const parsed = new Date(slot.start_time);
  return Number.isNaN(parsed.getTime()) ? -1 : parsed.getUTCHours();
}

/**
 * One day's slots as MORNING / AFTERNOON / EVENING sections, in time order.
 *
 * A section with no openings is omitted entirely (the handoff's rule — an empty "EVENING"
 * heading is a question with no answer). Boundaries: morning < 12:00 ≤ afternoon < 17:00 ≤
 * evening. Slots whose time cannot be parsed are dropped — a chip that cannot say when it is
 * cannot be booked.
 */
export function groupSlotsByDaypart(slots: AvailabilitySlot[]): DaypartGroup[] {
  const buckets: Record<DaypartKey, AvailabilitySlot[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  for (const slot of slots) {
    const hour = wallClockHour(slot);
    if (hour < 0) continue;
    if (hour < 12) buckets.morning.push(slot);
    else if (hour < 17) buckets.afternoon.push(slot);
    else buckets.evening.push(slot);
  }

  const byTime = (a: AvailabilitySlot, b: AvailabilitySlot) =>
    a.start_time.localeCompare(b.start_time);

  return (
    [
      { key: 'morning' as const, label: 'MORNING', slots: buckets.morning.sort(byTime) },
      { key: 'afternoon' as const, label: 'AFTERNOON', slots: buckets.afternoon.sort(byTime) },
      { key: 'evening' as const, label: 'EVENING', slots: buckets.evening.sort(byTime) },
    ] satisfies DaypartGroup[]
  ).filter((group) => group.slots.length > 0);
}

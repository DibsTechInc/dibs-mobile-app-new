/**
 * The monthly-commitment date math (studio 263's "Lock in monthly").
 *
 * PURE TypeScript, ported from the widget so the two surfaces cannot bill differently:
 *  • `remainingWeeklyDatesInMonth`  ← `helpers/appointmentHelpers.js#getAllRemainingSessionDates`
 *  • `futureHoldSessions`           ← `prepareForCheckout.js#addFutureHoldSessions`
 *  • `nextMonthWeekdayCount`        ← `availableAppointmentsNew.jsx#getRemainingSessionsInMonth('next')`
 *
 * Everything here steps dates with the UTC accessors, because slot times are studio wall-clock
 * worn as UTC — `setUTCDate(+7)` moves exactly one week of wall-clock without any DST shear.
 * (The widget's `getRemainingSessionsInMonth` is the one local-time holdout in its flow; it only
 * feeds example copy there, and it is ported UTC-correct here so a device timezone can never
 * change a number we show. The widget's session LIST — the money — was already UTC.)
 *
 * The count these produce is the client's bill: booking Sat Aug 22 → Aug 22 + Aug 29 = two
 * sessions charged today; booking the 1st → five. That swing is why the toggle's caption spells
 * the dates out.
 */

/**
 * Every occurrence of `startIso`'s weekday from that date through the end of ITS month,
 * inclusive, as ISO strings (the first entry is `startIso`'s own instant).
 */
export function remainingWeeklyDatesInMonth(startIso: string): string[] {
  if (!startIso) return [];
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return [];

  const endOfMonth = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 23, 59, 59),
  );

  const dates: string[] = [];
  const current = new Date(start);
  while (current <= endOfMonth) {
    dates.push(current.toISOString());
    current.setUTCDate(current.getUTCDate() + 7);
  }
  return dates;
}

/**
 * The 40 weekly hold sessions the recurring endpoint reserves beyond the paid ones — each one
 * week after the last, starting one week after the final paid session.
 */
export function futureHoldSessions(paidSessionIsos: string[], count = 40): string[] {
  if (paidSessionIsos.length === 0) return [];
  const last = new Date(paidSessionIsos[paidSessionIsos.length - 1]);
  if (Number.isNaN(last.getTime())) return [];

  const holds: string[] = [];
  for (let i = 1; i <= count; i += 1) {
    const next = new Date(last);
    next.setUTCDate(last.getUTCDate() + 7 * i);
    holds.push(next.toISOString());
  }
  return holds;
}

/**
 * How many times `startIso`'s weekday occurs in the FOLLOWING month, counted from its 1st.
 *
 * Feeds the "On {month} 25 we charge ${x} for {month}'s {n} Saturdays" sentence — the client's
 * preview of what the commitment costs once it renews. Always 4 or 5.
 */
export function nextMonthWeekdayCount(startIso: string): number {
  const start = new Date(startIso);
  if (Number.isNaN(start.getTime())) return 0;

  const weekday = start.getUTCDay();
  const year = start.getUTCFullYear();
  const month = start.getUTCMonth();
  const firstOfNext = new Date(Date.UTC(year, month + 1, 1));
  const endOfNext = new Date(Date.UTC(year, month + 2, 0, 23, 59, 59));

  let count = 0;
  const current = firstOfNext;
  while (current <= endOfNext) {
    if (current.getUTCDay() === weekday) count += 1;
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return count;
}

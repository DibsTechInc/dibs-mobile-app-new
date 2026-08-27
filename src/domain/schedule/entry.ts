/**
 * Raw `get-schedule` row → the `ScheduleEntry` a screen renders.
 *
 * PURE TypeScript, no React Native. Every rule that decides what a client is told about a class
 * — how full it is, what it costs, whether a name appears — lives here and only here, so the
 * schedule list, Home, and class detail cannot drift apart the way the widget's "Included"
 * label drifted from its cart price (shared CLAUDE.md, 2026-07-28).
 */
import type { Pass } from '@/api/schemas/passes';
import type { ScheduleEvent } from '@/api/schemas/schedule';
import { formatPrice } from '@/domain/money/format';
import { choosePassForClass, passName, passesExcludedByRestriction } from '@/domain/passes/select';
import { parseStoredTime } from '@/domain/time/studio-now';

import type { ScheduleEntry } from './types';

export interface ScheduleEntryOptions {
  /**
   * Does this studio show instructor names at all? False for a rental studio like 263, whose
   * `trainerid` is a phantom auto-assignment — rendering it would be actively wrong.
   * Comes from the white-label build config, never a `=== 263` conditional.
   */
  showInstructor: boolean;
  /** ISO-4217, from `get-basic-config`. Defaults to USD only because every pilot is US. */
  currency?: string;
  /**
   * The client's usable passes at this studio, when we have them.
   *
   * Omitted for a guest and while the wallet is still resolving — and that distinction is the
   * whole reason it is optional rather than defaulting to `[]`. An empty array means "we asked and
   * they hold nothing", so the row shows a price; `undefined` means "we have not asked", and the
   * row shows a price for that reason too. Both look the same, but only one of them is a claim.
   */
  passes?: Pass[];
}

const MS_PER_MINUTE = 60_000;

/**
 * "$22" / "$16.50" — trailing `.00` dropped, because a schedule is scanned, not audited.
 *
 * Re-exported from `@/domain/money/format`, which is the one implementation. Kept exported here
 * because several callers already import it from this module, and because the note below belongs
 * with the schedule: `price_dibs` is DOLLARS (studio 210 charges `22`), unlike almost everything
 * else in the money layer, which is cents. Do not divide by 100 here.
 */
export { formatPrice };

/**
 * Capitalise a name that was typed entirely in lower case, and ONLY then.
 *
 * Studio 88 holds the same instructor as both "Aimee Ozeki" and "aimee ozeki", so one schedule
 * screen shows one person's name two different ways — which reads as nobody minding the app.
 *
 * The narrow rule is the whole point. Unconditional title-casing is a classic way to mangle real
 * names: it turns McDonald into Mcdonald, O'Brien into O'brien and Estellés into estellés-adjacent
 * nonsense the moment anyone "normalises" harder. A name containing ANY capital was styled by a
 * human and is left exactly as typed. Only an all-lowercase name — which no one writes on purpose —
 * is touched, and then just at the letter after each space, hyphen or apostrophe, so "o'brien"
 * becomes "O'Brien" and "mary-kate" becomes "Mary-Kate".
 */
function capitaliseIfAllLower(name: string): string {
  if (/\p{Lu}/u.test(name)) return name;
  return name.replace(/(^|[\s'’-])(\p{Ll})/gu, (_, boundary: string, letter: string) =>
    `${boundary}${letter.toUpperCase()}`,
  );
}

/**
 * Join a first and last name defensively.
 *
 * Live data carries leading spaces in `lastname` (studio 210 has `" Estellés"`), so a naive
 * template literal produces "Marta  Estellés".
 */
export function formatInstructorName(
  first: string | null | undefined,
  last: string | null | undefined,
): string | null {
  const joined = `${first ?? ''} ${last ?? ''}`.replace(/\s+/g, ' ').trim();
  return joined ? capitaliseIfAllLower(joined) : null;
}

/** Whole minutes between two stored wall-clock times, or null when we cannot tell. */
function durationMinutes(event: ScheduleEvent): number | null {
  if (!event.end_date) return null;
  try {
    const ms = parseStoredTime(event.end_date).getTime() - parseStoredTime(event.start_date).getTime();
    // A zero or negative duration is bad data, not a zero-minute class.
    return ms > 0 ? Math.round(ms / MS_PER_MINUTE) : null;
  } catch {
    return null;
  }
}

/**
 * Capacity, derived rather than trusted.
 *
 * `isFull` is null on most live rows — the column is only written by some paths — so the count
 * is authoritative and the flag is a hint. Trusting the flag alone would show "Open" on a full
 * class and send a client into a booking that cannot succeed.
 */
function capacity(event: ScheduleEvent): Pick<ScheduleEntry, 'spotsLeft' | 'isFull' | 'hasWaitlist'> {
  const seats = typeof event.seats === 'number' ? event.seats : null;
  const booked = typeof event.spots_booked === 'number' ? event.spots_booked : null;

  const spotsLeft = seats !== null && booked !== null ? Math.max(0, seats - booked) : null;
  const isFull = spotsLeft !== null ? spotsLeft === 0 : event.isFull === true;

  return { spotsLeft, isFull, hasWaitlist: event.has_waitlist === true };
}

/**
 * What this session costs, from the studio's own numbers.
 *
 * ── Coverage is decided by ONE helper, and this is where it lands ─────────────────────────────
 * When the caller supplies the client's passes, `choosePassForClass` — the same function the cart
 * and class detail call, mirroring the server's own chooser — decides whether one covers this
 * class. Without passes this is the GUEST answer: a list price, and no claim about coverage.
 *
 * A label promising coverage that checkout then refuses is the exact widget bug that charged a
 * member $22 for a class their unlimited membership included. That is why coverage is never
 * computed a second way anywhere: the row's "Included", the cart's $0 line and the booking that
 * actually happens all come from the same decision.
 */
function price(
  event: ScheduleEvent,
  currency: string | undefined,
  passes: Pass[] | undefined,
): ScheduleEntry['price'] {
  if (event.free_class === true) return { kind: 'amount', amountLabel: 'Free' };

  // Coverage BEFORE price: a covered class costs the client nothing, whatever the studio lists it
  // at, and quoting a figure beside "Included" is the disagreement this file exists to prevent.
  if (passes && passes.length > 0) {
    const covering = choosePassForClass(passes, event);
    if (covering) return { kind: 'covered', label: `Included · ${passName(covering)}` };
  }

  // The backend already did the pricing-rule arithmetic; show its number, never re-derive one.
  if (event.pricing_rule && typeof event.pricing_rule.discounted_price === 'number') {
    return { kind: 'amount', amountLabel: formatPrice(event.pricing_rule.discounted_price, currency) };
  }

  if (typeof event.price_dibs === 'number' && event.price_dibs > 0) {
    return { kind: 'amount', amountLabel: formatPrice(event.price_dibs, currency) };
  }

  // Zero and null are NOT the same as free: several studios leave `price_dibs` at 0 for classes
  // that are pass-only or priced elsewhere. Saying nothing is more honest than saying "$0".
  return { kind: 'unknown' };
}

/**
 * The pass the allowlist turned away, named — or null.
 *
 * Only asked once nothing covers: a note beside a $0 "Included" line would explain away good
 * news. Decided by the same domain helper the chooser uses, so the note and the refusal the
 * server would give cannot disagree.
 */
function excludedPassName(
  event: ScheduleEvent,
  passes: Pass[] | undefined,
  covered: boolean,
): string | null {
  if (covered || !passes || passes.length === 0) return null;
  const excluded = passesExcludedByRestriction(passes, event);
  return excluded[0] ? passName(excluded[0]) : null;
}

export function toScheduleEntry(
  event: ScheduleEvent,
  { showInstructor, currency, passes }: ScheduleEntryOptions,
): ScheduleEntry {
  const priced = price(event, currency, passes);
  return {
    eventId: event.eventid,
    startsAt: event.start_date,
    name: event.name.trim(),
    instructor: showInstructor
      ? formatInstructorName(event.instructor?.firstname, event.instructor?.lastname)
      : null,
    durationMinutes: durationMinutes(event),
    ...capacity(event),
    price: priced,
    excludedPassName: excludedPassName(event, passes, priced.kind === 'covered'),
  };
}

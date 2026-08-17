/**
 * Which of the client's passes can pay for an appointment.
 *
 * PURE TypeScript — the widget's `useApptPassDetection` predicate, extracted from its hook shell
 * so it can be tested and shared. Widget parity is the contract here because the server's
 * appointment pass branch performs NO verification of its own (verified 2026-08-16: it loads
 * whatever `passId` it is handed) — the only thing standing between a booking and a wrong pass
 * is this filter running over the client's OWN fetched list. Never send a pass id that did not
 * come out of this.
 *
 * The predicate, matching the widget's:
 *  • `private_pass === true` — appointments are private sessions; only private passes cover them
 *    (the exact inverse of `choosePassForClass`, which matches the flag to the event's privacy)
 *  • usable at all — not a placeholder, not expired as of NOW, uses remaining (null = unlimited).
 *    Expiry is deliberately "as of now", not "as of the session date": widget parity, and the
 *    backend's own book-beyond-the-window machinery owns the other question.
 *
 * Choice: soonest-expiring first — use a pass before it dies. NOT the class flow's
 * unlimited-first ordering; the widget's appointment picker sorts purely by expiry and the two
 * surfaces must name the same pass for the same booking.
 */
import type { Pass } from '@/api/schemas/passes';
import { isUsablePass, passName } from '@/domain/passes/select';
import { remainingPassUses } from '@/domain/passes/uses';

export interface AppointmentPassCoverage {
  pass: Pass;
  passName: string;
  /** Uses left before this booking. `Infinity` for an unlimited pass. */
  remainingUses: number;
}

const FAR_FUTURE = 8.64e15; // Max Date millis — sorts no-expiry passes last, like the widget.

function expiresAtMs(pass: Pass): number {
  if (!pass.expiresAt) return FAR_FUTURE;
  const ms = new Date(pass.expiresAt).getTime();
  return Number.isNaN(ms) ? FAR_FUTURE : ms;
}

function coversAppointments(pass: Pass, now: Date): boolean {
  if (pass.private_pass !== true) return false;
  // The join-side placeholder flag is untyped (passthrough field) but load-bearing: the
  // single-appointment unpaid hold historically stamped it only on the PACKAGE, and pre-backfill
  // rows exist. Same both-homes rule as the server's own guards.
  const packagePlaceholder = (
    pass.studioPackage as { is_placeholder?: boolean | null } | null | undefined
  )?.is_placeholder;
  if (packagePlaceholder === true) return false;
  return isUsablePass(pass, now);
}

/**
 * The best pass to pay with, or null when nothing applies.
 *
 * `passes` undefined means "we have not asked" (a guest, or the wallet still resolving) and
 * resolves to null the same as an empty list — callers that need the distinction gate on their
 * own fetch status before asking.
 */
export function selectAppointmentPass(
  passes: Pass[] | null | undefined,
  now: Date = new Date(),
): AppointmentPassCoverage | null {
  if (!passes || passes.length === 0) return null;

  const valid = passes.filter((pass) => coversAppointments(pass, now));
  if (valid.length === 0) return null;

  const chosen = [...valid].sort((a, b) => expiresAtMs(a) - expiresAtMs(b))[0];

  return {
    pass: chosen,
    passName: passName(chosen),
    remainingUses: remainingPassUses(chosen),
  };
}

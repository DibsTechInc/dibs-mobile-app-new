/**
 * Which passes a client actually holds, and which one pays for a given class.
 *
 * PURE TypeScript.
 *
 * ── One answer, not two ─────────────────────────────────────────────────────────────────────
 * `choosePassForClass` is the ONLY place that decides whether a pass covers a session. Every
 * surface that shows coverage — a schedule row's "Included", class detail, the payment sheet —
 * must call it. The widget learned this the expensive way: the schedule row read one persisted
 * boolean while the cart ran its own arithmetic, and a member holding an unlimited membership saw
 * "Included" on every row while the checkout bar asked for $22.00 (shared CLAUDE.md, 2026-07-28).
 *
 * A label that promises what checkout refuses is worse than no label.
 */
import type { Pass } from '@/api/schemas/passes';
import type { ScheduleEvent } from '@/api/schemas/schedule';

import { remainingPassUses } from './uses';

/**
 * Is this a pass the client can see and spend?
 *
 * `is_placeholder` is the important one. Placeholder passes track unpaid reservations — an admin
 * booking someone in without payment, or a subscription holding future slots. They are markers
 * for an outstanding CHARGE, not entitlements. Platform invariant: they never appear in any
 * client-facing list and are never selectable or returnable.
 */
export function isUsablePass(pass: Pass, now: Date = new Date()): boolean {
  if (pass.is_placeholder === true) return false;
  // `expiresAt` is a real instant (a pass expires at a moment, not at a studio wall-clock time),
  // so this is one of the few places a plain Date comparison is correct.
  if (pass.expiresAt && new Date(pass.expiresAt).getTime() < now.getTime()) return false;
  return remainingPassUses(pass) > 0;
}

export function usablePasses(passes: Pass[], now: Date = new Date()): Pass[] {
  return passes.filter((pass) => isUsablePass(pass, now));
}

/**
 * Order passes by which should be spent first.
 *
 * 1. **Finite before unlimited.** An unlimited pass loses nothing by going unused this once; a
 *    10-class pack has a fixed number of uses and an expiry, so spending it first is what a
 *    client would choose if asked.
 * 2. **Expiring soonest first**, for the same reason — use it before it evaporates.
 * 3. **Fewest uses remaining**, to finish off a nearly-spent pack rather than stranding one use.
 * 4. **Lowest id**, so the order is stable and two surfaces never disagree over a tie.
 */
export function sortPassesByPriority(passes: Pass[]): Pass[] {
  return [...passes].sort((a, b) => {
    const aInfinite = remainingPassUses(a) === Number.POSITIVE_INFINITY;
    const bInfinite = remainingPassUses(b) === Number.POSITIVE_INFINITY;
    if (aInfinite !== bInfinite) return aInfinite ? 1 : -1;

    const aExpiry = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.POSITIVE_INFINITY;
    const bExpiry = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.POSITIVE_INFINITY;
    if (aExpiry !== bExpiry) return aExpiry - bExpiry;

    const remaining = remainingPassUses(a) - remainingPassUses(b);
    if (Number.isFinite(remaining) && remaining !== 0) return remaining;

    return a.id - b.id;
  });
}

/**
 * The pass that would pay for this class, or null.
 *
 * Honours the event's own `can_apply_pass` and the pass's `private_pass` flag, because checkout
 * enforces both — and a schedule row must never promise coverage checkout will refuse.
 *
 * `Boolean()` around `private_pass` is deliberate: `null === false` is false, which is how a
 * public pass whose flag was null got silently dropped in the widget.
 */
export function choosePassForClass(
  passes: Pass[],
  event: Pick<ScheduleEvent, 'can_apply_pass' | 'private'>,
  now: Date = new Date(),
): Pass | null {
  // `can_apply_pass === false` is an explicit refusal. Null or undefined means the studio never
  // set it, which historically means passes ARE allowed.
  if (event.can_apply_pass === false) return null;

  const isPrivateEvent = Boolean(event.private);
  const eligible = usablePasses(passes, now).filter(
    (pass) => Boolean(pass.private_pass) === isPrivateEvent,
  );

  return sortPassesByPriority(eligible)[0] ?? null;
}

/** The client-facing name of a pass. Falls back rather than rendering "undefined". */
export function passName(pass: Pass): string {
  return pass.studioPackage?.packageName?.trim() || 'Your pass';
}

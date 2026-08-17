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
 * ⚠️ **The SERVER is the authority. This must stay identical to
 * `dibs-api/services/shared/checkout/class-pass/choose-pass-for-class.js#comparePasses`.**
 * The app only shows which pass is about to be used; `book-with-pass` chooses again and its choice
 * is the one that happens. If the two orderings drift, the app names one package and the client's
 * account loses a use off another — which reads as the app spending the wrong thing.
 *
 * 1. **UNLIMITED first.** A client holding a membership AND a 10-class pack should spend the
 *    membership: it is already paid for, it has no balance to run down, and drawing on the pack
 *    instead silently costs them a class they could have kept for after the membership ends.
 * 2. **Then the finite pass expiring soonest** — it is the one about to become worthless.
 * 3. **No expiry sorts last** within that group, for the same reason.
 * 4. **Lowest id**, so the order is stable and two surfaces never disagree over a tie.
 *
 * This REVERSED rule 1 on 2026-08-13 (it read "finite before unlimited"). The old note argued a
 * pack should go first because it has a fixed number of uses and an expiry — but that reasoning
 * only holds if the two are alternatives, and they are not: while a membership is live it covers
 * every class anyway, so burning pack classes underneath it is pure loss to the client. The
 * function had no production callers at the time, so nothing shipped on the old order.
 */
export function sortPassesByPriority(passes: Pass[]): Pass[] {
  return [...passes].sort((a, b) => {
    const aInfinite = remainingPassUses(a) === Number.POSITIVE_INFINITY;
    const bInfinite = remainingPassUses(b) === Number.POSITIVE_INFINITY;
    if (aInfinite !== bInfinite) return aInfinite ? -1 : 1;

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

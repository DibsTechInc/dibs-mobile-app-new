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

/** The event fields coverage decisions read. Every caller passes a full schedule row anyway. */
export type ClassCoverageEvent = Pick<
  ScheduleEvent,
  'can_apply_pass' | 'private' | 'packageRestriction'
>;

/** Packages the studio never chose and must not be able to exclude. */
const ADMIN_PACKAGE_PREFIX = '[Admin]';

/**
 * Platform machinery — comp passes, holds, the bookkeeping pass a card booking mints. A studio
 * never ticked these into an allowlist and they must never be turned away by one.
 *
 * ⚠️ Must stay identical to `isPlatformPackage` in
 * `dibs-api/services/shared/passes/package-allowlist.js`. The `front_desk_only` half is required,
 * not decoration: studio 88's back-office "Unpaid" package carries `is_placeholder = false` (only
 * 226/263 were backfilled), so the flag that actually says "admins only" is what exempts it.
 */
function isPlatformPackagePass(pass: Pass): boolean {
  if (pass.is_placeholder === true) return true;
  if (pass.studioPackage?.is_placeholder === true) return true;
  const name = pass.studioPackage?.packageName?.trim() ?? '';
  if (name.startsWith(ADMIN_PACKAGE_PREFIX)) return true;
  if (pass.studioPackage?.front_desk_only === true && name.toLowerCase() === 'unpaid') return true;
  return false;
}

/**
 * May this pass's PACKAGE pay for this session?
 *
 * ⚠️ **The SERVER is the authority. This must stay identical to
 * `dibs-api/services/shared/passes/package-allowlist.js#packageAllowedForEvent`, as seen through
 * the wire**: the server has already folded the class type's list, the session's own override and
 * both master switches into `event.packageRestriction` (`resolveEventPackageRestriction`), so the
 * app's half is membership in the resolved list plus the platform exemption — never a second
 * resolution of session-vs-type. Same one-owner shape as `uses.ts` / `credit/split.ts` /
 * `pricing/class-charge.ts`, pinned by the golden tests in `__tests__/passes.test.ts`.
 *
 * Everything unknown fails OPEN, matching the widget's `packageAllowedForEvent`
 * (dibs-widget-new `associatePassWithEventNew.js`):
 *   • `packageRestriction` absent or null — an older API build → allowed
 *   • `allowedPackageIds: null` — NO restriction declared, the majority state → allowed
 * The only closed states: `packagesAllowed === false`, and an explicit id list (including `[]` —
 * the studio unticked everything) that does not contain this pass's `studio_package_id`. A pass
 * with no resolvable package id is refused by a real list, exactly as the server refuses it.
 */
export function packageAllowedForClass(event: ClassCoverageEvent, pass: Pass): boolean {
  const restriction = event.packageRestriction;
  if (!restriction) return true;

  if (isPlatformPackagePass(pass)) return true;

  if (restriction.packagesAllowed === false) return false;

  const allowed = restriction.allowedPackageIds;
  if (allowed === null || allowed === undefined) return true;
  if (!Array.isArray(allowed)) return true;

  const packageId = Number(pass.studio_package_id);
  if (!Number.isInteger(packageId)) return false;
  return allowed.includes(packageId);
}

/**
 * Usable, visibility-matching passes that ONLY the package allowlist turns away.
 *
 * For the surfaces that must SAY why — a pass that silently stops covering reads as "the app lost
 * my membership", so class detail and the cart name the excluded pass instead of hiding it (the
 * same disabled-with-a-reason rule the admin selector follows).
 */
export function passesExcludedByRestriction(
  passes: Pass[],
  event: ClassCoverageEvent,
  now: Date = new Date(),
): Pass[] {
  if (event.can_apply_pass === false) return [];
  const isPrivateEvent = Boolean(event.private);
  return sortPassesByPriority(
    usablePasses(passes, now).filter(
      (pass) =>
        Boolean(pass.private_pass) === isPrivateEvent && !packageAllowedForClass(event, pass),
    ),
  );
}

/**
 * The pass that would pay for this class, or null.
 *
 * Honours the event's own `can_apply_pass`, the pass's `private_pass` flag, AND the package
 * allowlist the server resolved onto the row — because checkout enforces all three, and a
 * schedule row must never promise coverage checkout will refuse.
 *
 * `Boolean()` around `private_pass` is deliberate: `null === false` is false, which is how a
 * public pass whose flag was null got silently dropped in the widget.
 */
export function choosePassForClass(
  passes: Pass[],
  event: ClassCoverageEvent,
  now: Date = new Date(),
): Pass | null {
  // `can_apply_pass === false` is an explicit refusal. Null or undefined means the studio never
  // set it, which historically means passes ARE allowed.
  if (event.can_apply_pass === false) return null;

  const isPrivateEvent = Boolean(event.private);
  const eligible = usablePasses(passes, now).filter(
    (pass) =>
      Boolean(pass.private_pass) === isPrivateEvent && packageAllowedForClass(event, pass),
  );

  return sortPassesByPriority(eligible)[0] ?? null;
}

/** The client-facing name of a pass. Falls back rather than rendering "undefined". */
export function passName(pass: Pass): string {
  return pass.studioPackage?.packageName?.trim() || 'Your pass';
}

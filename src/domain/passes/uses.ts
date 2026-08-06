/**
 * How many uses are left on a pass — the single most-repeated bug in this platform.
 *
 * PURE TypeScript. Ported from `dibs-widget-new/src/utils/passUses.js`, which exists because the
 * same mistake shipped SIX times across separate read surfaces.
 *
 * ── The rule ────────────────────────────────────────────────────────────────────────────────
 * `passes.totalUses === null` means **UNLIMITED**. Not missing, not zero — unlimited. This is
 * live, ongoing data: `Pass.createNewPass` writes null for every unlimited package, so every new
 * membership is born null. `999` is an older sentinel for the same thing and still in the data.
 *
 * ── Why it keeps biting ─────────────────────────────────────────────────────────────────────
 * In SQL, `totalUses > usesCount` is NULL for an unlimited pass — not true — so a bare comparison
 * silently drops every membership from the result.
 *
 * In JavaScript it is worse: `null - usesCount` evaluates to a NEGATIVE NUMBER, so the pass does
 * not merely vanish, it reads as *over-spent*. That is how a member holding an unlimited
 * membership saw "Included" on every class row while the checkout bar still asked for $22.00.
 *
 * Every read that asks "can this pass cover one more session?" goes through here. Never do the
 * arithmetic inline, and never "fix" this by backfilling `totalUses` to a large finite number —
 * new unlimited passes are born null again, and a finite value breaks the billing paths that
 * special-case null.
 */
import type { Pass } from '@/api/schemas/passes';

/** An older way of saying "unlimited". Still present in live rows. */
export const UNLIMITED_SENTINEL = 999;

export function isUnlimitedPass(pass: Pick<Pass, 'totalUses'> | null | undefined): boolean {
  if (!pass) return false;
  const { totalUses } = pass;
  return totalUses === null || totalUses === undefined || totalUses === UNLIMITED_SENTINEL;
}

/**
 * Uses remaining, or `Infinity` for an unlimited pass.
 *
 * Infinity rather than a sentinel so callers can compare with `>` and `>=` without special
 * casing — which is exactly the special case people forget. Never negative: a spent pass has 0
 * left, not minus three.
 */
export function remainingPassUses(pass: Pick<Pass, 'totalUses' | 'usesCount'> | null | undefined): number {
  if (!pass) return 0;
  if (isUnlimitedPass(pass)) return Number.POSITIVE_INFINITY;
  const used = pass.usesCount ?? 0;
  return Math.max(0, (pass.totalUses ?? 0) - used);
}

/** "Unlimited" or a real count. Keeps "null classes left" and "-3 classes left" off the screen. */
export function remainingPassUsesLabel(pass: Pass): string {
  if (isUnlimitedPass(pass)) return 'Unlimited';
  const left = remainingPassUses(pass);
  return `${left} ${left === 1 ? 'class' : 'classes'} left`;
}

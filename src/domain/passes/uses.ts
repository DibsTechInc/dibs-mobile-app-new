/**
 * How many uses are left on a pass — the single most-repeated bug in this platform.
 *
 * PURE TypeScript. Ported from `dibs-widget-new/src/utils/passUses.js`, which exists because the
 * same mistake shipped SIX times across separate read surfaces.
 *
 * ── The rule ────────────────────────────────────────────────────────────────────────────────
 * `passes.totalUses === null` means **UNLIMITED**. Not missing, not zero — unlimited. This is
 * live, ongoing data: `Pass.createNewPass` writes null for every unlimited package, so every new
 * membership is born null.
 *
 * The numeric sentinels are the older way of saying it, and they are a FAMILY — 999, 9999, 99999 —
 * not one number. They are a deliberate workaround carried over from the legacy software: pick a
 * cap nobody reaches. **The authority on "is this unlimited" is `studioPackage.unlimited`**, and a
 * `=== 999` branch is wrong for the same reason a bare subtraction is: it answers for one member of
 * a family. This file used to carry exactly that branch, so a 9999 pass read as finite here while
 * the server read it as unlimited.
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

/**
 * The smallest numeric sentinel. A THRESHOLD, not an equality test — 999, 9999 and 99999 all mean
 * the same thing, and a pass genuinely sold with 999 real sessions does not exist.
 */
export const UNLIMITED_SENTINEL_MIN = 999;

type UsesShape = Pick<Pass, 'totalUses'> & { studioPackage?: Pass['studioPackage'] };

/**
 * ⚠️ **Must stay identical to `dibs-api/services/shared/checkout/class-pass/choose-pass-for-class.js#isUnlimited`.**
 *
 * That function orders the passes the server actually spends; this one orders the pass the app
 * NAMES. If they disagree the app says "Month Unlimited" and the client's ten-class pack loses a
 * use — which reads as the app spending the wrong thing. Same three clauses, same order, so the
 * correspondence can be checked by eye.
 */
export function isUnlimitedPass(pass: UsesShape | null | undefined): boolean {
  if (!pass) return false;
  const { totalUses } = pass;
  if (totalUses === null || totalUses === undefined) return true;
  if (Number(totalUses) >= UNLIMITED_SENTINEL_MIN) return true;
  // The authority. A package flagged unlimited is unlimited whatever its `totalUses` says — that
  // column is decorative on a membership, and rendering it produced "949 classes left" on a card
  // that should read "Unlimited".
  return pass.studioPackage?.unlimited === true;
}

/**
 * Uses remaining, or `Infinity` for an unlimited pass.
 *
 * Infinity rather than a sentinel so callers can compare with `>` and `>=` without special
 * casing — which is exactly the special case people forget. Never negative: a spent pass has 0
 * left, not minus three.
 *
 * The parameter carries `studioPackage` so the unlimited check above can actually reach the flag.
 * Narrowing it back to `totalUses | usesCount` still compiles — the field is optional — and the
 * membership silently reverts to a countdown.
 */
export function remainingPassUses(
  pass: (Pick<Pass, 'totalUses' | 'usesCount'> & { studioPackage?: Pass['studioPackage'] }) | null | undefined,
): number {
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

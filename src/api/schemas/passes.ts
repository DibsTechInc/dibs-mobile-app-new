/**
 * `POST /api/v2/get-passes` — the client's passes at one studio.
 *
 * Request: `{ dibsStudioId, userid }`. Response: `{ msg, passes: [...] }`, raw Sequelize rows
 * with a `studioPackage` include.
 *
 * ── Two defects, both reported by this workstream and both now FIXED ─────────────────────────
 * Verified 2026-08-06 by reading `dibs-api/services/shared/get-passes.js` at commit `90dc7fcc`
 * ("fix(passes): return unlimited passes, exclude placeholders in get-passes", branch `staging`).
 * Recorded here rather than deleted, because both are load-bearing reasons the app still filters
 * client-side and must keep doing so.
 *
 *  1. **Unlimited passes used to be dropped.** The `where` built `[Op.or]` as an OBJECT with a
 *     duplicate `totalUses` key, so JS kept only the last one and the `null` (unlimited) branch
 *     was discarded before Sequelize saw it. What survived was `totalUses > usesCount`, and in
 *     SQL that is NULL — not true — for an unlimited pass, so every membership was silently
 *     filtered out. `[Op.or]` is now an ARRAY. This was the SEVENTH surface the
 *     `totalUses === null` trap has hit; `src/domain/passes/uses.ts` treats null as unlimited on
 *     our side regardless of what any endpoint does.
 *
 *  2. **Placeholder passes used to come back with no field to filter them by.** `is_placeholder`
 *     was in neither the `where` nor the `attributes`. It is now filtered server-side on BOTH the
 *     pass row and the `$studioPackage.is_placeholder$` join — the join matters because the
 *     single-appointment unpaid hold historically stamped the flag only on the package — and it
 *     is returned in `attributes`.
 *
 * **The client-side filter stays.** `domain/passes` still refuses `is_placeholder`, because the
 * flag was written inconsistently across the three hold-creation paths and pre-backfill rows
 * exist; a defence that costs nothing must not be removed on the strength of one fixed endpoint.
 *
 * The endpoint ALSO filters `expiresAt >= now`, which means a pass with a NULL `expiresAt` never
 * comes back at all (`NULL >= now` is NULL, not true). Nothing the app can do about that, and no
 * pass observed at either pilot studio has a null expiry — noted so the next reader does not
 * spend an hour on a missing row.
 */
import { z } from 'zod';

export const studioPackageSchema = z
  .object({
    packageName: z.string().nullable().optional(),
    customDescription: z.string().nullable().optional(),
    isPrivate: z.boolean().nullable().optional(),
    unlimited: z.boolean().nullable().optional(),
    /**
     * ⚠️ A STRING, not a boolean. `studio_packages.autopay` is a Postgres ENUM —
     * `'NONE' | 'ALLOW' | 'FORCE'` — aliased to `autopayStatus` by the include. Observed live on
     * staging 2026-08-06 (7,996 NONE / 2,428 ALLOW / 192 FORCE platform-wide).
     *
     * It describes what the PACKAGE permits, NOT whether this pass is on autopay, and the two
     * genuinely disagree: among live passes there are 24 with `passes.autopay = true` on a `NONE`
     * package and 5 with `false` on a `FORCE` one. **The row's own `autopay` boolean is the
     * membership signal.** Typed loosely because it was previously typed `boolean`, which is
     * wrong in both directions — a boolean here fails the schema, and `'ALLOW' === true` is a
     * dead comparison that reads as a working check.
     */
    autopayStatus: z.union([z.string(), z.boolean()]).nullable().optional(),
    commitment_period: z.number().nullable().optional(),
    on_demand_access: z.boolean().nullable().optional(),
  })
  .passthrough();

export const passSchema = z
  .object({
    id: z.number(),
    studio_package_id: z.number().nullable().optional(),
    /** Real instant, not wall-clock — a pass expires at a moment, not at a studio's clock time. */
    expiresAt: z.string().nullable().optional(),
    /**
     * null means UNLIMITED, and so does any of the legacy numeric sentinels (999, 9999, 99999).
     * `studioPackage.unlimited` is the authority; this column is decorative on a membership.
     * See `src/domain/passes/uses.ts` — never compare it to one sentinel value.
     */
    totalUses: z.number().nullable().optional(),
    usesCount: z.number().nullable().optional(),
    autopay: z.boolean().nullable().optional(),
    passValue: z.number().nullable().optional(),
    private_status: z.boolean().nullable().optional(),
    private_pass: z.boolean().nullable().optional(),
    /** Returned since the 2026-08-06 fix. Still optional: an older API build must not fail the schema. */
    is_placeholder: z.boolean().nullable().optional(),
    studioPackage: studioPackageSchema.nullable().optional(),
    /**
     * Whether this membership can be cancelled yet — computed server-side, rendered verbatim.
     *
     * The SAME value drives the server's own `commitment_not_met` refusal, so the button the app
     * shows and the answer the endpoint gives cannot disagree. **Never re-derive `canCancel` from
     * `eligibleOn` here**; that is two answers to one question, which is the bug this shape exists
     * to prevent.
     *
     * Null for anything that is not an autopay membership. Optional so an older API build — one
     * deployed before this field existed — degrades to "no commitment line", not a schema error.
     */
    cancellation: z
      .object({
        canCancel: z.boolean(),
        /**
         * `YYYY-MM-DD` in the STUDIO's timezone, never an instant.
         * MUST NOT be passed through `new Date()` — `new Date('2026-11-03')` is parsed as UTC
         * midnight and renders as Nov 2 in every negative-offset timezone, i.e. every Dibs studio.
         * Render it part-by-part; `formatIsoDate` in `domain/time/studio-now` does that.
         */
        eligibleOn: z.string().nullable().optional(),
        remainingCount: z.number().nullable().optional(),
        remainingUnit: z.string().nullable().optional(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

export type Pass = z.infer<typeof passSchema>;

export const passesResponseSchema = z
  .object({
    msg: z.string().optional(),
    passes: z.array(passSchema).nullable().optional(),
  })
  .passthrough();

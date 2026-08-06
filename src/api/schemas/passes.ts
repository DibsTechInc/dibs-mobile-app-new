/**
 * `POST /api/v2/get-passes` — the client's passes at one studio.
 *
 * Request: `{ dibsStudioId, userid }`. Response: `{ msg, passes: [...] }`, raw Sequelize rows
 * with a `studioPackage` include.
 *
 * ⚠️ TWO BACKEND DEFECTS make this endpoint unsafe to render as-is. Both are in
 * `dibs-api/services/shared/get-passes.js` and both are recorded in EXECUTION_STATE.md; neither
 * is the app's to fix.
 *
 *  1. **Unlimited passes never come back.** The `where` clause is
 *     `[Op.or]: { totalUses: {[Op.eq]: null}, totalUses: {[Op.gt]: ...} }` — a JavaScript object
 *     literal with a DUPLICATE KEY, so the null branch is discarded before Sequelize ever sees
 *     it. What survives is `totalUses > usesCount`, and in SQL that is NULL (not true) for an
 *     unlimited pass. Every membership is silently filtered out. This is the seventh surface the
 *     `totalUses === null` trap has hit.
 *
 *  2. **Placeholder passes come back, and cannot be filtered.** `is_placeholder` is neither in
 *     the `where` nor in the `attributes` list, so hold passes for unpaid reservations are
 *     included AND the app has no field to exclude them by. Platform invariant: a placeholder
 *     pass must never appear in any client-facing list — it is a marker for an outstanding
 *     charge, not an entitlement.
 *
 * `isPlaceholder` is typed optional below so the app filters correctly the day the backend starts
 * returning it, without needing a client release.
 */
import { z } from 'zod';

export const studioPackageSchema = z
  .object({
    packageName: z.string().nullable().optional(),
    customDescription: z.string().nullable().optional(),
    isPrivate: z.boolean().nullable().optional(),
    unlimited: z.boolean().nullable().optional(),
    autopayStatus: z.boolean().nullable().optional(),
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
    /** null (or 999) means UNLIMITED. See `src/domain/passes/uses.ts`. */
    totalUses: z.number().nullable().optional(),
    usesCount: z.number().nullable().optional(),
    autopay: z.boolean().nullable().optional(),
    passValue: z.number().nullable().optional(),
    private_status: z.boolean().nullable().optional(),
    private_pass: z.boolean().nullable().optional(),
    /** NOT currently returned — see defect 2 above. Typed so the filter works when it is. */
    is_placeholder: z.boolean().nullable().optional(),
    studioPackage: studioPackageSchema.nullable().optional(),
  })
  .passthrough();

export type Pass = z.infer<typeof passSchema>;

export const passesResponseSchema = z
  .object({
    msg: z.string().optional(),
    passes: z.array(passSchema).nullable().optional(),
  })
  .passthrough();

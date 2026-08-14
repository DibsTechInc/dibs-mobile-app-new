/**
 * `GET /api/v2/app-release/:studioSlug`.
 *
 * ── This schema is DELIBERATELY the loosest one in the app ───────────────────────────────────
 * Every field is `unknown`, and the object passes through. That is not laziness — it is the
 * fail-open rule expressed at the schema layer.
 *
 * `ApiClient` throws `ApiSchemaError` on a mismatch in development, and this is the one response
 * where a mismatch must never be an error: a malformed body has to mean "no gate", not "the app
 * crashed on launch because somebody typo'd a row". So the schema accepts anything shaped like an
 * object and the REAL validation lives in `domain/app-release/gate.ts`, where every rejected shape
 * has a test and a named outcome.
 *
 * The corollary matters as much: nothing else may read these fields directly. They are `unknown`
 * here precisely so that the only way to use them is through `decideReleaseGate`.
 */
import { z } from 'zod';

const platformBlockSchema = z
  .object({
    minimumBuild: z.unknown(),
    latestBuild: z.unknown(),
    storeUrl: z.unknown(),
  })
  .partial()
  .passthrough();

export const appReleaseSchema = z
  .object({
    ios: platformBlockSchema.nullable().optional(),
    android: platformBlockSchema.nullable().optional(),
    message: z.unknown(),
  })
  .partial()
  .passthrough();

export type AppReleaseResponse = z.infer<typeof appReleaseSchema>;

/**
 * `POST /stripe/cancel-renewal` — cancel a membership's renewal.
 *
 * Cancels at PERIOD END: the client keeps access until the paid period runs out. The screen must
 * say so, or somebody who thinks they lost access immediately calls the studio.
 */
import { z } from 'zod';

import type { ApiClient } from '../client';
import { ApiError } from '../errors';

/** The commitment refusal. Not an error toast — it is the screen, with the date on it. */
export class CommitmentNotMetError extends ApiError {
  /** `YYYY-MM-DD` in the studio's zone. Render with `formatIsoDate`, never `new Date()`. */
  readonly eligibleOn: string | null;
  readonly packageName: string | null;

  constructor(args: { message: string; eligibleOn: string | null; packageName: string | null; body: unknown }) {
    super({
      status: 409,
      // A decision, not a fault: `describeApiError` must not replace the server's sentence.
      code: 'bad_request',
      message: args.message,
      retriable: false,
      body: args.body,
    });
    this.name = 'CommitmentNotMetError';
    this.eligibleOn = args.eligibleOn;
    this.packageName = args.packageName;
  }
}

const commitmentRefusalSchema = z
  .object({
    code: z.literal('commitment_not_met'),
    error: z.string().optional(),
    eligibleOn: z.string().nullable().optional(),
    packageName: z.string().nullable().optional(),
  })
  .passthrough();

/**
 * The legacy success shape. This endpoint predates the `{ ok }` convention the class endpoints
 * use and answers 200 with `successfullyCanceled` — including for its own failures, which is why
 * the flag is checked rather than the status.
 */
const cancelRenewalResponseSchema = z
  .object({
    successfullyCanceled: z.boolean().optional(),
    error: z.string().nullable().optional(),
  })
  .passthrough();

export interface CancelMembershipArgs {
  dibsStudioId: number;
  passId: number;
  packageId: number;
}

export async function cancelMembership(
  client: ApiClient,
  { dibsStudioId, passId, packageId }: CancelMembershipArgs,
  signal?: AbortSignal,
): Promise<void> {
  try {
    const result = await client.post(
      'stripe/cancel-renewal',
      {
        // The server takes the client id from the verified token. No `userid` here — and adding
        // one would make `isRequestingOwnData` compare it, so a stale one would 403.
        dibsId: dibsStudioId,
        passid: passId,
        packageid: packageId,
        // Attribution only: it picks the cancellation_source label. It cannot change the outcome.
        platform: 'mobile',
      },
      cancelRenewalResponseSchema,
      { authenticated: true, signal },
    );

    // A 200 with `successfullyCanceled: false` is a real failure on this legacy contract.
    if (result.successfullyCanceled !== true) {
      throw new ApiError({
        status: 200,
        code: 'bad_request',
        message: result.error || 'We could not cancel that membership. Please contact the studio.',
        retriable: false,
        body: result,
      });
    }
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const parsed = commitmentRefusalSchema.safeParse(error.body);
      if (parsed.success) {
        throw new CommitmentNotMetError({
          message: parsed.data.error || 'This membership is inside its minimum commitment period.',
          eligibleOn: parsed.data.eligibleOn ?? null,
          packageName: parsed.data.packageName ?? null,
          body: error.body,
        });
      }
    }
    throw error;
  }
}

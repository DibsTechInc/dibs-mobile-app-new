/**
 * `POST /api/v2/widget/delete-account` — the client deletes their own account.
 *
 * Exists because Apple demands it (Guideline 5.1.1(v)): an app offering account creation must
 * offer deletion in-app. The server takes identity from the token and IGNORES the body, so this
 * sends nothing at all.
 *
 * The two 409 refusals are the design, not errors: a live membership or recurring booking keeps
 * BILLING after the login dies, so the server refuses and the screen routes the client to cancel
 * first. They arrive as `AccountDeletionRefusedError` carrying the server's own sentence — the
 * screen renders that sentence, never a paraphrase.
 */
import { z } from 'zod';

import type { ApiClient } from '../client';
import { ApiError } from '../errors';

const deleteAccountResponseSchema = z.object({ ok: z.literal(true) }).passthrough();

const refusalSchema = z
  .object({
    ok: z.literal(false),
    code: z.string(),
    message: z.string(),
  })
  .passthrough();

/** `code` is an open enum — `active_membership` and `active_subscription` today. */
export class AccountDeletionRefusedError extends ApiError {
  readonly refusalCode: string;

  constructor(args: { status: number; refusalCode: string; message: string; body: unknown }) {
    super({
      status: args.status,
      // A refusal is a decision, not a fault — describeApiError must not overwrite the
      // server's sentence with "the studio's system is having trouble".
      code: 'bad_request',
      message: args.message,
      retriable: false,
      body: args.body,
    });
    this.name = 'AccountDeletionRefusedError';
    this.refusalCode = args.refusalCode;
  }
}

export async function deleteAccount(client: ApiClient, signal?: AbortSignal): Promise<void> {
  try {
    await client.post('widget/delete-account', {}, deleteAccountResponseSchema, {
      authenticated: true,
      signal,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status !== null) {
      const parsed = refusalSchema.safeParse(error.body);
      if (parsed.success) {
        throw new AccountDeletionRefusedError({
          status: error.status,
          refusalCode: parsed.data.code,
          message: parsed.data.message,
          body: error.body,
        });
      }
    }
    throw error;
  }
}

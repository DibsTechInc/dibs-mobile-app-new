/**
 * `POST /api/v2/widget/confirm-password-set` — the ONE sanctioned writer of `firebase_auth_pwd`.
 * Identity comes from the verified token; there is deliberately no userid in the body.
 */
import { z } from 'zod';

import type { ApiClient } from '../client';

// Deliberately permissive. The call is bookkeeping: nothing downstream reads the response, and a
// strict schema would turn a harmless shape change into a thrown error on a success path.
const confirmPasswordSetResponseSchema = z.unknown();

export async function confirmPasswordSet(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<void> {
  // No body. The server reads `req.authenticatedUserId` from the token — sending a `userid` would
  // change which middleware branch runs, the same trap the class-booking endpoints carry.
  await client.post('widget/confirm-password-set', {}, confirmPasswordSetResponseSchema, {
    authenticated: true,
    signal,
  });
}

/**
 * `POST /api/v2/update-profile` — the client's own name and phone number.
 *
 * ⚠️ THREE things about this endpoint decide the shape of the screen above it.
 * All verified 2026-08-06 by reading `dibs-api/services/shared/update-client-profile.js`.
 *
 * **1. Editing the email would lock the client out, so the app does not offer it.**
 * The service writes `dibs_user.email` from whatever it is handed, and that does NOT touch the
 * Firebase credential — Firebase is a separate system holding the address the client signs in
 * with. `get-user-account` then looks the Dibs row up with `where: { email }`, CASE SENSITIVE.
 * So a client who changed their email here would sign in fine and be told they have no account.
 * The widget's version of this form is worse than merely allowing it: it LOWERCASES the address
 * on save, so a mixed-case client can trigger the same lockout without editing anything. This
 * function therefore sends the address back exactly as it came out of the Dibs row — an identity
 * write, so a profile save can never desynchronize the two systems.
 *
 * **2. `phone` must always be a string.** The service reads `phone.length` with no guard, so
 * omitting it throws AFTER the name has already been written. The catch only `console.log`s and
 * the controller sends the resulting `undefined` as an empty 200 — the name is saved, the client
 * is told nothing, and a retry looks like the first attempt failed. Always send `''`.
 *
 * **3. It is UNAUTHENTICATED and takes `userid` from the body.** Anyone can rewrite anyone's
 * name, phone and EMAIL — and rewriting a stranger's email to your own points their Dibs history
 * at your Firebase session. This is the most serious of the auth gaps this workstream has found
 * and belongs at the top of the 7.3 hardening list. The app sends its token regardless, so it
 * keeps working the day a mount lands.
 */
import { z } from 'zod';

import type { ApiClient } from '../client';
import { ApiError } from '../errors';

const updateProfileResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
  })
  .passthrough();

export interface UpdateProfileArgs {
  userid: number;
  /** Exactly as the Dibs row holds it. Never edited, never normalized — see note 1. */
  email: string;
  firstName: string;
  lastName: string;
  /** Digits as typed. `''` clears nothing — the service skips anything 3 characters or shorter. */
  phone: string;
}

export async function updateProfile(
  client: ApiClient,
  { userid, email, firstName, lastName, phone }: UpdateProfileArgs,
  signal?: AbortSignal,
): Promise<void> {
  const response = await client.post(
    'update-profile',
    {
      profile: {
        userid,
        email,
        // Trimmed here so every caller gets it: names go straight into the studio's roster and
        // into confirmation emails, and a leading space from an autofill follows a client around.
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        // Explicitly not offered in the app. Sending null is what the service already coerces
        // every empty variant to, so this leaves an existing birthday alone.
        birthday: null,
        // Never undefined. See note 2.
        phone: phone ?? '',
      },
    },
    updateProfileResponseSchema,
    { authenticated: true, signal },
  );

  // `success: false` is how this endpoint reports a real, actionable refusal — most often that
  // the phone number already belongs to another account, with a message naming that account's
  // email. Worth surfacing verbatim: it is one of the few server messages written for a client.
  if (response.success !== true) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message:
        response.message ??
        'We could not save your profile just now. Please try again in a moment.',
      // A duplicate phone number does not resolve itself on a retry.
      retriable: false,
      body: response,
    });
  }
}

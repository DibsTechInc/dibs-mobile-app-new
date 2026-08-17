/**
 * `POST /api/v2/update-profile` — the client's own name, phone number and birthday.
 *
 * ⚠️ THREE things about this endpoint decide the shape of the screen above it.
 * All verified 2026-08-06 by reading `dibs-api/services/shared/update-client-profile.js`.
 *
 * **1. Editing the email would lock the client out, so the app does not offer it.**
 * The service writes `dibs_user.email` from whatever it is handed, and that does NOT touch the
 * Firebase credential — Firebase is a separate system holding the address the client signs in
 * with. A client who changed their email here would sign in with the old one and find a Dibs row
 * pointing somewhere else. Ruled out for now (Alicia, 2026-08-14): a client who genuinely needs a
 * different address contacts the studio, or signs up again under it. Merging two identities is a
 * later feature, not a form field.
 *
 * This function sends the address back exactly as it came out of the Dibs row — an identity
 * write. Note it does NOT lowercase: **normalizing is the server's job** (`update-client-profile.js`
 * lowercases on write as of 2026-08-14, because the bulk update it performs skips the model's own
 * `beforeUpdate` hook). The widget's form lowercases client-side instead, which is how a
 * mixed-case client used to lock themselves out just by saving their profile — the readers are
 * case-insensitive now, but doing normalization in two places is how they drift apart again.
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
  /**
   * `MM/DD`, or `''` to clear it.
   *
   * The format is the platform's, matching the widget's own field — see `AccountIdentity`. The
   * service coerces `''`, `null` and the literal `'MM/DD'` all to null, so an empty string here
   * genuinely clears a stored birthday rather than leaving it alone. That asymmetry with `phone`
   * (where `''` means "leave it") is the service's, not ours; the caller must therefore always
   * send the CURRENT value, not an empty string, when it does not intend to clear.
   */
  birthday: string;
}

export async function updateProfile(
  client: ApiClient,
  { userid, email, firstName, lastName, phone, birthday }: UpdateProfileArgs,
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
        // Null rather than `''` when empty — same value the service coerces to, sent explicitly
        // so the intent is legible in the request rather than relying on its coercion table.
        birthday: birthday.trim() || null,
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

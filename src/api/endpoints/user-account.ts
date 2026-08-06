import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import {
  createUserResponseSchema,
  toAccountIdentity,
  userAccountSchema,
  type AccountIdentity,
} from '../schemas/user-account';

export interface FetchUserAccountArgs {
  /** Exactly as Firebase holds it — the backend lookup is case sensitive. */
  email: string;
  dibsStudioId: number;
}

/**
 * Turn a Firebase session into a Dibs identity.
 *
 * Returns `null` when the token is valid but no Dibs row matches — a real state, not an error.
 * It happens when a Firebase account was created without its Dibs counterpart (an abandoned
 * sign-up, or a case-mismatched email). The caller must handle it: every other authenticated
 * endpoint 403s for that client, so leaving them "signed in" is a dead end.
 */
export async function fetchUserAccount(
  client: ApiClient,
  { email, dibsStudioId }: FetchUserAccountArgs,
  signal?: AbortSignal,
): Promise<AccountIdentity | null> {
  const response = await client.post(
    'widget/get-user-account',
    // `dibsId`, not `dibsStudioId` — this endpoint's own parameter name.
    { email, dibsId: dibsStudioId },
    userAccountSchema,
    { authenticated: true, signal },
  );

  return toAccountIdentity(response);
}

export interface CreateDibsUserArgs {
  email: string;
  firstName: string;
  lastName: string;
  /** Digits as typed; the backend normalizes and de-duplicates. Optional. */
  phone?: string | null;
  dibsStudioId: number;
}

/**
 * Create (or associate) the Dibs row for a new client.
 *
 * ⚠️ Call this BEFORE creating the Firebase credential, never after. Creating the credential
 * flips the auth session, and everything that reacts to that flip is keyed on the Dibs userid —
 * so if the row does not exist yet, those first authenticated reads go out with the new user's
 * token and no id, and the backend's ownership check rejects them. This ordering is the widget's
 * hard-won one (`dibs-widget-new/src/components/new-auth/setPassword.jsx`).
 *
 * ⚠️ The password is NOT sent. The widget includes a `newpwd` field and the backend never reads
 * it — `add-user-plus-association.js` only sets `firebase_auth_pwd: true`. Firebase owns the
 * credential; putting a plaintext password on a second wire buys nothing.
 */
export async function createDibsUser(
  client: ApiClient,
  { email, firstName, lastName, phone, dibsStudioId }: CreateDibsUserArgs,
  signal?: AbortSignal,
): Promise<number> {
  const response = await client.post(
    'create-new-dibs-user',
    {
      thisdata: {
        email,
        // Trimmed HERE, so every caller gets it. Names go straight into confirmation emails and
        // the studio's roster; a leading space from an autofill follows a client around forever.
        firstname: firstName.trim(),
        lastname: lastName.trim(),
        phone: phone?.trim() || null,
        birthday: null,
        dibsStudioId,
        fromWhere: 'mobileApp',
      },
    },
    createUserResponseSchema,
    { signal },
  );

  // code 0 arrives as a 500 and has already thrown by here; this catches the shapes that answer
  // 200 with no usable id. Returning a userid-less "success" is how the widget used to bounce a
  // brand-new client straight back to the login screen.
  if (typeof response.userid !== 'number' || response.userid <= 0) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message:
        response.msg ??
        'We could not finish setting up your account. Please try again, or contact the studio.',
      retriable: true,
      body: response,
    });
  }

  return response.userid;
}

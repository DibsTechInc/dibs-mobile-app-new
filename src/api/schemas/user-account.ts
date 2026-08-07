/**
 * `POST /api/v2/widget/get-user-account` — the signed-in client's Dibs record.
 *
 * This is the endpoint that turns a Firebase session into a Dibs `userid`, which every other
 * authenticated call needs. Mounted behind `requireWidgetAuth`, which verifies the token AND
 * checks that the `email` in the body is the token's own — so it can only ever return you.
 *
 * Request: `{ email, dibsId }`. Response (services/widget/get-user-has-account.js):
 *   `{ hasAccount, info: { id, email, firstName, ... }, stripeIdAtThisStudio, stripeIdAtDibs }`
 *
 * ⚠️ The lookup is `where: { email }` — CASE SENSITIVE, unlike the auth middleware, which
 * lowercases. Send the address exactly as Firebase holds it (which is what the user typed when
 * the Dibs row was created); lowercasing it here can turn a real account into `hasAccount: false`.
 *
 * ⚠️ It returns Stripe customer ids. The app reads none of them: `dibs_user_studios` ids belong
 * to the backend's charge paths, and a client-side copy is a copy that can go stale or be sent
 * to the wrong place. They are typed here so the schema matches reality, and used nowhere.
 */
import { z } from 'zod';

export const userAccountInfoSchema = z
  .object({
    id: z.number(),
    email: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    mobilephone: z.string().nullable().optional(),
    birthday: z.string().nullable().optional(),
    pictureUrl: z.string().nullable().optional(),
    country: z.string().nullable().optional(),
    default_currency: z.string().nullable().optional(),
    waiverSigned: z.boolean().nullable().optional(),
    campaign_notification: z.string().nullable().optional(),
    emergencycontactname: z.string().nullable().optional(),
    emergencycontactphone: z.string().nullable().optional(),
    emergencycontactrelationship: z.string().nullable().optional(),
    /** Whether this client has ever set a Firebase password (drives "set" vs "change" copy). */
    firebase_auth_pwd: z.boolean().nullable().optional(),
    invite_code_to_refer: z.string().nullable().optional(),
  })
  .passthrough();

export const userAccountSchema = z
  .object({
    hasAccount: z.boolean(),
    // `{}` when there is no account — an empty object, not null.
    info: z.union([userAccountInfoSchema, z.object({}).passthrough()]),
    stripeIdAtThisStudio: z.string().nullable().optional(),
    stripeIdAtDibs: z.string().nullable().optional(),
  })
  .passthrough();

export type UserAccountResponse = z.infer<typeof userAccountSchema>;
export type UserAccountInfo = z.infer<typeof userAccountInfoSchema>;

/**
 * The bit of the account the app actually holds on to.
 *
 * Narrow on purpose. The response carries Stripe ids, a referral code, and emergency contacts;
 * a session does not need any of them, and what a session does not hold cannot leak out of it.
 *
 * `phone` is here because the profile form edits it and needs the current value to compare
 * against. It is the client's own contact detail, not a pointer into another system — the test
 * for admitting a field is whether the app would be wrong to act on it, not whether it is
 * personal.
 *
 * `platformStripeCustomerId` is the ONE exception to "the app reads none of the Stripe ids", and
 * it earns it by preventing a specific bug. `create-setup-intent` mints a NEW platform customer
 * when it is called without one, and writes it to `dibs_users.stripeid` **with no environment
 * branch** — a sandbox `cus_` landing in the column production charge paths read raw. Passing the
 * existing id is what keeps that branch from ever running. It is safe to carry because this
 * endpoint already returns the environment-correct value (`isProduction ? stripeid_prod :
 * stripeid_test`, `services/widget/get-user-has-account.js:51`), so the app never has to choose.
 *
 * `stripeIdAtThisStudio` is still deliberately dropped: nothing in the app needs the connected
 * customer, and the charge paths resolve it server-side against the studio being charged.
 */
export interface AccountIdentity {
  userid: number;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  /** The client's customer on the Dibs PLATFORM account, for this environment. Never charged. */
  platformStripeCustomerId: string | null;
}

export function toAccountIdentity(response: UserAccountResponse): AccountIdentity | null {
  const info = response.info as Partial<UserAccountInfo>;
  if (!response.hasAccount || typeof info?.id !== 'number') return null;
  return {
    userid: info.id,
    email: info.email ?? null,
    firstName: info.firstName?.trim() || null,
    lastName: info.lastName?.trim() || null,
    phone: info.mobilephone?.trim() || null,
    platformStripeCustomerId: response.stripeIdAtDibs?.trim() || null,
  };
}

/**
 * `POST /api/v2/create-new-dibs-user` — creates the Dibs row for a new client.
 *
 * The `code` field is the contract (services/users/create-new-dibs-user.js):
 *   1  — created
 *   11 — the email already had a Dibs account, now associated with this studio
 *   18 — already had an account AND was already associated with this studio
 *   2  — created, but the phone number belongs to another account
 *   0  — creation genuinely failed (the controller answers 500 for this one)
 *
 * 11 and 18 are NOT errors for us: one Dibs identity spans every studio, so a client who has
 * booked at another studio on Dibs already has a row, and signing up here just associates it.
 */
export const createUserResponseSchema = z
  .object({
    code: z.number().optional(),
    userid: z.number().nullable().optional(),
    msg: z.string().optional(),
    alreadyExisted: z.boolean().optional(),
  })
  .passthrough();

export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;

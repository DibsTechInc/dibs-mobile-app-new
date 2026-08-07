/**
 * The card write paths: add, remove, set default.
 *
 * Read `src/api/schemas/stripe-setup.ts` first — it explains the two-customer model these calls
 * move between. Sequence ported from `docs/verified-widget-sequences.md` § A1, which was traced
 * from widget source rather than guessed.
 */
import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import type { RemoveCardPayload } from '@/domain/payments/cards';
import {
  cardMutationResponseSchema,
  connectedCustomerResponseSchema,
  publishableKeyResponseSchema,
  setupIntentResponseSchema,
} from '../schemas/stripe-setup';

/**
 * The Stripe publishable key for whatever environment this API host is.
 *
 * Fetched, never bundled — that is what makes a local or staging build automatically sandbox and a
 * production build automatically live, with no key anywhere in `src/` (invariant 7). Verified
 * 2026-08-06: staging returns `pk_test_…`, `api.dibsonline.com` returns `pk_live_…`.
 */
export async function fetchPublishableKey(
  client: ApiClient,
  signal?: AbortSignal,
): Promise<string> {
  const response = await client.post('get-stripe-publishable-key', {}, publishableKeyResponseSchema, {
    signal,
  });

  const key = response.stripePublishableKey?.trim();
  // The service returns `undefined` when the env var is unset, and its catch `return err`s
  // without ever calling res.json. Without this the Stripe SDK is initialized with `undefined`
  // and fails later, at the PaymentSheet, where the message means nothing to anyone.
  if (!key) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'Payments are unavailable right now. Please try again shortly.',
      retriable: true,
      body: response,
    });
  }

  return key;
}

export interface CreateSetupIntentArgs {
  userid: number;
  dibsStudioId: number;
  email: string;
  /** Shown on the Stripe customer. Cosmetic, but it is what a studio sees in their dashboard. */
  name: string;
  /**
   * The client's EXISTING platform customer (`stripeIdAtDibs` from `get-user-account`).
   *
   * ⚠️ **Always pass this when it exists.** With no `customerid` the service mints a new platform
   * customer and writes it to `dibs_users.stripeid` **with no environment branch** — planting a
   * sandbox `cus_` in the column the PRODUCTION charge paths read raw, on top of whatever pointer
   * was there. Passing the existing id skips that branch entirely. This is also why the caller
   * must not "helpfully" retry with the argument omitted.
   */
  customerId: string | null;
}

/**
 * Start adding a card. Returns the client secret the PaymentSheet confirms.
 *
 * The SetupIntent is created on the **Dibs platform** account (`onDibs: true`), matching the
 * widget. `usage: 'off_session'` is set server-side, which is what lets the card be charged later
 * without the client present — a subscription renewal, or a booking made by the studio.
 */
export async function createSetupIntent(
  client: ApiClient,
  { userid, dibsStudioId, email, name, customerId }: CreateSetupIntentArgs,
  signal?: AbortSignal,
): Promise<{ clientSecret: string; setupIntentId: string | null }> {
  const response = await client.post(
    'stripe/create-setup-intent',
    { userid, dibsStudioId, email, name, customerid: customerId ?? undefined, onDibs: true },
    setupIntentResponseSchema,
    { authenticated: true, signal },
  );

  // Checked on the SECRET, not on the absence of `error`: the service's catch returns the raw
  // error object, so a failure can arrive as any shape at all. The only proof of success is the
  // thing we came for.
  if (!response.clientSecret) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message: response.error ?? 'We could not start adding your card. Please try again.',
      retriable: true,
      body: response,
    });
  }

  return { clientSecret: response.clientSecret, setupIntentId: response.setupIntentId ?? null };
}

/**
 * Make sure this client has a customer on the studio's connected account.
 *
 * Idempotent — it returns the existing id when there is one and creates a customer only when there
 * is not, storing it in the environment-correct column. It does **not** move the card; the clone
 * happens at charge time.
 *
 * Called after a card is added so that the connected customer exists before the first charge needs
 * it. Failing here is NOT a failed card-add: the card is already attached to the platform customer
 * and the charge path creates the connected customer itself if it is still missing. So the caller
 * treats a rejection as a warning, never as "your card was not saved".
 */
export async function ensureConnectedCustomer(
  client: ApiClient,
  { userid, dibsStudioId }: { userid: number; dibsStudioId: number },
  signal?: AbortSignal,
): Promise<string | null> {
  const response = await client.post(
    'stripe/create-user-connected',
    // `dibsId`, not `dibsStudioId` — this endpoint's own parameter name.
    { userid, dibsId: dibsStudioId },
    connectedCustomerResponseSchema,
    { authenticated: true, signal },
  );

  return response.stripeConnectedId?.trim() || null;
}

/**
 * Remove a saved card from BOTH Stripe accounts.
 *
 * The endpoint matches by card ATTRIBUTES, not by PaymentMethod id — which is exactly what lets it
 * detach the platform copy and the connected copy of one card in a single call. Build the payload
 * with `toRemoveCardPayload`, which sends Stripe's own raw values rather than our display ones.
 */
export async function removeCard(
  client: ApiClient,
  {
    userid,
    dibsStudioId,
    card,
  }: { userid: number; dibsStudioId: number; card: RemoveCardPayload },
  signal?: AbortSignal,
): Promise<void> {
  const response = await client.post(
    'stripe/remove-card',
    // `dibsId` again, and the card rides under `cardInfo`.
    { userid, dibsId: dibsStudioId, cardInfo: { platform: card.platform, card: card.card } },
    cardMutationResponseSchema,
    { authenticated: true, signal },
  );

  if (response.success !== true) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message:
        response.message ?? 'We could not remove that card. Please refresh and try again.',
      // "Could not find the card to remove" does not resolve itself on a retry — it means the
      // list is stale, and the fix is a refresh, which the caller does anyway.
      retriable: false,
      body: response,
    });
  }
}

/**
 * Make a card the studio's default for this client.
 *
 * The durable default lives on the CONNECTED customer's `invoice_settings.default_payment_method`,
 * because that is the account every charge runs on. Passing `platform` matters: a `'Dibs'` card
 * has to be cloned onto the connected customer before it can be that account's default, and the
 * service does that itself — but only if it is told which kind of card this is.
 */
export async function setDefaultCard(
  client: ApiClient,
  {
    userid,
    dibsStudioId,
    paymentMethodId,
    platform,
  }: { userid: number; dibsStudioId: number; paymentMethodId: string; platform: string },
  signal?: AbortSignal,
): Promise<void> {
  const response = await client.post(
    'stripe/set-default-card',
    { userid, dibsStudioId, paymentMethodId, platform },
    cardMutationResponseSchema,
    { authenticated: true, signal },
  );

  if (response.success !== true) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message:
        // `error` here is a machine code (`no_connected_customer`, `invalid_payment_method_id`),
        // never client-facing copy — so it is deliberately not surfaced verbatim.
        'We could not set that as your default card. Please try again.',
      retriable: true,
      body: response,
    });
  }
}

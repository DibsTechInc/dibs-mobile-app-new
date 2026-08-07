/**
 * The three reads behind the wallet: passes, credit, saved cards.
 *
 * Each one defends against the same backend habit — answering HTTP 200 with something that is not
 * the success shape. A screen must never render a failure as an empty wallet.
 */
import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import { creditResponseSchema } from '../schemas/credit';
import {
  paymentMethodsResponseSchema,
  type StripePaymentMethod,
} from '../schemas/payments';
import { passesResponseSchema, type Pass } from '../schemas/passes';

export interface WalletReadArgs {
  userid: number;
  dibsStudioId: number;
}

/**
 * The client's passes at this studio.
 *
 * Since 2026-08-06 the endpoint filters placeholder passes and returns unlimited ones (see
 * `src/api/schemas/passes.ts`). `domain/passes` filters again anyway.
 *
 * On failure the service now answers **500 with no `passes` key** — deliberately, so a caller
 * keeps its last known list rather than wiping it. That 500 becomes an `ApiError` in the client,
 * which TanStack Query surfaces as an error while leaving the previous data in place.
 */
export async function fetchPasses(
  client: ApiClient,
  { userid, dibsStudioId }: WalletReadArgs,
  signal?: AbortSignal,
): Promise<Pass[]> {
  const response = await client.post(
    'get-passes',
    { userid, dibsStudioId },
    passesResponseSchema,
    { authenticated: true, signal },
  );

  // An older build's error path answered 200 with no `passes`. Absent is not empty.
  if (!Array.isArray(response.passes)) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'We could not read your passes just now.',
      retriable: true,
      body: response,
    });
  }

  return response.passes;
}

/**
 * The client's studio-credit balance, in dollars.
 *
 * Returns 0 for a client with no credit row — that is the endpoint's own answer, and a real state.
 * A non-number means the query failed; see `src/api/schemas/credit.ts`.
 */
export async function fetchCredit(
  client: ApiClient,
  { userid, dibsStudioId }: WalletReadArgs,
  signal?: AbortSignal,
): Promise<number> {
  const balance = await client.post('get-credit', { userid, dibsStudioId }, creditResponseSchema, {
    authenticated: true,
    signal,
  });

  // In development the schema throws before this. In production the client passes the raw body
  // through by design, so an error object would arrive here and format as `$NaN`.
  if (typeof balance !== 'number' || !Number.isFinite(balance)) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'We could not read your credit balance just now.',
      retriable: true,
      body: balance,
    });
  }

  return balance;
}

/**
 * What came back from Stripe, and whether we actually managed to ask.
 *
 * `lookupFailed` travels with the cards rather than being thrown, because a PARTIAL failure is
 * real and common: the connected-account lookup can fail while the platform one succeeds, and the
 * cards we did get are still worth showing. The screen shows them AND says the list may be
 * incomplete. Throwing would discard good data; ignoring the flag would present an incomplete
 * list as complete.
 */
export interface PaymentMethodsResult {
  /** Raw, un-merged. `domain/payments` merges and de-duplicates these two. */
  platformCards: StripePaymentMethod[];
  connectedCards: StripePaymentMethod[];
  /** True when at least one Stripe/DB lookup failed. Absent on older builds → false. */
  lookupFailed: boolean;
  lookupErrorCodes: string[];
  /** The connected customer's invoice default, when the backend could read it. */
  defaultPaymentMethodId: string | null;
  defaultFingerprint: string | null;
}

export async function fetchPaymentMethods(
  client: ApiClient,
  { userid, dibsStudioId }: WalletReadArgs,
  signal?: AbortSignal,
): Promise<PaymentMethodsResult> {
  const response = await client.post(
    'stripe/get-all-payments',
    { userid, dibsStudioId },
    paymentMethodsResponseSchema,
    { authenticated: true, signal },
  );

  const platformCards = response.paymentsDibs;
  const connectedCards = response.paymentsConnectedAccount;

  // Neither array present is the `apiFailureWrapper` body — a total failure wearing a 200. With
  // no cards AND no flag, there is nothing true we could put on screen.
  if (!Array.isArray(platformCards) && !Array.isArray(connectedCards)) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'We could not reach Stripe to load your payment methods.',
      retriable: true,
      body: response,
    });
  }

  return {
    platformCards: Array.isArray(platformCards) ? platformCards : [],
    connectedCards: Array.isArray(connectedCards) ? connectedCards : [],
    lookupFailed: response.lookupFailed === true,
    lookupErrorCodes: (response.lookupErrors ?? [])
      .map((entry) => entry.code)
      .filter((code): code is string => typeof code === 'string'),
    defaultPaymentMethodId: response.defaultPaymentMethodId ?? null,
    defaultFingerprint: response.defaultFingerprint ?? null,
  };
}

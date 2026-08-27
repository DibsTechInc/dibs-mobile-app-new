/**
 * Buying a class pack with a card, in two calls.
 *
 * Both endpoints answer with real HTTP statuses and a stable `{ ok, code, message }` body, so a
 * refusal arrives as a `PurchaseRefusedError` whose `code` says WHICH refusal. That is what lets
 * the screen distinguish "the price updated" (re-render and let them confirm) from "that is a
 * membership, talk to the studio" — two very different sentences for the same 409.
 */
import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import {
  confirmPackagePurchaseResponseSchema,
  createPackagePaymentIntentResponseSchema,
  packageRefusalSchema,
  type ConfirmPackagePurchaseResponse,
  type PackageCreditSplit,
  type PackagePriceBreakdown,
} from '../schemas/package-purchase';

export class PurchaseRefusedError extends ApiError {
  readonly refusalCode: string;
  /** Present on `price_changed`: the server's own pricing. */
  readonly breakdown: PackagePriceBreakdown | null;
  /** Present on the credit refusals: the server's fresh split, for re-rendering true figures. */
  readonly creditSplit: PackageCreditSplit | null;
  /** True when the server confirmed no money moved. */
  readonly nothingCharged: boolean;

  constructor(args: {
    status: number;
    refusalCode: string;
    message: string;
    breakdown?: PackagePriceBreakdown | null;
    creditSplit?: PackageCreditSplit | null;
    nothingCharged?: boolean;
    body: unknown;
  }) {
    super({
      status: args.status,
      // A refusal is a decision, not a fault: `describeApiError` must not overwrite the server's
      // sentence with "the studio's system is having trouble".
      code: 'bad_request',
      message: args.message,
      retriable: false,
      body: args.body,
    });
    this.name = 'PurchaseRefusedError';
    this.refusalCode = args.refusalCode;
    this.breakdown = args.breakdown ?? null;
    this.creditSplit = args.creditSplit ?? null;
    this.nothingCharged = args.nothingCharged ?? false;
  }
}

function asRefusal(error: unknown): never {
  if (error instanceof ApiError && error.status !== null) {
    const parsed = packageRefusalSchema.safeParse(error.body);
    if (parsed.success) {
      throw new PurchaseRefusedError({
        status: error.status,
        refusalCode: parsed.data.code,
        message: parsed.data.message,
        breakdown: parsed.data.breakdown ?? null,
        creditSplit: parsed.data.creditSplit ?? null,
        nothingCharged: parsed.data.nothingCharged ?? false,
        body: error.body,
      });
    }
  }
  throw error;
}

export interface CreatePackagePaymentIntentArgs {
  dibsStudioId: number;
  packageId: number;
  /**
   * What the app is SHOWING, in cents. The server prices the package itself and refuses to create
   * a PaymentIntent if the two disagree — which is what makes it impossible to charge a figure that
   * was not on screen. Never send a number the client did not see.
   */
  displayedTotalCents: number;
  /**
   * The client's own choice about their credit — a yes/no, never a figure. Default ON is a
   * product decision: credit is money they already gave the studio.
   */
  applyCredit?: boolean;
  /**
   * The credit portion the app DISPLAYED, in cents, from `domain/credit/split.ts`. The server
   * resolves the split from the LIVE balance and refuses `credit_changed` on a mismatch — the app
   * never decides how much credit is spent, only says what it showed. Sending a number (even 0)
   * is ALSO what marks this build as credit-aware: an omitted value keeps the server's legacy
   * full-price behavior.
   */
  displayedCreditCents?: number;
}

export async function createPackagePaymentIntent(
  client: ApiClient,
  {
    dibsStudioId,
    packageId,
    displayedTotalCents,
    applyCredit,
    displayedCreditCents,
  }: CreatePackagePaymentIntentArgs,
  signal?: AbortSignal,
) {
  try {
    // NOTE: no `userid`. See the warning in schemas/package-purchase.ts — adding one changes the
    // server's auth gate.
    return await client.post(
      'checkout/package/create-payment-intent',
      {
        dibsStudioId,
        packageId,
        displayedTotalCents,
        ...(typeof applyCredit === 'boolean' ? { applyCredit } : {}),
        ...(typeof displayedCreditCents === 'number' ? { displayedCreditCents } : {}),
      },
      createPackagePaymentIntentResponseSchema,
      { authenticated: true, signal },
    );
  } catch (error) {
    return asRefusal(error);
  }
}

/**
 * Buy a package paid for ENTIRELY by studio credit. One call, no PaymentSheet.
 *
 * Reached only when the split resolves `credit-only` — Stripe rejects a $0 PaymentIntent, so a
 * fully-covered package cannot go down the card flow at all. A PARTIAL split is not this
 * endpoint's job and it refuses with `insufficient_credit` carrying both figures.
 */
export async function purchasePackageWithCredit(
  client: ApiClient,
  {
    dibsStudioId,
    packageId,
    displayedTotalCents,
  }: { dibsStudioId: number; packageId: number; displayedTotalCents: number },
  signal?: AbortSignal,
): Promise<ConfirmPackagePurchaseResponse> {
  try {
    // NOTE: no `userid`. Same auth trap as every other endpoint here.
    return await client.post(
      'checkout/package/purchase-with-credit',
      { dibsStudioId, packageId, displayedTotalCents },
      confirmPackagePurchaseResponseSchema,
      { authenticated: true, signal },
    );
  } catch (error) {
    return asRefusal(error);
  }
}

export async function confirmPackagePurchase(
  client: ApiClient,
  { dibsStudioId, paymentIntentId }: { dibsStudioId: number; paymentIntentId: string },
  signal?: AbortSignal,
): Promise<ConfirmPackagePurchaseResponse> {
  try {
    // `dibsStudioId` exists ONLY to pick the connected account the PaymentIntent lives on. Every
    // purchase fact — who, which package, what it cost — comes from metadata the server wrote.
    return await client.post(
      'checkout/package/confirm-purchase',
      { dibsStudioId, paymentIntentId },
      confirmPackagePurchaseResponseSchema,
      { authenticated: true, signal },
    );
  } catch (error) {
    return asRefusal(error);
  }
}

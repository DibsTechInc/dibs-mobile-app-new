/**
 * Booking a class with a card, in two calls.
 *
 * Both endpoints answer with real HTTP statuses and a stable `{ ok, code, message }` body, so a
 * refusal arrives as an `ApiError` whose `code` says WHICH refusal. That is what lets the screen
 * distinguish "the price updated" (re-render and let them confirm) from "that class just filled"
 * (say so, and say nothing was charged) — two very different sentences for the same 409.
 */
import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import {
  bookingRefusalSchema,
  createClassPaymentIntentResponseSchema,
  confirmClassBookingResponseSchema,
  type ClassPriceBreakdown,
  type ConfirmClassBookingResponse,
} from '../schemas/class-booking';

/** A named refusal from either endpoint. `code` is an OPEN enum — never assume it is exhaustive. */
export class BookingRefusedError extends ApiError {
  readonly refusalCode: string;
  /** Present on `price_changed` and on the no-charge refusals: the server's own pricing. */
  readonly breakdown: ClassPriceBreakdown | null;
  /** True when the server confirmed no money moved. */
  readonly nothingCharged: boolean;

  constructor(args: {
    status: number;
    refusalCode: string;
    message: string;
    breakdown?: ClassPriceBreakdown | null;
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
    this.name = 'BookingRefusedError';
    this.refusalCode = args.refusalCode;
    this.breakdown = args.breakdown ?? null;
    this.nothingCharged = args.nothingCharged ?? false;
  }
}

/**
 * The ApiClient throws a plain `ApiError` for any non-2xx, carrying the parsed body. This lifts
 * the ones that are really refusals into something the screen can branch on.
 */
function asRefusal(error: unknown): never {
  if (error instanceof ApiError && error.status !== null) {
    const parsed = bookingRefusalSchema.safeParse(error.body);
    if (parsed.success) {
      throw new BookingRefusedError({
        status: error.status,
        refusalCode: parsed.data.code,
        message: parsed.data.message,
        breakdown: parsed.data.breakdown ?? null,
        nothingCharged: parsed.data.nothingCharged ?? false,
        body: error.body,
      });
    }
  }
  throw error;
}

export interface CreateClassPaymentIntentArgs {
  dibsStudioId: number;
  eventId: number;
  /**
   * What the app is SHOWING, in cents, from `resolveClassCharge`. The server prices the class
   * itself and refuses to create a PaymentIntent if the two disagree — which is what makes it
   * impossible to charge a figure that was not on screen. Never send a number the client did not
   * see.
   */
  displayedTotalCents: number;
}

export async function createClassPaymentIntent(
  client: ApiClient,
  { dibsStudioId, eventId, displayedTotalCents }: CreateClassPaymentIntentArgs,
  signal?: AbortSignal,
) {
  try {
    // NOTE: no `userid`. See the warning in schemas/class-booking.ts — adding one changes the
    // server's auth gate.
    return await client.post(
      'checkout/class/create-payment-intent',
      { dibsStudioId, eventId, displayedTotalCents },
      createClassPaymentIntentResponseSchema,
      { authenticated: true, signal },
    );
  } catch (error) {
    return asRefusal(error);
  }
}

export async function confirmClassBooking(
  client: ApiClient,
  { dibsStudioId, paymentIntentId }: { dibsStudioId: number; paymentIntentId: string },
  signal?: AbortSignal,
): Promise<ConfirmClassBookingResponse> {
  try {
    // `dibsStudioId` exists ONLY to pick the connected account the PaymentIntent lives on. Every
    // booking fact — who, which class, what it cost — comes from metadata the server wrote itself.
    return await client.post(
      'checkout/class/confirm-booking',
      { dibsStudioId, paymentIntentId },
      confirmClassBookingResponseSchema,
      { authenticated: true, signal },
    );
  } catch (error) {
    return asRefusal(error);
  }
}

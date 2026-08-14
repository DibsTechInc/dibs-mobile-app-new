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
  bookWithPassResponseSchema,
  createClassPaymentIntentResponseSchema,
  confirmClassBookingResponseSchema,
  dropClassResponseSchema,
  type BookWithPassResponse,
  type ClassPriceBreakdown,
  type ConfirmClassBookingResponse,
  type DropClassResponse,
} from '../schemas/class-booking';

/** A named refusal from either endpoint. `code` is an OPEN enum — never assume it is exhaustive. */
export class BookingRefusedError extends ApiError {
  readonly refusalCode: string;
  /** Present on `price_changed` and on the no-charge refusals: the server's own pricing. */
  readonly breakdown: ClassPriceBreakdown | null;
  /** True when the server confirmed no money moved. */
  readonly nothingCharged: boolean;
  /**
   * On `already_booked`: live spots the client holds in this class. Null when the server did not
   * say — an older build, or a different refusal entirely.
   */
  readonly existingBookingCount: number | null;

  constructor(args: {
    status: number;
    refusalCode: string;
    message: string;
    breakdown?: ClassPriceBreakdown | null;
    nothingCharged?: boolean;
    existingBookingCount?: number | null;
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
    this.existingBookingCount = args.existingBookingCount ?? null;
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
        existingBookingCount: parsed.data.existingBookingCount ?? null,
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
  /**
   * Book a SECOND spot in a class the client is already in.
   *
   * Sent only after the server has refused with `already_booked` and the client has explicitly
   * tapped through that refusal. The server takes a strict `=== true`, and this must never be
   * derived from anything other than that tap — an `allowDuplicate` that rides along on an
   * unrelated retry is a silent second charge.
   */
  allowDuplicate?: boolean;
}

export async function createClassPaymentIntent(
  client: ApiClient,
  { dibsStudioId, eventId, displayedTotalCents, allowDuplicate }: CreateClassPaymentIntentArgs,
  signal?: AbortSignal,
) {
  try {
    // NOTE: no `userid`. See the warning in schemas/class-booking.ts — adding one changes the
    // server's auth gate.
    return await client.post(
      'checkout/class/create-payment-intent',
      {
        dibsStudioId,
        eventId,
        displayedTotalCents,
        // Omitted entirely unless asked for, so the request carries no duplicate-booking field at
        // all on the ordinary path.
        ...(allowDuplicate === true ? { allowDuplicate: true } : {}),
      },
      createClassPaymentIntentResponseSchema,
      { authenticated: true, signal },
    );
  } catch (error) {
    return asRefusal(error);
  }
}

export interface BookClassWithPassArgs {
  dibsStudioId: number;
  eventId: number;
  /**
   * Which pass to spend. Optional — the server chooses when it is omitted, using the same rule the
   * app's `choosePassForClass` implements (unlimited first, then soonest expiry).
   *
   * It is a REQUEST, not an instruction: the server verifies the id against the client's own
   * covering passes and refuses with `pass_not_usable` otherwise. An unchecked id would let
   * somebody spend an expired pass, a placeholder hold, or another client's pass.
   */
  passId?: number | null;
  /**
   * Spend a pass use on a SECOND spot in a class the client is already in. Same contract and same
   * caution as the card path — a pass use is money too.
   */
  allowDuplicate?: boolean;
}

/**
 * Book a class with a pass the client already holds. ONE call, no PaymentSheet, no money.
 *
 * The seat and the pass use are both claimed by atomic conditional UPDATEs on the server, in that
 * order, so a class that fills or a pass spent on another device refuses cleanly with nothing
 * consumed.
 */
export async function bookClassWithPass(
  client: ApiClient,
  { dibsStudioId, eventId, passId, allowDuplicate }: BookClassWithPassArgs,
  signal?: AbortSignal,
): Promise<BookWithPassResponse> {
  try {
    // NOTE: no `userid`. Same auth trap as the card endpoints.
    return await client.post(
      'checkout/class/book-with-pass',
      {
        dibsStudioId,
        eventId,
        ...(passId ? { passId } : {}),
        ...(allowDuplicate === true ? { allowDuplicate: true } : {}),
      },
      bookWithPassResponseSchema,
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

/**
 * Cancel a booking.
 *
 * Body is lookup keys ONLY and the server refuses anything else with `unexpected_field` — do not
 * add `earlyDrop` here to "help" it. Whether the drop is early, and therefore whether the class
 * comes back, is the server's decision read from the studio's clock and its cancel window.
 */
export async function dropClass(
  client: ApiClient,
  { dibsTransactionId, eventId }: { dibsTransactionId: number; eventId: number },
  signal?: AbortSignal,
): Promise<DropClassResponse> {
  try {
    return await client.post(
      'checkout/class/drop',
      { dibsTransactionId, eventId },
      dropClassResponseSchema,
      { authenticated: true, signal },
    );
  } catch (error) {
    return asRefusal(error);
  }
}

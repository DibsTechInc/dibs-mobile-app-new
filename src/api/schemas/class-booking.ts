/**
 * The two card-booking endpoints (`MOBILE_MASTER_PLAN` §7.8, Option B).
 *
 *   POST /checkout/class/create-payment-intent   → an UNCONFIRMED, manual-capture PaymentIntent
 *   POST /checkout/class/confirm-booking          → claim the seat, capture, record the booking
 *
 * Both are mounted with `requireWidgetAuth`, so both carry the Firebase token the ApiClient
 * already attaches.
 *
 * ⚠️ **Never add `userid` to either request body.** `requireWidgetAuth` is
 * `[isWidgetUserAuthenticated, isRequestingOwnData]`, and the second only compares when
 * `req.body.userid !== undefined`. The handlers read the id from the VERIFIED token; a `userid` in
 * the body would silently change what the gate does. The same warning is on the route mount.
 *
 * Unlike most of dibs-api these routes answer with real HTTP status codes and a stable
 * `{ ok, code, message }` shape, so the client can branch on `code` rather than sniffing prose.
 */
import { z } from 'zod';

/**
 * The server's own pricing, echoed back so the app can render exactly what will be charged.
 * Cents throughout — a float total is how a comparison ends up off by one.
 */
export const classPriceBreakdownSchema = z
  .object({
    priceAvailable: z.boolean(),
    isFree: z.boolean(),
    listPriceCents: z.number(),
    pricingRuleId: z.number().nullable().optional(),
    pricingRuleName: z.string().nullable().optional(),
    pricingRuleDescription: z.string().nullable().optional(),
    discountedPriceCents: z.number().nullable(),
    subtotalCents: z.number(),
    taxRatePercent: z.number(),
    taxCents: z.number(),
    totalCents: z.number(),
  })
  .passthrough();

export type ClassPriceBreakdown = z.infer<typeof classPriceBreakdownSchema>;

export const createClassPaymentIntentResponseSchema = z
  .object({
    ok: z.literal(true),
    paymentIntentId: z.string(),
    paymentIntentClientSecret: z.string(),
    /**
     * Scoped access to the client's saved cards inside the sheet. A CustomerSession, NOT an
     * ephemeral key: ephemeral keys must be minted with the exact API version the mobile SDK
     * expects, and a mismatch means PaymentSheet fails to load.
     */
    customerSessionClientSecret: z.string(),
    customerId: z.string(),
    /**
     * The studio's connected account. The SDK has to be initialised against it before it can
     * confirm this PaymentIntent — see `features/payments/stripeSession.ts`.
     */
    stripeAccountId: z.string(),
    amountCents: z.number(),
    currency: z.string(),
    breakdown: classPriceBreakdownSchema,
  })
  .passthrough();

/**
 * Every refusal. Treat this as an OPEN enum — an unrecognised code means "we cannot book", never
 * "carry on". A shipped app cannot be patched for days, so a new server-side refusal must degrade
 * to a safe message rather than to a booking.
 */
export const bookingRefusalSchema = z
  .object({
    ok: z.literal(false),
    code: z.string(),
    message: z.string(),
    breakdown: classPriceBreakdownSchema.optional(),
    /** Set when the refusal happened before any money moved, so the copy can say so. */
    nothingCharged: z.boolean().optional(),
    /**
     * On `already_booked`: how many live spots the client already holds in this class.
     *
     * Carried so the refusal can be an OFFER — "you have 1 spot; book another?" — instead of a
     * wall. Optional because an older backend does not send it; the app must still be able to say
     * something useful without it.
     */
    existingBookingCount: z.number().optional(),
  })
  .passthrough();

export const confirmClassBookingResponseSchema = z
  .object({
    ok: z.literal(true),
    passId: z.number().nullable().optional(),
    purchaseTransactionId: z.number().nullable().optional(),
    redemptionTransactionId: z.number().nullable().optional(),
    attendeeId: z.number().nullable().optional(),
    eventId: z.number().nullable().optional(),
    amountChargedCents: z.number().nullable().optional(),
    eventName: z.string().nullable().optional(),
    startsAt: z.string().nullable().optional(),
    /** True when this call replayed a booking that already existed — a retry, not a second one. */
    alreadyRecorded: z.boolean().optional(),
    /** True when the server recovered a captured payment whose booking had never been written. */
    repaired: z.boolean().optional(),
  })
  .passthrough();

export type ConfirmClassBookingResponse = z.infer<typeof confirmClassBookingResponseSchema>;

/**
 * `POST checkout/class/book-with-pass` — booking with a pass the client already holds.
 *
 * No purchase transaction and no amount: the money lives on the transaction that created the pass,
 * which may have been months ago. A response carrying an `amountChargedCents` here would be a
 * charge that did not happen.
 *
 * Refusals share `bookingRefusalSchema`. Two codes are specific to this path:
 * `no_covering_pass` (they hold nothing that covers this class) and `pass_spent` (it ran out or
 * expired between the screen and the call — nothing was used).
 */
export const bookWithPassResponseSchema = z
  .object({
    ok: z.literal(true),
    passId: z.number().nullable().optional(),
    /** "Month Unlimited" — so the confirmation can say WHICH pass was spent. */
    packageName: z.string().nullable().optional(),
    redemptionTransactionId: z.number().nullable().optional(),
    eventId: z.number().nullable().optional(),
    eventName: z.string().nullable().optional(),
    startsAt: z.string().nullable().optional(),
  })
  .passthrough();

export type BookWithPassResponse = z.infer<typeof bookWithPassResponseSchema>;

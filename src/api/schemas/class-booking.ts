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
    /**
     * What the CARD is charged — the PaymentIntent's own amount.
     *
     * ⚠️ With credit applied this is the REMAINDER, not the class price. The class price is
     * `breakdown.totalCents`. Rendering this as "the total" would under-report what the client is
     * spending, since the credit half is money too.
     */
    amountCents: z.number(),
    currency: z.string(),
    breakdown: classPriceBreakdownSchema,
    /**
     * How much credit endpoint 2 is authorized to take. Echoed from the PaymentIntent's metadata,
     * not recomputed — so the figure the app renders is the one that will actually be consumed.
     * Absent on an older backend, which means no credit was applied.
     */
    creditAppliedCents: z.number().optional(),
    creditBalanceCents: z.number().optional(),
    /**
     * The credit was reduced so the card portion clears Stripe's 50c floor. The client is being
     * asked to spend less credit than they hold, which deserves a sentence rather than a number
     * that looks wrong.
     */
    creditTrimmedForMinimum: z.boolean().optional(),
  })
  .passthrough();

/**
 * Every refusal. Treat this as an OPEN enum — an unrecognised code means "we cannot book", never
 * "carry on". A shipped app cannot be patched for days, so a new server-side refusal must degrade
 * to a safe message rather than to a booking.
 */
/**
 * The server's credit split. Mirrors `domain/credit/split.ts`, which is itself a mirror of
 * `resolve-credit-split.js` — this is the shape that arrives on the wire.
 */
export const creditSplitSchema = z
  .object({
    kind: z.enum(['none', 'partial', 'credit-only']),
    totalCents: z.number(),
    creditAppliedCents: z.number(),
    cardCents: z.number(),
    balanceCents: z.number(),
    trimmedForMinimum: z.boolean().optional(),
  })
  .passthrough();

export type CreditSplitResponse = z.infer<typeof creditSplitSchema>;

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
    /**
     * On `credit_changed`, `credit_covers_class` and `insufficient_credit`: the SERVER's own
     * resolution of the split, against the live balance.
     *
     * The app re-renders from this rather than recomputing — the whole point of those refusals is
     * that the app's figure was stale, so asking it to guess again would reproduce the argument.
     */
    creditSplit: creditSplitSchema.optional(),
    /** The live balance in cents, on the credit refusals. */
    creditBalanceCents: z.number().optional(),
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
/**
 * `POST /checkout/class/book-with-credit` — one call, no PaymentSheet, no card.
 *
 * Used ONLY when the balance covers the class outright. A partial split stays on the two-call card
 * flow, because Stripe rejects a $0 PaymentIntent and a sheet for $0 is not a sheet.
 */
export const bookWithCreditResponseSchema = z
  .object({
    ok: z.literal(true),
    passId: z.number().nullable().optional(),
    transactionId: z.number().nullable().optional(),
    creditAppliedCents: z.number().optional(),
    creditBalanceCents: z.number().optional(),
  })
  .passthrough();

export type BookWithCreditResponse = z.infer<typeof bookWithCreditResponseSchema>;

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

/**
 * `POST checkout/class/drop` — cancelling a booking.
 *
 * `returned` is the server's account of what actually went back, and it is the ONLY thing the
 * screen may report. The app predicts early-vs-late for the confirm copy, but a clock skew or a
 * boundary crossed mid-session makes the prediction wrong, and a screen that says "your class is
 * back" over a `returned: 'none'` contradicts the wallet the client checks next.
 *
 * `'none'` is a legitimate success: a late drop, an unlimited membership, an unpaid hold, and a
 * pass worth $0 all free the spot and return nothing.
 */
export const dropClassResponseSchema = z
  .object({
    ok: z.literal(true),
    dropped: z.literal(true),
    returned: z.enum(['pass', 'credit', 'none']),
    wasEarly: z.boolean(),
    /** Only meaningful when `returned === 'credit'`. */
    creditAmountCents: z.number().nullable().optional(),
    eventId: z.number().nullable().optional(),
    eventName: z.string().nullable().optional(),
  })
  .passthrough();

export type DropClassResponse = z.infer<typeof dropClassResponseSchema>;

/**
 * Buying a class pack with a card, in two calls — the package twin of `class-booking.ts`.
 *
 *   `POST checkout/package/create-payment-intent` → an UNCONFIRMED, manual-capture PaymentIntent
 *   `POST checkout/package/confirm-purchase`      → capture, and create the pass
 *
 * ⚠️ **Neither request body may ever carry a `userid`.** `requireWidgetAuth` is
 * `[isWidgetUserAuthenticated, isRequestingOwnData]`, and the second only compares when
 * `req.body.userid !== undefined`. Both handlers read the id from the VERIFIED Firebase token.
 * Adding a `userid` here silently changes what the server's auth gate does.
 */
import { z } from 'zod';

/** The server's own pricing. Every figure in integer CENTS. */
export const packagePriceBreakdownSchema = z
  .object({
    priceAvailable: z.boolean(),
    listPriceCents: z.number(),
    subtotalCents: z.number(),
    taxRatePercent: z.number(),
    taxCents: z.number(),
    totalCents: z.number(),
  })
  .passthrough();

export type PackagePriceBreakdown = z.infer<typeof packagePriceBreakdownSchema>;

export const createPackagePaymentIntentResponseSchema = z
  .object({
    ok: z.literal(true),
    paymentIntentId: z.string(),
    paymentIntentClientSecret: z.string(),
    /** Puts the client's saved card in the sheet already selected. */
    customerSessionClientSecret: z.string(),
    customerId: z.string(),
    /**
     * The connected account the PaymentIntent lives on. The app has to point the Stripe SDK at it
     * before it can confirm — not a secret; Connect client-side flows are built around the client
     * knowing it.
     */
    stripeAccountId: z.string(),
    amountCents: z.number(),
    currency: z.string(),
    breakdown: packagePriceBreakdownSchema,
    packageName: z.string().nullable().optional(),
  })
  .passthrough();

export const confirmPackagePurchaseResponseSchema = z
  .object({
    ok: z.literal(true),
    passId: z.number().nullable(),
    purchaseTransactionId: z.number().nullable().optional(),
    packageId: z.number().nullable().optional(),
    packageName: z.string().nullable().optional(),
    /** `null` means UNLIMITED — the platform convention. Never render it as a number. */
    totalUses: z.number().nullable().optional(),
    amountChargedCents: z.number().nullable().optional(),
    /** True when a retry replayed a purchase already recorded, rather than making a second one. */
    alreadyRecorded: z.boolean().optional(),
    repaired: z.boolean().optional(),
  })
  .passthrough();

export type ConfirmPackagePurchaseResponse = z.infer<typeof confirmPackagePurchaseResponseSchema>;

/**
 * A named refusal from either endpoint.
 *
 * `code` is an OPEN enum — never assume it is exhaustive. Known values today:
 * `package_not_found` · `package_not_available` · `membership_not_supported` ·
 * `purchase_limit_reached` · `not_first_purchase` · `price_unavailable` · `price_changed` ·
 * `payment_not_authorized` · `payment_canceled` · `payment_intent_not_found` · `not_your_booking`
 * · plus every studio refusal the class flow shares.
 */
export const packageRefusalSchema = z
  .object({
    ok: z.literal(false),
    code: z.string(),
    message: z.string(),
    breakdown: packagePriceBreakdownSchema.optional(),
    nothingCharged: z.boolean().optional(),
  })
  .passthrough();

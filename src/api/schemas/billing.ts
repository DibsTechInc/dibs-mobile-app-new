/**
 * Billing — what has been paid, and what is about to be.
 *
 * Rows arrive ALREADY BUNDLED by `get-account-activity.js`. Do not re-derive the ±60s collapse in
 * TypeScript: a single-session card booking writes a purchase row and a booking row in the same
 * second, and the app would show twice the entries the web does for the same money.
 */
import { z } from 'zod';

/**
 * One bundled event. Deliberately permissive — the library emits several row shapes
 * (`class_booked`, `pass_purchased`, `subscription_started`, credit movements…) and this screen
 * renders a label, a date and an amount. A strict schema would turn a new row type into a thrown
 * error on a money surface.
 */
export const accountActivityRowSchema = z
  .object({
    id: z.union([z.number(), z.string()]).nullable().optional(),
    type: z.string().nullable().optional(),
    /** A real instant. Rendered in the studio's zone, not verbatim. */
    date: z.string().nullable().optional(),
    createdAt: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    itemName: z.string().nullable().optional(),
    /** DOLLARS, as the library emits them. */
    amount: z.number().nullable().optional(),
    amountRefunded: z.number().nullable().optional(),
    creditsSpent: z.number().nullable().optional(),
  })
  .passthrough();

export type AccountActivityRow = z.infer<typeof accountActivityRowSchema>;

export const accountActivityResponseSchema = z
  .object({
    ok: z.literal(true),
    rows: z.array(accountActivityRowSchema),
    totalCount: z.number().nullable().optional(),
    balance: z
      .object({
        credit: z.number().nullable().optional(),
        totalTransactionVolume: z.number().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

export const upcomingPaymentSchema = z
  .object({
    passId: z.number(),
    name: z.string().nullable().optional(),
    /**
     * Epoch SECONDS (Stripe's unit) or null. Null is a real answer — a paused or unresolvable
     * subscription — and renders as "Renews automatically", never as a sentence with a hole in it.
     */
    renewsAtEpochSeconds: z.number().nullable().optional(),
    /** DOLLARS, tax-inclusive when the subscription carries tax rates. */
    chargeAmount: z.number().nullable().optional(),
    /** Tax applies but the total is unknowable — say "plus tax", never quote a figure. */
    hasUnresolvedTax: z.boolean().nullable().optional(),
  })
  .passthrough();

export type UpcomingPayment = z.infer<typeof upcomingPaymentSchema>;

export const upcomingPaymentsResponseSchema = z
  .object({
    ok: z.literal(true),
    renewals: z.array(upcomingPaymentSchema),
    /** Stripe did not fully answer. The list may be incomplete — say so, never imply "none". */
    lookupFailed: z.boolean().nullable().optional(),
  })
  .passthrough();

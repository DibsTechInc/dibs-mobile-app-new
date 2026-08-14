/**
 * Billing — what has been paid, and what is about to be.
 *
 * Rows arrive ALREADY BUNDLED by `get-account-activity.js`. Do not re-derive the ±60s collapse in
 * TypeScript: a single-session card booking writes a purchase row and a booking row in the same
 * second, and the app would show twice the entries the web does for the same money.
 *
 * Shapes below were captured from a real staging response (studio 88, 32 rows) rather than
 * guessed — an earlier version invented `type` / `date` / `itemName` / `amountRefunded` and every
 * one of them was wrong, which would have rendered every row as a fallback label.
 */
import { z } from 'zod';

/**
 * `primary` differs per `activityType`, so it is one permissive object rather than a union —
 * an unknown type must degrade to a readable row, never throw on a money surface.
 *
 * Observed types and the field each one titles from:
 *   `class_booked`              → eventName
 *   `pass_purchased`            → packageName
 *   `credit_used`               → itemName
 *   `comp_credit_added`         → itemName
 *   `session_payment_collected` → eventName
 */
const activityPrimarySchema = z
  .object({
    eventName: z.string().nullable().optional(),
    eventDate: z.string().nullable().optional(),
    packageName: z.string().nullable().optional(),
    itemName: z.string().nullable().optional(),
    passUsed: z
      .object({ id: z.number().nullable().optional(), name: z.string().nullable().optional() })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

export const accountActivityRowSchema = z
  .object({
    /** A STRING with a source prefix — "txn_599875". Unique, so it is the render key. */
    id: z.union([z.string(), z.number()]).nullable().optional(),
    activityType: z.string().nullable().optional(),
    /** A real instant. Rendered in the studio's zone, never verbatim. */
    occurredAt: z.string().nullable().optional(),
    /** DOLLARS. */
    amount: z.number().nullable().optional(),
    /**
     * `'debit'` money out · `'credit'` money in (a comp credit) · `'neutral'` nothing moved.
     * This — not the sign of `amount` — is how direction is expressed.
     */
    amountSign: z.enum(['debit', 'credit', 'neutral']).nullable().optional(),
    refundedAmount: z.number().nullable().optional(),
    paymentMethod: z.string().nullable().optional(),
    primary: activityPrimarySchema.nullable().optional(),
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

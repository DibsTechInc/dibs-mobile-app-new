/**
 * `POST /api/v2/stripe/get-all-payments` — the client's saved cards.
 *
 * Request: `{ dibsStudioId, userid }`. Verified against a live local response 2026-08-06.
 *
 * ── Every saved card can exist TWICE ────────────────────────────────────────────────────────
 * A client has a customer on the Dibs PLATFORM account and, once they have paid a studio, a
 * second customer on that studio's CONNECTED account. The endpoint asks both and returns two
 * arrays. They overlap: the same physical card shows up in each. Merging and de-duplicating them
 * is `src/domain/payments` — never a screen's job.
 *
 * ── `lookupFailed` is the point of this schema ──────────────────────────────────────────────
 * The route answers **HTTP 200 with an `apiFailureWrapper` body** on failure, and its service
 * catches Stripe errors per-array and carries on. So an empty `paymentsDibs` means one of two
 * completely different things:
 *
 *   • this client has no cards on file  — a fact, and a reason to show "add a payment method";
 *   • we could not ask Stripe          — a failure, and a reason to show a Retry.
 *
 * Collapsing them is what left widget clients holding a good card with no way to pay and nothing
 * to retry. `lookupFailed` + `lookupErrors` (added backend-side 2026-07-30) is the flag that tells
 * them apart. Observed live: userid 10 at studio 210 returns
 * `lookupFailed: true, lookupErrors: [{ scope: 'platform', code: 'customer_not_found_on_account' }]`
 * because their stored customer id is a LIVE `cus_` being read with a sandbox key — proof that
 * `resource_missing` does not mean "this client has no cards".
 *
 * Both flags are optional in the schema: an older API build predates them, and their absence must
 * degrade to "we don't know of a failure", not to a schema error on the whole wallet.
 */
import { z } from 'zod';

/**
 * The card details we render. A Stripe PaymentMethod carries far more (checks, networks, radar
 * options, wallet); `passthrough` keeps it without our having to model it.
 */
export const stripeCardSchema = z
  .object({
    brand: z.string().nullable().optional(),
    last4: z.string().nullable().optional(),
    exp_month: z.number().nullable().optional(),
    exp_year: z.number().nullable().optional(),
    /**
     * Stripe's per-card-number identifier, stable across accounts. It is what makes the platform
     * copy and the connected copy of one card recognisable as the same card.
     */
    fingerprint: z.string().nullable().optional(),
    funding: z.string().nullable().optional(),
    display_brand: z.string().nullable().optional(),
  })
  .passthrough();

export const stripePaymentMethodSchema = z
  .object({
    /**
     * ⚠️ TWO prefixes are chargeable: `pm_` AND `card_`. A `card_` id is a PaymentMethod that
     * represents a legacy Card object attached through the pre-2021 Sources API, and it charges
     * normally. Narrowing this to `pm_` caused a two-day production outage in July 2026 that hit
     * 91% of studio 210's active roster. See `src/domain/payments/cards.ts`.
     */
    id: z.string(),
    card: stripeCardSchema.nullable().optional(),
    /** Stamped by the backend on the card matching the connected customer's invoice default. */
    is_default: z.boolean().nullable().optional(),
  })
  .passthrough();

export const paymentMethodsResponseSchema = z
  .object({
    paymentsDibs: z.array(stripePaymentMethodSchema).nullable().optional(),
    paymentsConnectedAccount: z.array(stripePaymentMethodSchema).nullable().optional(),
    /** Absent on older builds. Absent ≠ false is wrong here: absent means "no failure reported". */
    lookupFailed: z.boolean().nullable().optional(),
    lookupErrors: z
      .array(
        z
          .object({
            scope: z.string().optional(),
            code: z.string().optional(),
          })
          .passthrough(),
      )
      .nullable()
      .optional(),
    defaultPaymentMethodId: z.string().nullable().optional(),
    defaultFingerprint: z.string().nullable().optional(),
    /** Stripe customer ids. Returned; deliberately unused — see the note in `user-account.ts`. */
    stripeidDibs: z.string().nullable().optional(),
    stripeidStudio: z.string().nullable().optional(),
  })
  .passthrough();

export type StripePaymentMethod = z.infer<typeof stripePaymentMethodSchema>;
export type PaymentMethodsResponse = z.infer<typeof paymentMethodsResponseSchema>;

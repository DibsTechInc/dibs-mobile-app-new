/**
 * Schemas for the add-a-card sequence.
 *
 * ── Where a card lives, and where it is charged ─────────────────────────────────────────────
 * Two Stripe customers exist for every client:
 *
 *   `stripeIdAtDibs`       → the customer on the **Dibs platform** account. Where a newly added
 *                            card lands, because the SetupIntent is created there (`onDibs: true`).
 *   `stripeIdAtThisStudio` → the customer on the **studio's connected** account. Where every
 *                            charge happens.
 *
 * A card saved on the platform is **not** chargeable by the connected account as it stands — it is
 * cloned across immediately before the charge, which is what `platform: 'Dibs' | 'Studio'` on a
 * merged card row is for (`dibs-widget-new/src/actions/stripe/chargeSavedCardCheckout.js` matches
 * that exact string to decide). Adding a card therefore does two things: attaches it to the
 * platform customer, and makes sure a connected CUSTOMER exists to clone it onto later.
 * `create-user-connected` creates that customer; it does not move the card.
 *
 * Verified 2026-08-06 by reading `services/shared/stripe/create-user-on-stripe-connected.js` and
 * the widget's charge path, and against `docs/verified-widget-sequences.md` § A1.
 */
import { z } from 'zod';

/** `POST /api/v2/get-stripe-publishable-key` — no params. */
export const publishableKeyResponseSchema = z
  .object({
    msg: z.string().optional(),
    stripePublishableKey: z.string().nullable().optional(),
  })
  .passthrough();

/**
 * `POST /api/v2/stripe/create-setup-intent`.
 *
 * ⚠️ Answers HTTP 200 with `{ error }` for a refusal, and the service's outer catch `return err`s
 * — so a failure can arrive as an arbitrary object with no `clientSecret`. The wrapper checks for
 * the secret rather than for the absence of an error.
 */
export const setupIntentResponseSchema = z
  .object({
    clientSecret: z.string().nullable().optional(),
    setupIntentId: z.string().nullable().optional(),
    error: z.string().nullable().optional(),
  })
  .passthrough();

/** `POST /api/v2/stripe/create-user-connected`. */
export const connectedCustomerResponseSchema = z
  .object({
    msg: z.string().optional(),
    stripeConnectedId: z.string().nullable().optional(),
    environment: z.string().optional(),
  })
  .passthrough();

/** `POST /api/v2/stripe/remove-card` and `/stripe/set-default-card`. */
export const cardMutationResponseSchema = z
  .object({
    success: z.boolean().optional(),
    message: z.string().optional(),
    /** set-default-card only: a machine-readable refusal, e.g. `no_connected_customer`. */
    error: z.string().optional(),
    defaultPaymentMethodId: z.string().nullable().optional(),
  })
  .passthrough();

/**
 * `POST /api/v2/widget/first-class-offer` (requireWidgetAuth) — "is there a first-class price at
 * this studio, and does it apply to ME?" (2026-09-10).
 *
 * The answer comes from the SAME function every checkout path prices with
 * (`resolveFirstClassOffer` in dibs-api), so what this says and what Confirm charges cannot
 * disagree. `reason` is an OPEN enum: eligible | inactive | has_visits | has_booking |
 * already_redeemed | unknown_client. An unrecognised value reads as "not eligible".
 *
 * ⚠️ Unlike the checkout endpoints this body DOES carry `userid` — the route's ownership check
 * compares it against the verified token, and the server answers for the TOKEN's identity.
 */
import { z } from 'zod';

export const firstClassOfferResponseSchema = z
  .object({
    success: z.literal(true),
    active: z.boolean(),
    priceCents: z.number().nullable(),
    eligible: z.boolean(),
    reason: z.string(),
    priorVisits: z.number().optional(),
    upcomingBookings: z.number().optional(),
    redeemedAt: z.string().nullable().optional(),
  })
  .passthrough();

export type FirstClassOfferResponse = z.infer<typeof firstClassOfferResponseSchema>;

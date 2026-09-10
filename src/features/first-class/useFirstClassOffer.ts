/**
 * "Does the first-class price apply to me here?" — ONE query, read by every surface that shows
 * the offer (schedule pill, class detail, cart, Home, the post-sign-up sheet) so they cannot
 * disagree (2026-09-10).
 *
 * ── Three states, never collapsed ─────────────────────────────────────────────────────────────
 *   `eligibility` is `{ eligible: true }` ONLY when the endpoint resolved and said so.
 *   It is `{ eligible: false }` when the endpoint resolved and said no.
 *   It is `undefined` for a guest, while resolving, and when the read FAILED. A failed read is
 *   "unknown": every consumer prices normally and says nothing — never "you are not eligible".
 *
 * Invalidated after any successful booking (`useCartCheckout`, `useBookClass`) — a booking is
 * exactly what ends eligibility — and dropped with the rest of the account on sign-out.
 */
import { useQuery } from '@tanstack/react-query';

import { apiClient, fetchFirstClassOffer, queryKeys } from '@/api';
import type { FirstClassOfferResponse } from '@/api/schemas/first-class-offer';
import { studio } from '@/config/studio';
import type { FirstClassEligibility } from '@/domain/cart/first-class';
import { useAuth } from '@/features/auth/AuthProvider';

export interface FirstClassOfferState {
  /** The server's whole answer, once it has arrived. */
  offer: FirstClassOfferResponse | undefined;
  /** See the header: undefined = guest / resolving / failed. */
  eligibility: FirstClassEligibility | undefined;
  /** True only when resolved AND eligible AND the studio's switch is on with a price. */
  isEligible: boolean;
  /** The studio's price in cents, when eligible. */
  priceCents: number | null;
  isResolving: boolean;
}

export function useFirstClassOffer(): FirstClassOfferState {
  const { account, status } = useAuth();
  const userid = account?.userid ?? null;
  const enabled = status === 'signedIn' && typeof userid === 'number' && userid > 0;

  const query = useQuery({
    queryKey: queryKeys.firstClassOffer(userid ?? 0, studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchFirstClassOffer(apiClient, { userid: userid!, dibsStudioId: studio.dibsStudioId }, signal),
    enabled,
    // Short: eligibility ends the moment a booking lands, possibly on another device.
    staleTime: 30 * 1000,
  });

  const offer = query.data;
  const resolved = enabled && offer !== undefined;
  const isEligible =
    resolved && offer.active === true && offer.eligible === true && (offer.priceCents ?? 0) > 0;

  return {
    offer,
    eligibility: resolved ? { eligible: isEligible } : undefined,
    isEligible,
    priceCents: isEligible ? offer.priceCents : null,
    isResolving: enabled && query.isPending,
  };
}

/**
 * The client's raw passes — the input to every coverage decision.
 *
 * ── Why this is separate from `useWallet` ──────────────────────────────────────────────────────
 * `useWallet` runs THREE queries (passes, credit, Stripe cards) and returns a view model shaped for
 * the wallet screen. The schedule and the cart need one of those three, and they need the raw rows
 * rather than the formatted view — `choosePassForClass` reads `private_pass`, `totalUses` and
 * `expiresAt`, none of which survive into `WalletPass`.
 *
 * Calling `useWallet` from the schedule would fire a Stripe payment-methods request every time
 * somebody opened the class list, to answer a question about passes.
 *
 * It shares the SAME query key as the wallet's passes query, so both read one cache entry and one
 * request. Two keys for one endpoint is how a booking screen and an account screen end up
 * disagreeing about whether a membership is live.
 *
 * ── `undefined` until we have asked ────────────────────────────────────────────────────────────
 * Returns `undefined` for a guest and while the request is in flight — deliberately NOT `[]`.
 * Coverage callers treat the two differently: `[]` is "they hold nothing, show a price", and
 * `undefined` is "we have not looked". Both end up showing a price, but only one of them is a
 * claim, and the server checks coverage again either way.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { apiClient, fetchPasses, queryKeys } from '@/api';
import type { Pass } from '@/api/schemas/passes';
import { studio } from '@/config/studio';
import { usablePasses } from '@/domain/passes/select';
import { useAuth } from '@/features/auth/AuthProvider';

export interface ClientPassesState {
  /** Usable passes only — expired, spent and placeholder rows are already gone. */
  passes: Pass[] | undefined;
  isLoading: boolean;
}

export function useClientPasses(): ClientPassesState {
  const { account } = useAuth();
  const userid = account?.userid ?? null;

  const query = useQuery({
    queryKey: queryKeys.passes(userid ?? 0, studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchPasses(apiClient, { userid: userid!, dibsStudioId: studio.dibsStudioId }, signal),
    enabled: userid !== null,
    // A pass count changes when the client books, which they do from this app.
    staleTime: 60 * 1000,
  });

  const passes = useMemo(
    // Filtered here so no caller has to remember to. A placeholder pass is a marker for an
    // outstanding CHARGE, not an entitlement, and letting one reach a coverage decision would
    // book a class against money nobody has paid.
    () => (query.data ? usablePasses(query.data) : undefined),
    [query.data],
  );

  return { passes, isLoading: userid !== null && query.isPending };
}

/**
 * The client's studio credit balance, on its own.
 *
 * Extracted from `useWallet` so checkout can read the balance without also pulling passes and
 * cards. Same query key, so the two share one cache entry and cannot show different numbers on
 * two screens.
 *
 * ── It is DISPLAYED from here and never SPENT from here ─────────────────────────────────────
 * The figure feeds the split the checkout screen shows and the `displayedCreditCents` it sends.
 * The server re-reads the balance, resolves the split itself, and refuses `credit_changed` if the
 * two disagree — which is what makes a stale read here a re-render rather than a wrong charge.
 */
import { useQuery } from '@tanstack/react-query';

import { apiClient, fetchCredit, queryKeys } from '@/api';
import { studio } from '@/config/studio';
import { useAuth } from '@/features/auth/AuthProvider';

export function useCreditBalance() {
  const { account, status } = useAuth();
  const userid = account?.userid ?? null;
  const enabled = status === 'signedIn' && typeof userid === 'number' && userid > 0;

  return useQuery({
    queryKey: queryKeys.credit(userid ?? 0, studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchCredit(apiClient, { userid: userid!, dibsStudioId: studio.dibsStudioId }, signal),
    enabled,
    // Short, because credit moves on other devices and this one feeds a number on a checkout
    // screen. A stale read is corrected by the server, but a fresh one avoids the round trip.
    staleTime: 30 * 1000,
  });
}

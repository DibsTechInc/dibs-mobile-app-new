/**
 * Passes, credit and cards — three independent reads, one view model.
 * Separate queries because they fail independently; one slow section must not blank the others.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { apiClient, fetchCredit, fetchPasses, queryKeys } from '@/api';
import { studio } from '@/config/studio';
import type { SavedCard } from '@/domain/payments/cards';
import { buildWalletData, type WalletData } from '@/domain/wallet/build-wallet';
import { useAuth } from '@/features/auth/AuthProvider';
import { useSavedCards } from '@/features/payments/useSavedCards';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export interface WalletState {
  data: WalletData;
  /** True only while NOTHING has arrived yet — the one moment a full skeleton is honest. */
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<unknown>;
}

export function useWallet(): WalletState {
  const { account } = useAuth();
  const { config, timeZone } = useStudioConfig();
  const userid = account?.userid ?? null;
  // Gated on a resolved userid, not merely on a session. The `?? 0` below is a queryKey
  // placeholder only — these endpoints are keyed by userid, so firing one with 0 asks for
  // somebody else's money. Do not drop `enabled`.
  const enabled = userid !== null;

  const passesQuery = useQuery({
    queryKey: queryKeys.passes(userid ?? 0, studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchPasses(apiClient, { userid: userid!, dibsStudioId: studio.dibsStudioId }, signal),
    enabled,
    staleTime: 60 * 1000,
  });

  const creditQuery = useQuery({
    queryKey: queryKeys.credit(userid ?? 0, studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchCredit(apiClient, { userid: userid!, dibsStudioId: studio.dibsStudioId }, signal),
    enabled,
    // Displayed from here; never SPENT from here — checkout re-reads the balance server-side,
    // because credit can be spent from another device between screens.
    staleTime: 60 * 1000,
  });

  const savedCards = useSavedCards();

  const cards = useMemo(() => {
    if (savedCards.status !== 'ready') return undefined;
    return {
      items: savedCards.cards satisfies SavedCard[],
      hadExpiredCards: savedCards.hadExpiredCards,
      lookupFailed: savedCards.lookupFailed,
    };
  }, [savedCards.status, savedCards.cards, savedCards.hadExpiredCards, savedCards.lookupFailed]);

  const data = useMemo(
    () =>
      buildWalletData({
        passes: { data: passesQuery.data, isPending: passesQuery.isPending, error: passesQuery.error },
        credit: { data: creditQuery.data, isPending: creditQuery.isPending, error: creditQuery.error },
        cards: {
          data: cards,
          isPending: savedCards.status === 'loading' || savedCards.status === 'idle',
          error: savedCards.status === 'error' ? new Error('card lookup failed') : undefined,
        },
        timeZone,
        currency: config?.currency,
      }),
    [
      passesQuery.data,
      passesQuery.isPending,
      passesQuery.error,
      creditQuery.data,
      creditQuery.isPending,
      creditQuery.error,
      cards,
      savedCards.status,
      timeZone,
      config?.currency,
    ],
  );

  return {
    data,
    // Every section, not any — one slow request must not blank the two that already answered.
    isLoading:
      enabled &&
      data.passes.status === 'loading' &&
      data.credit.status === 'loading' &&
      data.cards.status === 'loading',
    isRefreshing: passesQuery.isFetching || creditQuery.isFetching || savedCards.isFetching,
    refresh: () =>
      Promise.all([passesQuery.refetch(), creditQuery.refetch(), savedCards.refresh()]),
  };
}

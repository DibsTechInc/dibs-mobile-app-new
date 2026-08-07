/**
 * The three wallet reads, and the view model built from them.
 *
 * Three separate queries rather than one, because they fail independently and a client should not
 * lose sight of their pass balance because Stripe was slow. `buildWalletData` is what turns three
 * independent states into one screen that tells the truth about each.
 *
 * Every query is gated on a resolved Dibs userid — not merely on a session. All three endpoints
 * are keyed by `userid` and two of them are unauthenticated, so firing one with a placeholder id
 * is a request for somebody else's money.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { apiClient, fetchCredit, fetchPasses, fetchPaymentMethods, queryKeys } from '@/api';
import { studio } from '@/config/studio';
import { mergeSavedCards, type SavedCard } from '@/domain/payments/cards';
import { buildWalletData, type WalletData } from '@/domain/wallet/build-wallet';
import { useAuth } from '@/features/auth/AuthProvider';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export interface WalletState {
  data: WalletData;
  /** True only while NOTHING has arrived yet — the one moment a full skeleton is honest. */
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => void;
}

export function useWallet(): WalletState {
  const { account } = useAuth();
  const { config, timeZone } = useStudioConfig();
  const userid = account?.userid ?? null;
  const enabled = userid !== null;

  const passesQuery = useQuery({
    queryKey: queryKeys.passes(userid ?? 0, studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchPasses(apiClient, { userid: userid!, dibsStudioId: studio.dibsStudioId }, signal),
    enabled,
    // A pass count changes when the client books, which they do from this app — so it is short.
    staleTime: 60 * 1000,
  });

  const creditQuery = useQuery({
    queryKey: queryKeys.credit(userid ?? 0, studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchCredit(apiClient, { userid: userid!, dibsStudioId: studio.dibsStudioId }, signal),
    enabled,
    // Displayed here; NEVER spent from here. Checkout re-fetches the balance before using it
    // (P2 rule, mirroring the widget) because credit can be spent from another device.
    staleTime: 60 * 1000,
  });

  const cardsQuery = useQuery({
    queryKey: queryKeys.paymentMethods(userid ?? 0),
    queryFn: ({ signal }) =>
      fetchPaymentMethods(apiClient, { userid: userid!, dibsStudioId: studio.dibsStudioId }, signal),
    enabled,
    // Stripe is the truth about cards and this is never persisted to disk (see the persist
    // whitelist in `api/keys.ts`). A short window keeps a card added on the web from being
    // invisible here, without asking Stripe on every render.
    staleTime: 30 * 1000,
  });

  const cards = useMemo(() => {
    if (!cardsQuery.data) return undefined;
    const merged = mergeSavedCards({
      platformCards: cardsQuery.data.platformCards,
      connectedCards: cardsQuery.data.connectedCards,
      defaultPaymentMethodId: cardsQuery.data.defaultPaymentMethodId,
      defaultFingerprint: cardsQuery.data.defaultFingerprint,
    });
    return {
      items: merged.cards satisfies SavedCard[],
      hadExpiredCards: merged.hadExpiredCards,
      lookupFailed: cardsQuery.data.lookupFailed,
    };
  }, [cardsQuery.data]);

  const data = useMemo(
    () =>
      buildWalletData({
        passes: { data: passesQuery.data, isPending: passesQuery.isPending, error: passesQuery.error },
        credit: { data: creditQuery.data, isPending: creditQuery.isPending, error: creditQuery.error },
        cards: { data: cards, isPending: cardsQuery.isPending, error: cardsQuery.error },
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
      cardsQuery.isPending,
      cardsQuery.error,
      timeZone,
      config?.currency,
    ],
  );

  return {
    data,
    // Only when every section is still in the dark. One slow request should not blank the two
    // that already answered.
    isLoading:
      enabled &&
      data.passes.status === 'loading' &&
      data.credit.status === 'loading' &&
      data.cards.status === 'loading',
    isRefreshing: passesQuery.isFetching || creditQuery.isFetching || cardsQuery.isFetching,
    refresh: () => {
      void passesQuery.refetch();
      void creditQuery.refetch();
      void cardsQuery.refetch();
    },
  };
}

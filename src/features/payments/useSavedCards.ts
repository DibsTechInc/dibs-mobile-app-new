/**
 * The client's saved cards — the ONE owner, read by both the wallet and checkout.
 * `status` exists because `[]` cannot distinguish "no cards on file" from "we have not asked".
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { apiClient, fetchPaymentMethods, queryKeys } from '@/api';
import { studio } from '@/config/studio';
import type { CardLookupStatus } from '@/domain/payments/checkout-method';
import { mergeSavedCards, selectDefaultCard, type SavedCard } from '@/domain/payments/cards';
import { useAuth } from '@/features/auth/AuthProvider';

export interface SavedCardsState {
  cards: SavedCard[];
  /** The card the PaymentSheet will open on, or null. Null is a real answer — never guess. */
  defaultCard: SavedCard | null;
  status: CardLookupStatus;
  /** True when a card was dropped for being expired — worth telling the client. */
  hadExpiredCards: boolean;
  /** At least one of the two Stripe reads failed, so this list may be incomplete. */
  lookupFailed: boolean;
  isFetching: boolean;
  refresh: () => void;
}

export function useSavedCards(): SavedCardsState {
  const { account, status: authStatus } = useAuth();
  const userid = account?.userid ?? null;
  const enabled = userid !== null;

  const query = useQuery({
    queryKey: queryKeys.paymentMethods(userid ?? 0),
    queryFn: ({ signal }) =>
      fetchPaymentMethods(apiClient, { userid: userid!, dibsStudioId: studio.dibsStudioId }, signal),
    enabled,
    staleTime: 30 * 1000,
  });

  const merged = useMemo(() => {
    if (!query.data) return null;
    return mergeSavedCards({
      platformCards: query.data.platformCards,
      connectedCards: query.data.connectedCards,
      defaultPaymentMethodId: query.data.defaultPaymentMethodId,
      defaultFingerprint: query.data.defaultFingerprint,
    });
  }, [query.data]);

  const status: CardLookupStatus = (() => {
    // Guest is distinct from "none on file": the way forward is signing in, not adding a card.
    if (authStatus === 'guest') return 'guest';
    if (!enabled) return 'idle';
    // Error outranks data deliberately: Query keeps the last list on a failed refetch, and callers
    // get both — the stale cards AND an honest 'error' — rather than stale cards passed as current.
    if (query.error) return 'error';
    if (merged) return 'ready';
    return 'loading';
  })();

  const cards = merged?.cards ?? [];

  return {
    cards,
    defaultCard: selectDefaultCard(cards),
    status,
    hadExpiredCards: merged?.hadExpiredCards ?? false,
    lookupFailed: query.data?.lookupFailed ?? false,
    isFetching: query.isFetching,
    refresh: () => void query.refetch(),
  };
}

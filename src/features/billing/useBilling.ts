/**
 * The two billing reads. Separate queries because they fail independently — a Stripe outage must
 * not take the payment history down with it.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { apiClient, fetchAccountActivity, fetchUpcomingPayments, queryKeys } from '@/api';
import { studio } from '@/config/studio';
import { buildBillingData, type BillingData } from '@/domain/billing/build-billing';
import { useAuth } from '@/features/auth/AuthProvider';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export interface BillingState {
  data: BillingData;
  /** True only while BOTH sections are still in the dark. */
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => void;
}

export function useBilling(): BillingState {
  const { account } = useAuth();
  const { config, timeZone } = useStudioConfig();
  const userid = account?.userid ?? null;
  const enabled = userid !== null;

  const historyQuery = useQuery({
    queryKey: queryKeys.accountActivity(userid ?? 0, studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchAccountActivity(apiClient, { dibsStudioId: studio.dibsStudioId }, signal),
    enabled,
    staleTime: 60 * 1000,
  });

  const upcomingQuery = useQuery({
    queryKey: queryKeys.upcomingPayments(userid ?? 0, studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchUpcomingPayments(apiClient, { dibsStudioId: studio.dibsStudioId }, signal),
    enabled,
    staleTime: 60 * 1000,
  });

  const data = useMemo(
    () =>
      buildBillingData({
        history: {
          data: historyQuery.data,
          isPending: historyQuery.isPending,
          error: historyQuery.error,
        },
        upcoming: {
          data: upcomingQuery.data,
          isPending: upcomingQuery.isPending,
          error: upcomingQuery.error,
        },
        timeZone,
        currency: config?.currency,
      }),
    [
      historyQuery.data,
      historyQuery.isPending,
      historyQuery.error,
      upcomingQuery.data,
      upcomingQuery.isPending,
      upcomingQuery.error,
      timeZone,
      config?.currency,
    ],
  );

  return {
    data,
    isLoading: enabled && data.past.status === 'loading' && data.upcoming.status === 'loading',
    isRefreshing: historyQuery.isFetching || upcomingQuery.isFetching,
    refresh: () => {
      void historyQuery.refetch();
      void upcomingQuery.refetch();
    },
  };
}

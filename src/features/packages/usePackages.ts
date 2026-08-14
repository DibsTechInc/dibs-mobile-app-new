/**
 * The studio's price list.
 *
 * Public data — no session required, no `userid` in the request — so it loads for a signed-out
 * visitor too. Someone deciding whether this studio is worth joining should be able to see what a
 * membership costs before they make an account.
 *
 * Cached for five minutes: a price list changes when a studio edits it, which is rare, and this
 * screen is opened repeatedly while somebody makes up their mind.
 */
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { apiClient, queryKeys } from '@/api';
import { fetchPackages } from '@/api/endpoints/packages';
import { studio } from '@/config/studio';
import { buildPackages, type PackageView } from '@/domain/packages/build-packages';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export interface PackagesState {
  items: PackageView[];
  /** True only while NOTHING has arrived. TanStack keeps the last list through a refetch. */
  isLoading: boolean;
  isRefreshing: boolean;
  error: unknown;
  refresh: () => void;
}

export function usePackages(): PackagesState {
  const { config } = useStudioConfig();

  const query = useQuery({
    queryKey: queryKeys.packages(studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchPackages(apiClient, { dibsStudioId: studio.dibsStudioId }, signal),
    staleTime: 5 * 60 * 1000,
  });

  const items = useMemo(
    () => buildPackages(query.data ?? [], { currency: config?.currency }),
    [query.data, config?.currency],
  );

  return {
    items,
    isLoading: query.isPending && !query.data,
    isRefreshing: query.isFetching,
    error: query.error,
    refresh: () => void query.refetch(),
  };
}

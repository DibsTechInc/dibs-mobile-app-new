/**
 * The signed-in client's upcoming bookings at this studio.
 *
 * Gated on a resolved Dibs userid, not merely on a session: the endpoint is keyed by userid, and
 * firing it with a placeholder would ask for somebody else's bookings.
 */
import { useQuery } from '@tanstack/react-query';

import { apiClient, fetchUpcomingBookings, queryKeys } from '@/api';
import { studio } from '@/config/studio';
import { useAuth } from '@/features/auth/AuthProvider';

export function useUpcomingBookings() {
  const { account } = useAuth();
  const userid = account?.userid ?? null;

  return useQuery({
    queryKey: queryKeys.upcoming(userid ?? 0, studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchUpcomingBookings(apiClient, { userid: userid!, dibsStudioId: studio.dibsStudioId }, signal),
    enabled: userid !== null,
    // Shorter than the schedule's: this is the client's own commitment, and a cancellation made
    // on the studio's website should not linger on their phone.
    staleTime: 60 * 1000,
  });
}

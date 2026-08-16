/**
 * Warms the caches the first few screens read, at launch instead of on arrival.
 *
 * The reason this exists is a transition that felt broken (Alicia, 2026-08-16): open the app,
 * tap Book, and sit on a skeleton while `get-schedule` does its round trip — a request that
 * could have been in flight since the splash screen. The same held for My Calendar and
 * Payments. So the moment the app can ask, it asks, and by the time a thumb reaches a screen
 * the answer is usually already in the cache.
 *
 * ── Prefetch, never fetch-and-hold ─────────────────────────────────────────────────────────────
 * `prefetchQuery` warms the SAME cache entries the screens' own hooks read — same keys, same
 * fetchers, same staleTimes — so there is no second copy of anything and no gate in front of any
 * screen. A screen whose prefetch has not landed shows exactly what it shows today; one whose
 * prefetch has landed opens instantly. Failures are silent by design: this is an optimisation,
 * and every screen already owns its real loading and error states.
 *
 * ── What is warmed, and when ───────────────────────────────────────────────────────────────────
 *   • The schedule — immediately. It is public data and the Book page is the app's front door.
 *   • The signed-in client's bookings, billing history, upcoming payments, passes and credit —
 *     the moment the session resolves to a userid. Passes ride along because the schedule's
 *     "Included · {pass}" labels read them; without that the list arrives and then re-labels.
 *
 * Renders nothing. Mounted once in the root layout, inside the providers it reads.
 */
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import {
  apiClient,
  fetchAccountActivity,
  fetchClientBookings,
  fetchCredit,
  fetchPasses,
  fetchUpcomingPayments,
  queryKeys,
} from '@/api';
import { studio } from '@/config/studio';
import { useAuth } from '@/features/auth/AuthProvider';
import { scheduleQueryOptions } from '@/features/schedule/useSchedule';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export function AppWarmup() {
  const queryClient = useQueryClient();
  const { timeZone } = useStudioConfig();
  const { account } = useAuth();
  const userid = account?.userid ?? null;

  // The schedule, as soon as there is a timezone to ask under — the seed one first, and again
  // under the studio's live one if the config read changes it (a different timezone is a
  // different query key, exactly as in `useSchedule`).
  useEffect(() => {
    void queryClient.prefetchQuery(scheduleQueryOptions(timeZone));
  }, [queryClient, timeZone]);

  /*
   * Everything keyed by the client, once there is one.
   *
   * staleTimes deliberately MATCH each surface's own hook (bookings/billing/passes 60s,
   * credit 30s) so a prefetch that just ran satisfies the screen's query instead of racing it,
   * and a screen visited twice in a minute still refetches exactly as often as it does today.
   */
  useEffect(() => {
    if (userid === null) return;
    const dibsStudioId = studio.dibsStudioId;

    void queryClient.prefetchQuery({
      queryKey: queryKeys.upcoming(userid, dibsStudioId),
      queryFn: ({ signal }) => fetchClientBookings(apiClient, { userid, dibsStudioId }, signal),
      staleTime: 60 * 1000,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.accountActivity(userid, dibsStudioId),
      queryFn: ({ signal }) => fetchAccountActivity(apiClient, { dibsStudioId }, signal),
      staleTime: 60 * 1000,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.upcomingPayments(userid, dibsStudioId),
      queryFn: ({ signal }) => fetchUpcomingPayments(apiClient, { dibsStudioId }, signal),
      staleTime: 60 * 1000,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.passes(userid, dibsStudioId),
      queryFn: ({ signal }) => fetchPasses(apiClient, { userid, dibsStudioId }, signal),
      staleTime: 60 * 1000,
    });
    void queryClient.prefetchQuery({
      queryKey: queryKeys.credit(userid, dibsStudioId),
      queryFn: ({ signal }) => fetchCredit(apiClient, { userid, dibsStudioId }, signal),
      staleTime: 30 * 1000,
    });
  }, [queryClient, userid]);

  return null;
}

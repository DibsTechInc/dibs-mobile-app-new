/**
 * The studio's upcoming sessions.
 *
 * One query, shared by every surface that shows classes — Home, the schedule screen, and class
 * detail all read the same cache entry, so they can never show a client two different versions
 * of the same class. The backend returns its whole configured window (30–60 days) in one
 * response; slicing it per screen happens in `src/domain/schedule/select.ts`, not in a second
 * request.
 */
import { useQuery } from '@tanstack/react-query';

import { apiClient, fetchSchedule, queryKeys } from '@/api';
import { studio } from '@/config/studio';

import { useStudioConfig } from '../studio/StudioConfigProvider';

export function useSchedule() {
  // Falls back to the build's seed timezone, so this is NOT gated on the config request. The
  // seed is the same studio's zone, validated at build time — gating would mean a slow or failed
  // config call takes the schedule down with it, and a client who can see the classes but not
  // the studio's phone number is in a far better position than one who can see neither.
  const { timeZone } = useStudioConfig();

  return useQuery({
    // The timezone is part of the key because it is part of the request: the backend computes
    // its day window in it, so a schedule fetched under a seed timezone is not the same answer
    // as one fetched under the studio's real one.
    queryKey: [...queryKeys.schedule(studio.dibsStudioId, 'window'), timeZone] as const,
    queryFn: ({ signal }) =>
      fetchSchedule(apiClient, { dibsStudioId: studio.dibsStudioId, timeZone }, signal),
    // Capacity moves while a client is looking at the list; two minutes is short enough that a
    // "3 spots left" tag is not a lie and long enough that scrolling does not refetch.
    staleTime: 2 * 60 * 1000,
  });
}

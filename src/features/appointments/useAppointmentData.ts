/**
 * The appointment flow's reads: services, providers, one day's availability.
 *
 * Availability is deliberately fragile cache-wise — keyed on every input and marked stale
 * immediately — because a slot grid that outlives a date change is a double-booking. The list
 * queries behave like the schedule: public data, gentle staleness.
 */
import { useQuery } from '@tanstack/react-query';

import {
  apiClient,
  fetchAppointmentTypes,
  fetchAvailability,
  fetchProviders,
  queryKeys,
} from '@/api';
import { studio } from '@/config/studio';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export function useAppointmentTypes() {
  return useQuery({
    queryKey: queryKeys.appointmentTypes(studio.dibsStudioId),
    queryFn: ({ signal }) =>
      fetchAppointmentTypes(apiClient, { dibsStudioId: studio.dibsStudioId }, signal),
    // Services change on a human timescale.
    staleTime: 15 * 60 * 1000,
  });
}

export function useProviders(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.providers(studio.dibsStudioId),
    queryFn: ({ signal }) => fetchProviders(apiClient, { dibsStudioId: studio.dibsStudioId }, signal),
    enabled,
    staleTime: 15 * 60 * 1000,
  });
}

export function useAvailability({
  serviceId,
  providerId,
  date,
}: {
  serviceId: number | null;
  providerId: number | null;
  date: string | null;
}) {
  const { timeZone } = useStudioConfig();

  return useQuery({
    queryKey: queryKeys.availability(studio.dibsStudioId, serviceId ?? 0, providerId, date ?? ''),
    queryFn: ({ signal }) =>
      fetchAvailability(
        apiClient,
        {
          dibsStudioId: studio.dibsStudioId,
          date: date!,
          serviceId: serviceId!,
          providerId,
          timeZone,
          variant: studio.appointments.availabilityVariant,
        },
        signal,
      ),
    enabled: serviceId !== null && date !== null,
    /*
     * Openings move under us constantly (other clients book), so a mounted grid always
     * refetches. Deliberately NO `keepPreviousData`: the handoff's rule is that a slot grid
     * never survives a date change — Tuesday's chips rendered under Wednesday's heading are a
     * tap away from booking the wrong day. A day change shows the skeleton instead.
     */
    staleTime: 0,
    gcTime: 0,
  });
}

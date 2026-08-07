/**
 * Home — the app's landing route.
 *
 * Composes the studio's live config with its live schedule. Both are public, so this screen is
 * fully populated for a signed-out client; what a session adds is the greeting's name and the
 * "your next class" card.
 */
import { router } from 'expo-router';
import { useCallback, useMemo } from 'react';

import { studio } from '@/config/studio';
import { selectNextBooking } from '@/domain/bookings/select-next-booking';
import { buildHomeData } from '@/domain/home/build-home-data';
import { useAuth } from '@/features/auth/AuthProvider';
import { useUpcomingBookings } from '@/features/bookings/useUpcomingBookings';
import { HomeScreen } from '@/features/home/HomeScreen';
import { useSchedule } from '@/features/schedule/useSchedule';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export default function HomeRoute() {
  const {
    config,
    isLoading: configLoading,
    error: configError,
    refetch: refetchConfig,
    timeZone,
  } = useStudioConfig();
  const schedule = useSchedule();
  const bookings = useUpcomingBookings();
  const { status, account } = useAuth();

  const data = useMemo(() => {
    if (!config) return null;
    return buildHomeData({
      config,
      events: schedule.data ?? [],
      firstName: account?.firstName ?? null,
      // A guest, or a client with nothing booked, simply has no "your next class" card. That is
      // the honest answer, not a gap to fill.
      nextBooking: bookings.data
        ? selectNextBooking(bookings.data, {
            timeZone,
            showInstructor: studio.display.showInstructor,
          })
        : null,
      showInstructor: studio.display.showInstructor,
    });
    // `schedule.data` is a stable reference from TanStack until the data actually changes, so
    // this recomputes on new data rather than on every render — but it deliberately does NOT
    // depend on the clock. Home does not re-derive its greeting minute by minute; it is built
    // on mount and on refresh, which is when a person is actually looking at it.
  }, [config, schedule.data, bookings.data, account?.firstName, timeZone]);

  const onRefresh = useCallback(() => {
    refetchConfig();
    void schedule.refetch();
    void bookings.refetch();
  }, [refetchConfig, schedule, bookings]);

  return (
    <HomeScreen
      data={data}
      studioName={studio.appName}
      // Only a genuinely blank screen counts as loading. Once the config has landed the screen
      // renders, and a still-loading schedule shows as an empty class list for a moment rather
      // than blanking the studio's photograph and greeting.
      isLoading={configLoading}
      error={configError ?? schedule.error}
      isRefreshing={schedule.isRefetching || bookings.isRefetching}
      onRefresh={onRefresh}
      onOpenClass={(eventId) => router.push(`/class/${eventId}`)}
      onSeeFullSchedule={() => router.push('/schedule')}
      // Hidden only while Firebase is still resolving, so the label never flips from "Sign in"
      // to a name in front of somebody. Once resolved there is always an action: signed-out
      // clients get in, signed-in clients reach their account — and, through it, the way out.
      accountAction={
        status === 'initializing'
          ? undefined
          : status === 'signedIn'
            ? {
                label: account?.firstName ?? 'Account',
                onPress: () => router.push('/account'),
              }
            : { label: 'Sign in', onPress: () => router.push('/sign-in') }
      }
    />
  );
}

/**
 * Home — the app's landing route.
 *
 * Composes the studio's live config with its live schedule. Both are public, so this screen is
 * fully populated for a signed-out client; what a session adds is the greeting's name and the
 * "your next class" card.
 */
import { useCallback, useMemo } from 'react';

import { studio } from '@/config/studio';
import { buildHomeData } from '@/domain/home/build-home-data';
import { HomeScreen } from '@/features/home/HomeScreen';
import { useSchedule } from '@/features/schedule/useSchedule';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export default function HomeRoute() {
  const { config, isLoading: configLoading, error: configError, refetch: refetchConfig } =
    useStudioConfig();
  const schedule = useSchedule();

  const data = useMemo(() => {
    if (!config) return null;
    return buildHomeData({
      config,
      events: schedule.data ?? [],
      showInstructor: studio.display.showInstructor,
      // firstName and nextBooking arrive with auth; until then the screen greets a guest, which
      // is a real state a signed-out client is in and not a placeholder.
    });
    // `schedule.data` is a stable reference from TanStack until the data actually changes, so
    // this recomputes on new data rather than on every render — but it deliberately does NOT
    // depend on the clock. Home does not re-derive its greeting minute by minute; it is built
    // on mount and on refresh, which is when a person is actually looking at it.
  }, [config, schedule.data]);

  const onRefresh = useCallback(() => {
    refetchConfig();
    void schedule.refetch();
  }, [refetchConfig, schedule]);

  return (
    <HomeScreen
      data={data}
      // Only a genuinely blank screen counts as loading. Once the config has landed the screen
      // renders, and a still-loading schedule shows as an empty class list for a moment rather
      // than blanking the studio's photograph and greeting.
      isLoading={configLoading}
      error={configError ?? schedule.error}
      isRefreshing={schedule.isRefetching}
      onRefresh={onRefresh}
      // Class detail and the full schedule are the next two P1 screens. Until they exist these
      // are inert on purpose — routing a tap somewhere unrelated is worse than a tap that waits.
      onOpenClass={() => {}}
      onSeeFullSchedule={() => {}}
    />
  );
}

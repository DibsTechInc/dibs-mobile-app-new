/**
 * The schedule route.
 *
 * Reads the SAME query Home does — one cache entry for the studio's whole window — so the two
 * surfaces can never show a client different versions of the same class. Slicing it into days
 * happens in `src/domain/schedule/days.ts`, not in a second request.
 */
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { studio } from '@/config/studio';
import { groupByStudioDay } from '@/domain/schedule/days';
import { useSchedule } from '@/features/schedule/useSchedule';
import { ScheduleScreen } from '@/features/schedule/ScheduleScreen';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export default function ScheduleRoute() {
  const { config, timeZone } = useStudioConfig();
  const schedule = useSchedule();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const days = useMemo(
    // Deliberately not memoized against the clock: the grouping is computed when the screen
    // renders and on refresh, which is when someone is actually looking at it.
    () => (schedule.data ? groupByStudioDay(schedule.data, timeZone) : []),
    [schedule.data, timeZone],
  );

  const onBack = useCallback(() => {
    // `replace` rather than `back`: opened from a notification or a link there is nothing behind
    // this screen, and `back` on an empty stack does nothing at all — a button that looks broken.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  return (
    <ScheduleScreen
      days={days}
      selectedDate={selectedDate}
      onSelectDate={setSelectedDate}
      studioName={config?.studioName ?? studio.appName}
      showInstructor={studio.display.showInstructor}
      currency={config?.currency}
      isLoading={schedule.isPending}
      error={schedule.error}
      isRefreshing={schedule.isRefetching}
      onRefresh={() => void schedule.refetch()}
      onOpenClass={(eventId) => router.push(`/class/${eventId}`)}
      onBack={onBack}
    />
  );
}

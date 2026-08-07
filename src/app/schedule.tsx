/**
 * The schedule route.
 *
 * Reads the SAME query Home's data does — one cache entry for the studio's whole window — so no
 * two surfaces can show a client different versions of the same class. Slicing it into days
 * happens in `src/domain/schedule/days.ts`, never in a second request.
 */
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { studio } from '@/config/studio';
import { fillEmptyDays, groupByStudioDay } from '@/domain/schedule/days';
import { useAppDrawer } from '@/features/nav/useAppDrawer';
import { ScheduleScreen } from '@/features/schedule/ScheduleScreen';
import { useSchedule } from '@/features/schedule/useSchedule';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export default function ScheduleRoute() {
  const { config, timeZone } = useStudioConfig();
  const schedule = useSchedule();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawer = useAppDrawer({ visible: menuOpen, onClose: () => setMenuOpen(false) });

  const days = useMemo(() => {
    if (!schedule.data) return [];
    // Grouping gives days that HAVE classes; the strip needs the calendar, gaps and all, or its
    // numerals jump `8 · 10` and read as broken rather than empty.
    return fillEmptyDays(groupByStudioDay(schedule.data, timeZone));
  }, [schedule.data, timeZone]);

  const onBack = useCallback(() => {
    // `replace` rather than `back`: opened from a notification or a link there is nothing behind
    // this screen, and `back` on an empty stack does nothing at all — a button that looks broken.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  return (
    <>
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
        // No `onBookClass` until P3 exists. A Book button that does nothing is the dead end this
        // codebase keeps refusing to ship — until then the row itself opens class detail.
        onBack={onBack}
      />
      {drawer}
    </>
  );
}

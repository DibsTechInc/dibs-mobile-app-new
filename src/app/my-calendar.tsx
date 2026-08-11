/**
 * The My Calendar route.
 *
 * Reads `POST /get-upcoming-appts` — the same endpoint the widget's "my classes" surface uses, so
 * the two products cannot disagree about what a client has booked. All of the shaping lives in
 * `domain/bookings`, because every decision here ("has this started?", "was it cancelled?") is a
 * comparison against the STUDIO's clock rather than the device's.
 *
 * Signed out this route is not reachable from Home — the choice sends you to sign-in instead —
 * but a deep link can still land here, so it says so rather than rendering an empty calendar.
 */
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { studio } from '@/config/studio';
import { useAuth } from '@/features/auth/AuthProvider';
import { MyCalendarScreen } from '@/features/bookings/MyCalendarScreen';
import { useUpcomingBookings } from '@/features/bookings/useUpcomingBookings';
import { useAppDrawer } from '@/features/nav/useAppDrawer';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { groupBookings, toDaySections } from '@/domain/bookings/group-bookings';

export default function MyCalendarRoute() {
  const { config, timeZone } = useStudioConfig();
  const { status } = useAuth();
  const bookings = useUpcomingBookings();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawer = useAppDrawer({ visible: menuOpen, onClose: () => setMenuOpen(false) });

  const studioName = config?.studioName ?? studio.appName;

  const { sections, past } = useMemo(() => {
    const grouped = groupBookings(
      { upcomingAppts: bookings.data?.upcoming, previousAppts: bookings.data?.previous },
      { timeZone, showInstructor: studio.display.showInstructor },
    );
    return { sections: toDaySections(grouped.upcoming), past: grouped.past };
  }, [bookings.data, timeZone]);

  const onBack = useCallback(() => {
    // `replace` rather than `back`: arriving from a link there is nothing behind this screen, and
    // `back` on an empty stack does nothing at all — a button that looks broken.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  return (
    <>
      <MyCalendarScreen
        sections={sections}
        past={past}
        studioName={studioName}
        isSignedIn={status === 'signedIn'}
        // Gated on the session, not just on the query: signed out the fetch never fires, so
        // `isPending` stays true forever and the screen would spin at a visitor indefinitely.
        isLoading={status === 'signedIn' && bookings.isPending}
        error={bookings.error}
        isRefreshing={bookings.isRefetching}
        onRefresh={() => void bookings.refetch()}
        onBack={onBack}
        onBrowseClasses={
          status === 'signedIn' ? () => router.push('/schedule') : () => router.push('/sign-in')
        }
        onOpenMenu={() => setMenuOpen(true)}
      />
      {drawer}
    </>
  );
}

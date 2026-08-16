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
import type { BookingListItem } from '@/domain/bookings/group-bookings';
import { groupBookings, splitNextUp, toDaySections } from '@/domain/bookings/group-bookings';
import { describeCancelWindow, resolveClassNoticeHours } from '@/domain/cancellation/cancel-window';
import { useAuth } from '@/features/auth/AuthProvider';
import { CancelBookingSheet } from '@/features/bookings/CancelBookingSheet';
import { MyCalendarScreen, type CalendarTab } from '@/features/bookings/MyCalendarScreen';
import { useDropClass } from '@/features/bookings/useDropClass';
import { useUpcomingBookings } from '@/features/bookings/useUpcomingBookings';
import { useAppDrawer } from '@/features/nav/useAppDrawer';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { usePullRefresh } from '@/lib/usePullRefresh';

export default function MyCalendarRoute() {
  const { config, timeZone } = useStudioConfig();
  const { status } = useAuth();
  const bookings = useUpcomingBookings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [tab, setTab] = useState<CalendarTab>('upcoming');
  const [cancelling, setCancelling] = useState<BookingListItem | null>(null);
  // Pull-only spinner — the same rule every list screen now shares. See usePullRefresh.
  const pull = usePullRefresh(() => bookings.refetch());
  const drop = useDropClass();
  const drawer = useAppDrawer({ visible: menuOpen, onClose: () => setMenuOpen(false) });

  const studioName = config?.studioName ?? studio.appName;

  const { nextUp, sections, upcomingCount, past } = useMemo(() => {
    const grouped = groupBookings(
      { upcomingAppts: bookings.data?.upcoming, previousAppts: bookings.data?.previous },
      { timeZone, showInstructor: studio.display.showInstructor },
    );
    // `next` is lifted out of the sections so the hero and the list below cannot show the same
    // booking twice — see `splitNextUp`.
    const { next, rest } = splitNextUp(toDaySections(grouped.upcoming));
    return {
      nextUp: next,
      sections: rest,
      // The TOTAL, hero included. The tab count must say how many classes they have, not how many
      // are left in the list under the hero.
      upcomingCount: grouped.upcoming.length,
      past: grouped.past,
    };
  }, [bookings.data, timeZone]);

  const closeCancelSheet = useCallback(() => {
    setCancelling(null);
    // Reset AFTER closing so the sheet does not flash back to the question on its way out.
    // No refetch here: a successful drop already rewrote the cached row (`useDropClass`) and
    // invalidated the query, which refetches it. A second one from this handler was a second
    // identical round trip against the slowest endpoint the app calls.
    drop.reset();
  }, [drop]);

  const onBack = useCallback(() => {
    // `replace` rather than `back`: arriving from a link there is nothing behind this screen, and
    // `back` on an empty stack does nothing at all — a button that looks broken.
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  return (
    <>
      <MyCalendarScreen
        nextUp={nextUp}
        sections={sections}
        upcomingCount={upcomingCount}
        past={past}
        studioName={studioName}
        isSignedIn={status === 'signedIn'}
        // Gated on the session, not just on the query: signed out the fetch never fires, so
        // `isPending` stays true forever and the screen would spin at a visitor indefinitely.
        isLoading={status === 'signedIn' && bookings.isPending}
        error={bookings.error}
        isRefreshing={pull.isRefreshing}
        onRefresh={pull.onRefresh}
        tab={tab}
        onSelectTab={setTab}
        onBack={onBack}
        onBrowseClasses={
          status === 'signedIn' ? () => router.push('/schedule') : () => router.push('/sign-in')
        }
        onOpenMenu={() => setMenuOpen(true)}
        onCancelBooking={status === 'signedIn' ? setCancelling : undefined}
      />
      <CancelBookingSheet
        booking={cancelling}
        window={
          cancelling
            ? describeCancelWindow(
                cancelling.startsAt,
                timeZone,
                resolveClassNoticeHours(config),
              )
            : null
        }
        status={drop.status}
        currency={config?.currency}
        onConfirm={() => {
          // Guarded by the affordance — CancelAction does not render without an id — and again
          // here, because a null would post `NaN` and 400.
          if (cancelling?.dibsTransactionId == null) return;
          drop.drop({
            dibsTransactionId: cancelling.dibsTransactionId,
            eventId: cancelling.eventId,
          });
        }}
        onClose={closeCancelSheet}
      />
      {drawer}
    </>
  );
}

/**
 * The schedule route.
 *
 * Reads the SAME query Home's data does — one cache entry for the studio's whole window — so no
 * two surfaces can show a client different versions of the same class. Slicing it into days
 * happens in `src/domain/schedule/days.ts`, never in a second request.
 *
 * ── Book adds to the cart; it does not charge ─────────────────────────────────────────────────
 * Tapping Book on a row puts the class in the cart and raises the sticky bar. Money is only ever
 * discussed on `/checkout`, which is the one screen that shows a total including tax and the one
 * place a PaymentIntent is created. The row's button is a toggle, so the add has an undo exactly
 * where it happened.
 *
 * A signed-out client can fill a cart — the studio's schedule is public and browsing is the point.
 * Checkout is where the session is required, and it redirects there rather than gating the row,
 * because a Book button that silently means "sign in first" is a button that lies.
 */
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { isAcceptingBookings } from '@/api/schemas/basic-config';
import { studio } from '@/config/studio';
import { fillEmptyDays, groupByStudioDay } from '@/domain/schedule/days';
import { useClientPasses } from '@/features/account/useClientPasses';
import { useCartStore } from '@/features/cart/cartStore';
import { useCart } from '@/features/cart/useCart';
import { useAppDrawer } from '@/features/nav/useAppDrawer';
import { ScheduleScreen } from '@/features/schedule/ScheduleScreen';
import { useSchedule } from '@/features/schedule/useSchedule';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export default function ScheduleRoute() {
  const { config, timeZone } = useStudioConfig();
  const schedule = useSchedule();
  const cart = useCart();
  // Rows a pass covers read "Included · {pass}" instead of a price, and land in the cart as $0
  // lines that book through `book-with-pass`. One coverage decision, shared by both.
  const { passes } = useClientPasses();
  const cartEventIds = useCartStore((state) => state.eventIds);
  const toggleInCart = useCartStore((state) => state.toggle);
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

  // No Book buttons at all when the studio cannot take bookings (offboarded, or in soft lockout).
  // Read access stays; only the affordance that cannot succeed comes down.
  const canBook = config ? isAcceptingBookings(config) : true;

  return (
    <>
      <ScheduleScreen
        days={days}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        studioName={config?.studioName ?? studio.appName}
        showInstructor={studio.display.showInstructor}
        currency={config?.currency}
        passes={passes}
        isLoading={schedule.isPending}
        error={schedule.error}
        isRefreshing={schedule.isRefetching}
        onRefresh={() => void schedule.refetch()}
        onOpenClass={(eventId) => router.push(`/class/${eventId}`)}
        onBookClass={canBook ? toggleInCart : undefined}
        cartEventIds={cartEventIds}
        onBack={onBack}
        onOpenCart={canBook ? () => router.push('/checkout') : undefined}
        cartSummary={{
          chargeableCount: cart.chargeableCount,
          coveredCount: cart.coveredCount,
          blockedCount: cart.blockedCount,
          totalLabel: cart.totalLabel,
        }}
      />
      {drawer}
    </>
  );
}

/**
 * Class detail, routed by event id.
 *
 * Resolves the class out of the schedule query rather than fetching it: the whole window is
 * already in cache, the id is in the URL, and a second endpoint would be a second source of truth
 * for a class's capacity and price.
 *
 * The cost of that is a deep link arriving before the schedule has loaded, which is why the
 * "still loading" and "not in the window" states are distinguished below — telling somebody a
 * class does not exist while it is still on its way is the same mistake as reading an empty card
 * list as "no cards on file".
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, describeApiError } from '@/api/errors';
import { EmptyState, ErrorState, SkeletonList } from '@/components';
import { studio } from '@/config/studio';
import { isAcceptingBookings } from '@/api/schemas/basic-config';
import { describeCancelWindow } from '@/domain/cancellation/cancel-window';
import { resolveClassCharge } from '@/domain/pricing/class-charge';
import { findEvent, longDayLabel } from '@/domain/schedule/days';
import { toScheduleEntry } from '@/domain/schedule/entry';
import { useCartStore, useIsInCart } from '@/features/cart/cartStore';
import { ClassDetailScreen } from '@/features/schedule/ClassDetailScreen';
import { useSchedule } from '@/features/schedule/useSchedule';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { useTheme } from '@/theme/ThemeProvider';

export default function ClassDetailRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { config, timeZone } = useStudioConfig();
  const schedule = useSchedule();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const event = useMemo(
    () => (schedule.data ? findEvent(schedule.data, Number(eventId)) : null),
    [schedule.data, eventId],
  );

  /**
   * What the card will be charged, tax included — the ONE client-side answer, and the figure sent
   * as `displayedTotalCents` so the server can refuse to charge anything else.
   *
   * Resolved before the early returns because hooks cannot be conditional; the null event case
   * yields a placeholder that the screen never renders.
   */
  const charge = useMemo(
    () => (event ? resolveClassCharge(event, config?.currency) : null),
    [event, config?.currency],
  );

  /**
   * Adding to the cart, not charging.
   *
   * This screen used to run its own booking state machine, which made it a SECOND place that could
   * create a PaymentIntent and decide a price. There is one now — `/checkout` — and both entry
   * points (the schedule row's Book button and this CTA) lead to it.
   */
  const addToCart = useCartStore((state) => state.add);
  const inCart = useIsInCart(Number(eventId));

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/schedule');
  }, []);

  const onAddToCart = useCallback(() => {
    addToCart(Number(eventId));
    // Straight to checkout: somebody who has read the whole page and pressed a button carrying a
    // total has decided. Leaving them here to find the cart themselves would be the "to do X, go
    // to Y" pattern the product principles rule out.
    router.push('/checkout');
  }, [addToCart, eventId]);

  if (schedule.isPending) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg, paddingTop: insets.top + theme.spacing.xl }}>
        <SkeletonList count={3} />
      </View>
    );
  }

  if (schedule.error && !schedule.data) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top + theme.spacing.xl }}>
        <ErrorState
          message={describeApiError(schedule.error)}
          retriable={!(schedule.error instanceof ApiError) || schedule.error.retriable}
          onRetry={() => void schedule.refetch()}
        />
      </View>
    );
  }

  if (!event) {
    // The schedule loaded and this class is not in it — it has been cancelled, or it has already
    // started, or the link is old. All three mean the same thing to the person holding the phone.
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top + theme.spacing.xl }}>
        <EmptyState
          title="That class isn’t on the schedule."
          body="It may have been cancelled, or it has already started."
          action={{ label: 'See the schedule', onPress: () => router.replace('/schedule') }}
        />
      </View>
    );
  }

  const entry = toScheduleEntry(event, {
    showInstructor: studio.display.showInstructor,
    currency: config?.currency,
  });

  const acceptingBookings = config ? isAcceptingBookings(config) : true;

  return (
    <ClassDetailScreen
      entry={entry}
      dayLabel={longDayLabel(event.start_date)}
      description={event.description?.trim() || null}
      locationLabel={event.location?.name?.trim() || null}
      cancelWindow={describeCancelWindow(
        event.start_date,
        timeZone,
        // The group-class window when the studio publishes one, else the studio-wide default.
        // `.claude/CANCELLATION.md` §3.
        config?.defaultCancelTimeGroup ?? config?.cancelTime,
      )}
      acceptingBookings={acceptingBookings}
      charge={charge}
      inCart={inCart}
      onAddToCart={acceptingBookings ? onAddToCart : undefined}
      onOpenCart={acceptingBookings ? () => router.push('/checkout') : undefined}
      onBack={onBack}
    />
  );
}

/**
 * The checkout route.
 *
 * Signed-out clients are sent to sign in: every line here ends in a charge against a Dibs account,
 * and there is no such account yet. The redirect keys off the RESOLVED status — `initializing` is
 * Firebase still answering, and treating that as signed-out would bounce a signed-in client off
 * their own cart for a frame.
 *
 * The cart survives the trip. It is store state, not route state, so signing in and coming back
 * lands on the same classes rather than on an empty screen — which is the widget's post-login
 * bounce, and it took three attempts to fix there.
 *
 * ── The money on this screen is "what is still to pay" ────────────────────────────────────────
 * `useCart`'s totals cover the whole cart. Once a class is booked it must stop counting toward
 * them, or the button would offer to charge for something already paid for — but the line has to
 * stay on screen as its own confirmation. So the outstanding figures are derived HERE, from the
 * lines that have not booked yet, and they are the only figures the screen is given.
 */
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { isAcceptingBookings } from '@/api/schemas/basic-config';
import { studio } from '@/config/studio';
import { cancelWindowSentence, describeCancelWindow } from '@/domain/cancellation/cancel-window';
import { formatBalance } from '@/domain/money/format';
import { useAuth } from '@/features/auth/AuthProvider';
import { CheckoutScreen, type CheckoutLineView } from '@/features/cart/CheckoutScreen';
import { useCartStore } from '@/features/cart/cartStore';
import { useCart } from '@/features/cart/useCart';
import { useCartCheckout, type BookableItem, type LineOutcome } from '@/features/cart/useCartCheckout';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

const PENDING: LineOutcome = { kind: 'pending' };

/**
 * What this line will be charged, right now.
 *
 * After a `price_changed` the SERVER's figure replaces what the cart implied — for the line's own
 * price block, for the total, and for the value sent back on the retry. One resolution, read by
 * all three, so the button can never carry a number the line does not show.
 */
function effectiveTotalCents(line: CheckoutLineView): number {
  if (line.outcome.kind === 'priceChanged') return line.outcome.charge.totalCents;
  return line.charge?.totalCents ?? 0;
}

export default function CheckoutRoute() {
  const { status } = useAuth();
  const { config, timeZone } = useStudioConfig();
  const cart = useCart();
  const removeFromCart = useCartStore((state) => state.remove);
  const checkout = useCartCheckout({ currency: config?.currency });

  const studioName = config?.studioName ?? studio.appName;

  const lines = useMemo<CheckoutLineView[]>(
    () =>
      cart.lines.map((line) => ({
        ...line,
        cancelSentence: line.entry
          ? cancelWindowSentence(
              describeCancelWindow(
                line.entry.startsAt,
                timeZone,
                // The group-class window when the studio publishes one, else the studio-wide
                // default. `.claude/CANCELLATION.md` §3.
                config?.defaultCancelTimeGroup ?? config?.cancelTime,
              ),
            )
          : null,
        outcome: checkout.outcomes[line.eventId] ?? PENDING,
      })),
    [cart.lines, checkout.outcomes, timeZone, config],
  );

  /** Lines a card can still pay for — booked ones have stopped counting. */
  const outstanding = useMemo(
    () => lines.filter((line) => line.state === 'ready' && line.outcome.kind !== 'booked'),
    [lines],
  );

  const totalCents = useMemo(
    () => outstanding.reduce((sum, line) => sum + effectiveTotalCents(line), 0),
    [outstanding],
  );

  const bookableItems = useMemo<BookableItem[]>(
    () => outstanding.map((line) => ({ line, totalCents: effectiveTotalCents(line) })),
    [outstanding],
  );

  /**
   * Booked classes leave the cart when the client leaves checkout — not the moment they book.
   *
   * Removing on success would delete the confirmation out from under the thumb that caused it. But
   * they cannot stay: the schedule behind would keep showing them as "Added", inviting a second
   * booking of a class already paid for.
   *
   * `clearBooked` is held in a ref because this effect must run its cleanup on unmount ONLY. With
   * the callback in the dependency array, any re-render that re-created it would clear the cart
   * mid-run and the booked lines would vanish exactly as if they had been removed on success.
   *
   * The ref is written in its own effect rather than during render — the React Compiler forbids
   * touching `.current` in a render pass, and it is right to: a ref written during a render that
   * React then throws away is a value nobody can reason about.
   */
  const clearBooked = useRef(checkout.clearBooked);
  useEffect(() => {
    clearBooked.current = checkout.clearBooked;
  });
  useEffect(() => () => clearBooked.current(), []);

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/schedule');
  }, []);

  // `returnTo` so signing in lands back on the cart rather than on Home. The cart itself survives
  // the trip — it is store state, not route state.
  if (status === 'guest') return <Redirect href="/sign-in?returnTo=/checkout" />;

  return (
    <CheckoutScreen
      lines={lines}
      chargeableCount={outstanding.length}
      totalCents={totalCents}
      totalLabel={formatBalance(totalCents / 100, config?.currency)}
      isResolving={cart.isResolving}
      acceptingBookings={config ? isAcceptingBookings(config) : true}
      studioName={studioName}
      phase={checkout.phase}
      onRemove={removeFromCart}
      onConfirm={() => checkout.run(bookableItems)}
      onBack={onBack}
      onViewCalendar={() => router.replace('/my-calendar')}
      onBrowseClasses={() => router.replace('/schedule')}
    />
  );
}

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
import { describeCheckoutPayment } from '@/domain/payments/checkout-method';
import { useAuth } from '@/features/auth/AuthProvider';
import { CheckoutScreen, type CheckoutLineView } from '@/features/cart/CheckoutScreen';
import { useCartStore } from '@/features/cart/cartStore';
import { useCart } from '@/features/cart/useCart';
import { useCartCheckout, type BookableItem, type LineOutcome } from '@/features/cart/useCartCheckout';
import { useSavedCards } from '@/features/payments/useSavedCards';
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
  // The SAME owner the wallet reads, so the card named here is the card the wallet calls default.
  const cards = useSavedCards();

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

  /**
   * Lines still to book — booked ones have stopped counting.
   *
   * `alreadyBooked` stops counting too, and that is the load-bearing half. It is the one refusal
   * the CTA cannot resolve: the server counts attendee rows, so re-running the same line produces
   * the same refusal forever. Leaving it in would keep it in the total and on the button, which is
   * how "Try again · $40.76" came to sit under "You're already booked into this class". Booking a
   * second spot is a per-line decision with its own button — see `onBookAnother`.
   */
  const outstanding = useMemo(
    () =>
      lines.filter(
        (line) =>
          (line.state === 'ready' || line.state === 'covered') &&
          line.outcome.kind !== 'booked' &&
          line.outcome.kind !== 'alreadyBooked',
      ),
    [lines],
  );

  /** Of those, the ones a CARD pays for. Covered lines cost nothing and are excluded. */
  const outstandingChargeable = useMemo(
    () => outstanding.filter((line) => line.state === 'ready'),
    [outstanding],
  );

  const outstandingCovered = useMemo(
    () => outstanding.filter((line) => line.state === 'covered'),
    [outstanding],
  );

  const totalCents = useMemo(
    () => outstandingChargeable.reduce((sum, line) => sum + effectiveTotalCents(line), 0),
    [outstandingChargeable],
  );

  /**
   * The run order: **pass-covered lines first, then card lines.**
   *
   * Two reasons, and the second is the one that matters. A pass booking opens no sheet and takes a
   * second, so getting them out of the way means the client is not sitting through a payment sheet
   * before finding out whether their free classes worked. And if they dismiss a card sheet halfway
   * through, everything that cost nothing is already booked rather than abandoned alongside the
   * charge they changed their mind about.
   */
  const bookableItems = useMemo<BookableItem[]>(
    () =>
      [...outstandingCovered, ...outstandingChargeable].map((line) => ({
        line,
        totalCents: effectiveTotalCents(line),
      })),
    [outstandingCovered, outstandingChargeable],
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

  /**
   * Book a SECOND spot in one class.
   *
   * Reachable only from a line the server has already refused with `already_booked`, and it runs
   * that ONE line — the permission is minted by this tap and travels no further than the item it
   * was granted for. Running the whole cart here would hand a duplicate booking to every other
   * line in it, which is the difference between answering a question and being taken at your word
   * about something you never said.
   */
  const onBookAnother = useCallback(
    (eventId: number) => {
      const line = lines.find((candidate) => candidate.eventId === eventId);
      if (!line || line.outcome.kind !== 'alreadyBooked') return;
      checkout.run([{ line, totalCents: effectiveTotalCents(line), allowDuplicate: true }]);
    },
    [checkout, lines],
  );

  /**
   * What is about to pay, resolved once and handed down.
   *
   * The pass names are de-duplicated because two classes covered by one pack is one pass being
   * spent twice, not two passes — and the summary is a sentence, not an inventory.
   */
  const payment = useMemo(
    () =>
      describeCheckoutPayment({
        chargeableCount: outstandingChargeable.length,
        coveredCount: outstandingCovered.length,
        passNames: [
          ...new Set(
            outstandingCovered
              .map((line) => line.passName)
              .filter((name): name is string => Boolean(name)),
          ),
        ],
        card: cards.defaultCard,
        status: cards.status,
      }),
    [outstandingChargeable, outstandingCovered, cards.defaultCard, cards.status],
  );

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
      chargeableCount={outstandingChargeable.length}
      coveredCount={outstandingCovered.length}
      totalCents={totalCents}
      totalLabel={formatBalance(totalCents / 100, config?.currency)}
      isResolving={cart.isResolving}
      acceptingBookings={config ? isAcceptingBookings(config) : true}
      studioName={studioName}
      phase={checkout.phase}
      payment={payment}
      onRemove={removeFromCart}
      onConfirm={() => checkout.run(bookableItems)}
      onBookAnother={onBookAnother}
      onBack={onBack}
      onViewCalendar={() => router.replace('/my-calendar')}
      onBrowseClasses={() => router.replace('/schedule')}
    />
  );
}

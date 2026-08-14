/**
 * Booking the cart.
 *
 * ── One class per charge, and the screen says so ───────────────────────────────────────────────
 * `checkout/class/create-payment-intent` prices and books exactly ONE class: the server takes the
 * event id, works out the money itself, and refuses to charge a figure the app did not display.
 * There is no multi-class endpoint. So a cart of three classes is three PaymentIntents on the
 * studio's connected account and three lines on the client's statement, and the checkout screen
 * states that rather than presenting a single combined total as though it were one charge.
 *
 * That is a real constraint, not a shortcut — and it is the honest side of it. A bundled total on
 * screen and three separate charges on a statement is the "saw one number, was billed another"
 * problem the server-side price check exists to prevent, wearing a different hat.
 *
 * ── Sequential, and every ending is reachable ──────────────────────────────────────────────────
 * Classes are booked one at a time, in cart order, awaiting each before starting the next. Two
 * reasons, both load-bearing:
 *
 *   1. **The Stripe SDK is global native state.** `withConnectedStripeAccount` repoints it at the
 *      studio's connected account and puts it back afterwards. Two of those in flight at once and
 *      the second restores the platform configuration while the first is still using it.
 *   2. **PaymentSheet is a modal.** Presenting a second one before the first has finished
 *      dismissing is how iOS ends up with a sheet nobody can see and a flow nobody can leave.
 *
 * Each line carries its own outcome, so a partial success reads as exactly what it is: "two
 * booked, one declined", with the declined one still there and still retryable. The alternative —
 * one status for the whole run — would tell somebody their booking failed after two of their three
 * classes were paid for.
 *
 * ── The run stops at a dismissal, and only at a dismissal ─────────────────────────────────────
 * Dismissing the payment sheet means "not now", so the remaining classes are left untouched rather
 * than each throwing their own sheet at somebody who just said no. Any other failure — a decline, a
 * class that filled, a price change — is about ONE class, so the run carries on and reports per
 * line. Being refused for one class is not a reason to abandon the other two.
 *
 * ── A booked class stays on screen, and leaves the cart on the way out ────────────────────────
 * Removing a line the moment it books would delete its own confirmation from under the client's
 * thumb, and shuffle everything below it up mid-run. So booked lines stay put wearing a "Booked"
 * tag, and `clearBooked()` — which the route calls on unmount — is what finally takes them out, so
 * the schedule behind is not still showing them as "Added".
 */
import { useStripe } from '@stripe/stripe-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';

import {
  apiClient,
  bookClassWithPass,
  confirmClassBooking,
  createClassPaymentIntent,
  queryKeys,
} from '@/api';
import { BookingRefusedError } from '@/api/endpoints/class-booking';
import { studio } from '@/config/studio';
import type { CartLine } from '@/domain/cart/build-cart';
import { chargeFromServerBreakdown, type ClassCharge } from '@/domain/pricing/class-charge';
import { useAuth } from '@/features/auth/AuthProvider';
import { stripeRedirectUrl, withConnectedStripeAccount } from '@/features/payments/stripeSession';
import { useStripeReadiness } from '@/features/payments/StripeSdkProvider';

import { useCartStore } from './cartStore';

/** The client dismissed the sheet. Never shown to them, and it ends the run quietly. */
class SheetDismissed extends Error {
  constructor() {
    super('Payment sheet dismissed.');
    this.name = 'SheetDismissed';
  }
}

export type LineOutcome =
  | { kind: 'pending' }
  | { kind: 'working' }
  | { kind: 'booked' }
  /**
   * The server priced this class differently from what was on screen. NOT an error — nothing was
   * charged and no PaymentIntent was created. The line re-renders at the server's figure and the
   * client confirms it.
   */
  | { kind: 'priceChanged'; charge: ClassCharge; message: string }
  /** A pass already covers it, so the server refused to take a card. Good news. */
  | { kind: 'coveredByPass'; message: string }
  /**
   * The client is ALREADY in this class, and nothing was charged.
   *
   * Not a failure — a question. Booking a second spot for a friend or a partner is a real thing
   * people do, and the roster has no guest concept, so a second attendee row under their own name
   * is how the platform represents it. The line offers that explicitly; it is never assumed.
   */
  | { kind: 'alreadyBooked'; message: string; existingCount: number | null }
  | { kind: 'failed'; message: string; nothingCharged: boolean };

export type CheckoutPhase =
  | { kind: 'idle' }
  | { kind: 'working' }
  /** The run finished. `booked` is how many actually went through this run. */
  | { kind: 'done'; booked: number; stoppedEarly: boolean };

/**
 * One class to book, and the figure the client is agreeing to for it.
 *
 * `totalCents` is passed IN rather than read off `line.charge`, for the same reason `useBookClass`
 * takes it explicitly: after a `price_changed` the screen is showing the SERVER's new number, and
 * the value sent must be the one currently on screen. One source for that figure — the screen —
 * and it is the same source the button label renders from.
 */
export interface BookableItem {
  line: CartLine;
  totalCents: number;
  /**
   * Book a SECOND spot in a class the client already holds one in.
   *
   * True ONLY on a run the client started by tapping "Book another spot" on a line that had come
   * back `already_booked`. It is deliberately per-item rather than per-run: a cart of three where
   * one line is a duplicate must not silently license duplicates on the other two.
   */
  allowDuplicate?: boolean;
}

export interface CartCheckoutState {
  phase: CheckoutPhase;
  /** Keyed by event id. A line absent from the map has not been attempted. */
  outcomes: Record<number, LineOutcome>;
  /** Book each item in order. Safe to call again with whatever is left. */
  run: (items: BookableItem[]) => void;
  /** Take everything booked in this session out of the cart. Called when checkout is left. */
  clearBooked: () => void;
}

export interface UseCartCheckoutArgs {
  /** From `get-basic-config`, so a Canadian studio's total is not labelled in US dollars. */
  currency?: string;
}

export function useCartCheckout({ currency }: UseCartCheckoutArgs = {}): CartCheckoutState {
  const { account } = useAuth();
  const { publishableKey } = useStripeReadiness();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const queryClient = useQueryClient();
  const removeFromCart = useCartStore((state) => state.remove);

  const [phase, setPhase] = useState<CheckoutPhase>({ kind: 'idle' });
  const [outcomes, setOutcomes] = useState<Record<number, LineOutcome>>({});
  /** Guards a second run while one is in flight — a double tap must not open two sheets. */
  const running = useRef(false);
  /**
   * What booked, tracked in a ref as well as in state.
   *
   * `clearBooked` runs from an unmount cleanup, which sees the state captured when the effect was
   * created — i.e. an empty map. The ref is the only value that is current at that moment.
   */
  const bookedIds = useRef<number[]>([]);

  const setOutcome = useCallback((eventId: number, outcome: LineOutcome) => {
    setOutcomes((current) => ({ ...current, [eventId]: outcome }));
  }, []);

  /**
   * Book ONE class with a pass. No sheet, no money, one call.
   *
   * Never throws: the only throw the runner treats specially is a sheet dismissal, and there is no
   * sheet here. A pass line that fails leaves the run going — being refused for one class is not a
   * reason to abandon the other two.
   */
  const bookOneWithPass = useCallback(
    async (line: CartLine, allowDuplicate = false): Promise<boolean> => {
      setOutcome(line.eventId, { kind: 'working' });

      try {
        await bookClassWithPass(apiClient, {
          dibsStudioId: studio.dibsStudioId,
          eventId: line.eventId,
          // A REQUEST, not an instruction — the server verifies it against the client's own
          // covering passes. Sent so the pass the screen named is the pass that gets spent.
          passId: line.passId,
          allowDuplicate,
        });

        setOutcome(line.eventId, { kind: 'booked' });
        if (!bookedIds.current.includes(line.eventId)) bookedIds.current.push(line.eventId);
        return true;
      } catch (error) {
        if (error instanceof BookingRefusedError) {
          if (error.refusalCode === 'already_booked') {
            // A question, not a failure. Spending a pass use on a second spot is money too, so it
            // waits for an explicit tap — but the line must OFFER that tap rather than dead-end.
            setOutcome(line.eventId, {
              kind: 'alreadyBooked',
              message: error.message,
              existingCount: error.existingBookingCount,
            });
            return false;
          }

          setOutcome(line.eventId, {
            kind: 'failed',
            message: error.message,
            // A pass booking never charges anything, so this is always true — and saying it is
            // what stops "we could not book that" reading as "you may have been billed".
            nothingCharged: true,
          });
          return false;
        }

        setOutcome(line.eventId, {
          kind: 'failed',
          message:
            error instanceof Error && error.message
              ? error.message
              : 'Something went wrong. Please try again.',
          nothingCharged: true,
        });
        return false;
      }
    },
    [setOutcome],
  );

  /** Book ONE class. Throws only `SheetDismissed`; every other failure becomes an outcome. */
  const bookOne = useCallback(
    async ({ line, totalCents, allowDuplicate = false }: BookableItem): Promise<boolean> => {
      setOutcome(line.eventId, { kind: 'working' });

      try {
        if (!publishableKey) {
          // "We have not asked Stripe yet" is not "you cannot pay" — the readiness state exists so
          // this can say something true rather than failing inside the sheet.
          throw new Error('Payments are still starting up. Give it a moment and try again.');
        }

        const intent = await createClassPaymentIntent(apiClient, {
          dibsStudioId: studio.dibsStudioId,
          eventId: line.eventId,
          displayedTotalCents: totalCents,
          allowDuplicate,
        });

        await withConnectedStripeAccount(
          { publishableKey, stripeAccountId: intent.stripeAccountId },
          async () => {
            const init = await initPaymentSheet({
              merchantDisplayName: studio.appName,
              paymentIntentClientSecret: intent.paymentIntentClientSecret,
              customerId: intent.customerId,
              customerSessionClientSecret: intent.customerSessionClientSecret,
              // Where a 3DS challenge returns to. Without it the challenge is a dead end.
              returnURL: stripeRedirectUrl(),
              allowsDelayedPaymentMethods: false,
              defaultBillingDetails: {
                name:
                  [account?.firstName, account?.lastName].filter(Boolean).join(' ') || undefined,
                email: account?.email ?? undefined,
              },
            });
            if (init.error) {
              throw new Error(
                init.error.message ?? 'We could not open the payment form. Please try again.',
              );
            }

            const sheet = await presentPaymentSheet();
            if (sheet.error) {
              if (sheet.error.code === 'Canceled') throw new SheetDismissed();
              throw new Error(
                sheet.error.message ?? 'That payment could not be completed. Please try again.',
              );
            }
          },
        );

        // The card is AUTHORIZED, not charged. The server claims the seat first and captures only
        // once it is secured.
        await confirmClassBooking(apiClient, {
          dibsStudioId: studio.dibsStudioId,
          paymentIntentId: intent.paymentIntentId,
        });

        setOutcome(line.eventId, { kind: 'booked' });
        if (!bookedIds.current.includes(line.eventId)) bookedIds.current.push(line.eventId);
        return true;
      } catch (error) {
        if (error instanceof SheetDismissed) throw error;

        if (error instanceof BookingRefusedError) {
          if (error.refusalCode === 'covered_by_pass') {
            /*
             * The server knows a pass covers this class and the app did not — the client's pass
             * list arrived after the screen rendered, or they bought a pack on another device.
             *
             * Book it with the pass rather than reporting a refusal. Nothing was charged (no
             * PaymentIntent was created), so this is a free retry down the correct path, and the
             * alternative is a line the client cannot act on for a class they already own.
             */
            // The duplicate permission travels with the retry. Without it, tapping "Book another
            // spot" on a class a pass turns out to cover would be refused all over again — the
            // client's explicit answer dropped on the way down the correct path.
            return bookOneWithPass(line, allowDuplicate);
          }
          if (error.refusalCode === 'already_booked') {
            setOutcome(line.eventId, {
              kind: 'alreadyBooked',
              message: error.message,
              existingCount: error.existingBookingCount,
            });
            return false;
          }
          if (error.refusalCode === 'price_changed' && error.breakdown) {
            setOutcome(line.eventId, {
              kind: 'priceChanged',
              charge: chargeFromServerBreakdown(error.breakdown, currency),
              message: error.message,
            });
            return false;
          }
          setOutcome(line.eventId, {
            kind: 'failed',
            message: error.message,
            nothingCharged: error.nothingCharged,
          });
          return false;
        }

        setOutcome(line.eventId, {
          kind: 'failed',
          message:
            error instanceof Error && error.message
              ? error.message
              : 'Something went wrong. Please try again.',
          // Unknown failure: do NOT claim nothing was charged. The only honest source for that is
          // the server saying so.
          nothingCharged: false,
        });
        return false;
      }
    },
    [
      account,
      bookOneWithPass,
      currency,
      initPaymentSheet,
      presentPaymentSheet,
      publishableKey,
      setOutcome,
    ],
  );

  const run = useCallback(
    (items: BookableItem[]) => {
      if (running.current || items.length === 0) return;

      running.current = true;
      setPhase({ kind: 'working' });
      // MERGED, never replaced: a line booked on an earlier run keeps its `booked` outcome, so a
      // retry of the two that failed does not wipe the confirmation for the one that worked.
      setOutcomes((current) => ({
        ...current,
        ...Object.fromEntries(items.map((item) => [item.line.eventId, { kind: 'pending' } as const])),
      }));

      void (async () => {
        let booked = 0;
        let stoppedEarly = false;

        for (const item of items) {
          try {
            // Pass-covered lines book through a different endpoint and open no sheet. Ordered by
            // the CALLER, which puts them first — see `bookableItems` in the checkout route.
            const succeeded =
              item.line.state === 'covered'
                ? await bookOneWithPass(item.line, item.allowDuplicate === true)
                : await bookOne(item);
            if (succeeded) booked += 1;
          } catch {
            // The only throw that reaches here is a sheet dismissal. Everything still pending is
            // left pending rather than marked failed — the client did not fail, they stopped.
            stoppedEarly = true;
            break;
          }
        }

        running.current = false;
        setPhase({ kind: 'done', booked, stoppedEarly });

        if (booked > 0) {
          // Invalidate rather than patch: the roster is the record, and a locally-patched capacity
          // is a number that can disagree with what the next client sees.
          void queryClient.invalidateQueries({ queryKey: ['schedule'] });
          if (account) {
            void queryClient.invalidateQueries({
              queryKey: queryKeys.upcoming(account.userid, studio.dibsStudioId),
            });
            void queryClient.invalidateQueries({
              queryKey: queryKeys.paymentMethods(account.userid),
            });
            void queryClient.invalidateQueries({
              queryKey: queryKeys.passes(account.userid, studio.dibsStudioId),
            });
          }
        }
      })();
    },
    [account, bookOne, bookOneWithPass, queryClient],
  );

  const clearBooked = useCallback(() => {
    for (const eventId of bookedIds.current) removeFromCart(eventId);
    bookedIds.current = [];
  }, [removeFromCart]);

  return { phase, outcomes, run, clearBooked };
}

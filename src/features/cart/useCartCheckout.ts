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
  bookClassWithCredit,
  bookClassWithPass,
  confirmClassBooking,
  createClassPaymentIntent,
  queryKeys,
  type ClientBookings,
} from '@/api';
import { BookingRefusedError } from '@/api/endpoints/class-booking';
import type { UpcomingBookingRow } from '@/api/schemas/upcoming';
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
  /**
   * This class can never be booked from the app, however many times it is tried.
   *
   * Today that means one thing: a VIRTUAL class at a studio that does not sell them in the app
   * (`class_unavailable_in_app`), reachable only from a cart persisted before the flag moved.
   *
   * It is separate from `failed` because the two need opposite handling by the CTA. A failed line
   * is usually worth retrying — a network blip, a full class, a decline. This one is not: the
   * server reads the event row and the studio config, so the answer is identical every time.
   * Leaving it in `outstanding` would keep it in the total and on the button, and the client would
   * tap "Try again · $22.00" forever underneath a sentence explaining why it cannot work.
   *
   * That is the same dead end `alreadyBooked` was pulled out of `failed` to fix, and the same
   * shape as the widget's "Use this card" button that dispatched nothing.
   */
  | { kind: 'unavailable'; message: string }
  /**
   * The client's studio credit balance moved between the screen and the call — spent on another
   * device, most often.
   *
   * A RE-RENDER, not a failure: nothing was charged and no PaymentIntent was created. The line
   * shows the server's fresh split and the same button confirms it. Same treatment as
   * `priceChanged`, and it counts toward the CTA for the same reason — pressing again genuinely
   * produces a different answer.
   */
  | {
      kind: 'creditChanged';
      charge: ClassCharge;
      creditAppliedCents: number;
      cardCents: number;
      message: string;
    }
  | { kind: 'failed'; message: string; nothingCharged: boolean };

/**
 * Refusal codes that will never succeed on a retry, whatever the client does.
 *
 * Deliberately a narrow allow-list rather than "anything that is not obviously transient". A code
 * wrongly listed here costs the client a booking they could have had; a code wrongly absent costs
 * them a retry. Add to it only when the server's answer is genuinely a property of the class.
 */
const PERMANENT_REFUSALS = new Set(['class_unavailable_in_app']);

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
   * True ONLY on a run the client started by answering "Yes, add a spot" on a line that had come
   * back `already_booked`. It is deliberately per-item rather than per-run: a cart of three where
   * one line is a duplicate must not silently license duplicates on the other two.
   */
  allowDuplicate?: boolean;
  /**
   * The credit portion this line DISPLAYED, in cents, from `allocateCreditAcrossLines`.
   *
   * A prediction, not a reservation. The server resolves the split itself against the live balance
   * and refuses `credit_changed` if it disagrees — which is exactly what happens when the balance
   * moved on another device, or when an earlier line in this run failed and did not consume its
   * share. Either way the answer is a re-render, never a charge at a different number.
   *
   * Undefined means credit is not in play for this line at all.
   */
  creditCents?: number;
  /** The client's own toggle. Sent as a yes/no; it never carries an amount. */
  applyCredit?: boolean;
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
  /**
   * The credit-only booker, held in a ref purely to break a declaration cycle.
   *
   * The two paths hand off to each other in both directions — a card booking whose credit turns
   * out to cover the class routes to credit, and a credit booking whose balance turns out not to
   * cover it falls back to card. Neither can be declared first, and the alternative (inlining one
   * inside the other) would give the same refusal two different handlers.
   */
  const bookWithCreditRef = useRef<
    ((line: CartLine, totalCents: number, allowDuplicate?: boolean) => Promise<boolean>) | null
  >(null);

  const setOutcome = useCallback((eventId: number, outcome: LineOutcome) => {
    setOutcomes((current) => ({ ...current, [eventId]: outcome }));
  }, []);

  /**
   * Put the just-booked class into the cached calendar NOW, from what we hold.
   *
   * The mirror of the drop path's optimistic write, for the same reason: the server has just
   * CONFIRMED this booking, and `get-upcoming-appts` is the slowest endpoint the app calls — so
   * without this, a client who books and taps My Calendar sees a list without the class they
   * just paid for, which reads as a booking that did not happen (Alicia, 2026-08-16). The
   * invalidation in `run` still refetches, and the server's own row — with the instructor and
   * location this sketch omits — replaces the sketch when it lands (`groupBookings` dedupes on
   * event id + start).
   *
   * Skipped when there is no cached response to extend: inventing a whole response around one
   * row would claim the OTHER bookings don't exist, and the refetch covers that case anyway.
   */
  const addToCalendarCache = useCallback(
    (line: CartLine, booked: { transactionId: number | null; serviceName: string | null }) => {
      if (!account || !line.entry) return;
      const row: UpcomingBookingRow = {
        eventid: line.eventId,
        start_date: line.entry.startsAt,
        name: line.entry.name,
        classtitle: line.entry.name,
        dropped: false,
        checkedin: false,
        serviceName: booked.serviceName,
        // Null is honest when the response did not carry one — the row renders without a Cancel
        // affordance until the refetch supplies the real id, rather than posting NaN at the
        // drop endpoint.
        dibsTransactionId: booked.transactionId,
      };
      queryClient.setQueryData<ClientBookings>(
        queryKeys.upcoming(account.userid, studio.dibsStudioId),
        (cached) => (cached ? { ...cached, upcoming: [...cached.upcoming, row] } : cached),
      );
    },
    [account, queryClient],
  );

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
        const result = await bookClassWithPass(apiClient, {
          dibsStudioId: studio.dibsStudioId,
          eventId: line.eventId,
          // A REQUEST, not an instruction — the server verifies it against the client's own
          // covering passes. Sent so the pass the screen named is the pass that gets spent.
          passId: line.passId,
          allowDuplicate,
        });

        setOutcome(line.eventId, { kind: 'booked' });
        if (!bookedIds.current.includes(line.eventId)) bookedIds.current.push(line.eventId);
        addToCalendarCache(line, {
          transactionId: result.redemptionTransactionId ?? null,
          // The server's name for the pass it actually spent, falling back to the one the screen
          // offered — the calendar row's "paid with" line.
          serviceName: result.packageName ?? line.passName ?? null,
        });
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
          if (PERMANENT_REFUSALS.has(error.refusalCode ?? '')) {
            setOutcome(line.eventId, { kind: 'unavailable', message: error.message });
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
    [addToCalendarCache, setOutcome],
  );

  /** Book ONE class. Throws only `SheetDismissed`; every other failure becomes an outcome. */
  const bookOne = useCallback(
    async ({
      line,
      totalCents,
      allowDuplicate = false,
      creditCents,
      applyCredit,
    }: BookableItem): Promise<boolean> => {
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
          ...(applyCredit === undefined ? {} : { applyCredit }),
          ...(typeof creditCents === 'number' ? { displayedCreditCents: creditCents } : {}),
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
        const confirmed = await confirmClassBooking(apiClient, {
          dibsStudioId: studio.dibsStudioId,
          paymentIntentId: intent.paymentIntentId,
        });

        setOutcome(line.eventId, { kind: 'booked' });
        if (!bookedIds.current.includes(line.eventId)) bookedIds.current.push(line.eventId);
        addToCalendarCache(line, {
          transactionId: confirmed.redemptionTransactionId ?? null,
          serviceName: null,
        });
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
          /*
           * Their credit turns out to cover the whole class, so there is nothing for a card to do
           * and Stripe would reject a $0 PaymentIntent. Book it the other way rather than reporting
           * a refusal — nothing was charged (no PaymentIntent was created), so this is a free retry
           * down the correct path. Exactly the shape of the `covered_by_pass` handoff above.
           */
          if (error.refusalCode === 'credit_covers_class' && bookWithCreditRef.current) {
            return bookWithCreditRef.current(line, totalCents, allowDuplicate);
          }
          /*
           * The balance moved between the screen and the call. A RE-RENDER, not an error — the
           * line comes back showing the server's split and the client confirms it, which is the
           * `price_changed` treatment applied to the second funding source.
           *
           * The server's figures are used verbatim. Recomputing here would reproduce the
           * disagreement that caused the refusal.
           */
          if (error.refusalCode === 'credit_changed' && error.breakdown) {
            setOutcome(line.eventId, {
              kind: 'creditChanged',
              charge: chargeFromServerBreakdown(error.breakdown, currency),
              creditAppliedCents: error.creditSplit?.creditAppliedCents ?? 0,
              cardCents: error.creditSplit?.cardCents ?? error.breakdown.totalCents,
              message: error.message,
            });
            return false;
          }
          if (PERMANENT_REFUSALS.has(error.refusalCode ?? '')) {
            setOutcome(line.eventId, { kind: 'unavailable', message: error.message });
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
      addToCalendarCache,
      bookOneWithPass,
      currency,
      initPaymentSheet,
      presentPaymentSheet,
      publishableKey,
      setOutcome,
    ],
  );

  /**
   * Book ONE class paid for entirely by credit. No sheet, no card, one call.
   *
   * Separate from the card path because Stripe rejects a $0 PaymentIntent — a fully-covered class
   * cannot go down the card flow at all. Never throws.
   */
  const bookOneWithCredit = useCallback(
    async (line: CartLine, totalCents: number, allowDuplicate = false): Promise<boolean> => {
      setOutcome(line.eventId, { kind: 'working' });

      try {
        const result = await bookClassWithCredit(apiClient, {
          dibsStudioId: studio.dibsStudioId,
          eventId: line.eventId,
          displayedTotalCents: totalCents,
          allowDuplicate,
        });

        setOutcome(line.eventId, { kind: 'booked' });
        if (!bookedIds.current.includes(line.eventId)) bookedIds.current.push(line.eventId);
        addToCalendarCache(line, {
          transactionId: result.transactionId ?? null,
          serviceName: null,
        });
        return true;
      } catch (error) {
        if (error instanceof BookingRefusedError) {
          /*
           * The balance no longer covers it — spent on another device, or an earlier line in this
           * run took more than predicted. NOT an error: the card flow handles a partial split, so
           * this falls back to it rather than telling the client something went wrong.
           *
           * The fresh figures ride on the refusal, and the card path will resolve the split again
           * server-side anyway, so nothing here has to recompute.
           */
          if (error.refusalCode === 'insufficient_credit') {
            return bookOne({
              line,
              totalCents,
              allowDuplicate,
              applyCredit: true,
              creditCents: error.creditSplit?.creditAppliedCents ?? 0,
            });
          }
          if (error.refusalCode === 'already_booked') {
            setOutcome(line.eventId, {
              kind: 'alreadyBooked',
              message: error.message,
              existingCount: error.existingBookingCount,
            });
            return false;
          }
          if (PERMANENT_REFUSALS.has(error.refusalCode ?? '')) {
            setOutcome(line.eventId, { kind: 'unavailable', message: error.message });
            return false;
          }
          setOutcome(line.eventId, {
            kind: 'failed',
            message: error.message,
            // No card was involved at all, so this is always true.
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
    [addToCalendarCache, setOutcome, bookOne],
  );


  bookWithCreditRef.current = bookOneWithCredit;

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

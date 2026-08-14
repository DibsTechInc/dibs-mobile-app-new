/**
 * ⚠️ NO CALLERS as of 2026-08-13 — superseded by `features/cart/useCartCheckout`, flagged for
 * delete approval rather than deleted (deleting files is an approval item).
 *
 * Class detail used to run this booking flow itself, which made it a SECOND place that could
 * create a PaymentIntent and decide a price. Both entry points — the schedule row's Book button
 * and class detail's CTA — now add to the cart and lead to `/checkout`, which is the one screen
 * that takes money. The logic below survives inside `useCartCheckout`, extended to book several
 * classes in sequence and to report per-class outcomes.
 *
 * Delete this once the cart flow has been through a round of real testing. Until then it is a
 * cheap rollback.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 *
 * Booking a class with a card, from the app.
 *
 *   1. Create an UNCONFIRMED, manual-capture PaymentIntent (server prices the class itself).
 *   2. PaymentSheet confirms it → the card is AUTHORIZED, 3DS runs here, nothing is captured.
 *   3. Confirm: the server claims the seat atomically, THEN captures, then records the booking.
 *
 * ── Two taps for a returning client ────────────────────────────────────────────────────────────
 * The CustomerSession from step 1 puts their saved card in the sheet already selected, so the
 * whole flow is "Book" then "Pay". Steps 1 and 2 are one press: the sheet is initialised on demand
 * rather than on mount, because a sheet prepared for a class the client never books is a
 * PaymentIntent nobody ever confirms.
 *
 * ── Cancelling is a decision, not an error ─────────────────────────────────────────────────────
 * Dismissing the sheet returns `Canceled`, and the flow ends silently — the same rule
 * `useCardActions` already follows for card entry. Telling somebody off for changing their mind is
 * worse than doing nothing.
 *
 * ── Every ending is reachable ──────────────────────────────────────────────────────────────────
 * `status` is the state machine, and each of its values has a way out: idle → the button;
 * priceChanged → confirm the new figure or back out; error → the message plus the button again;
 * booked → the confirmation. There is deliberately no state that can be entered and not exited.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStripe } from '@stripe/stripe-react-native';
import { useCallback, useState } from 'react';

import {
  apiClient,
  confirmClassBooking,
  createClassPaymentIntent,
  queryKeys,
} from '@/api';
import { BookingRefusedError } from '@/api/endpoints/class-booking';
import type { ConfirmClassBookingResponse } from '@/api/schemas/class-booking';
import { studio } from '@/config/studio';
import {
  chargeFromServerBreakdown,
  type ClassCharge,
} from '@/domain/pricing/class-charge';
import { useAuth } from '@/features/auth/AuthProvider';
import { stripeRedirectUrl, withConnectedStripeAccount } from '@/features/payments/stripeSession';
import { useStripeReadiness } from '@/features/payments/StripeSdkProvider';

/** The client dismissed the sheet. Never shown to them. */
class SheetDismissed extends Error {
  constructor() {
    super('Payment sheet dismissed.');
    this.name = 'SheetDismissed';
  }
}

export type BookingStatus =
  | { kind: 'idle' }
  | { kind: 'working' }
  /**
   * The server priced the class differently from what was on screen. NOT an error — the price
   * updated, and the client is being asked to confirm the true one. Nothing was charged; no
   * PaymentIntent was even created.
   */
  | { kind: 'priceChanged'; charge: ClassCharge; message: string }
  /**
   * The client already holds a pass that covers this class, so the server refused to take a card.
   * Good news, not a failure — it is styled and worded as such, and the CTA comes down because
   * there is nothing to do here by card. Pass booking is P3 items 1–2; until it lands the message
   * names the package and points at the studio.
   */
  | { kind: 'coveredByPass'; message: string }
  | { kind: 'booked'; booking: ConfirmClassBookingResponse }
  | {
      kind: 'error';
      message: string;
      /** True when the server confirmed no money moved, so the copy can say so plainly. */
      nothingCharged: boolean;
    };

export interface UseBookClassArgs {
  eventId: number;
  /** From `get-basic-config`, so a Canadian studio's total is not labelled in US dollars. */
  currency?: string;
}

/**
 * `book(totalCents)` takes the figure EXPLICITLY rather than reading it off a charge held here:
 * after a `price_changed` the screen is showing the server's new number, and the value sent must
 * be the one the client just agreed to, not the one this hook was created with. One source for
 * that number — the screen — and it is the same source the button label is rendered from.
 */
export function useBookClass({ eventId, currency }: UseBookClassArgs) {
  const { account } = useAuth();
  const { publishableKey } = useStripeReadiness();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<BookingStatus>({ kind: 'idle' });

  const reset = useCallback(() => setStatus({ kind: 'idle' }), []);

  const mutation = useMutation({
    /** @param totalCents the figure currently on screen — see the note on `useBookClass`. */
    mutationFn: async (totalCents: number) => {
      if (!publishableKey) {
        // "We have not asked Stripe yet" is not "you cannot pay" — the readiness state exists so
        // this can say something true instead of failing inside the sheet.
        throw new Error('Payments are still starting up. Give it a moment and try again.');
      }

      const intent = await createClassPaymentIntent(apiClient, {
        dibsStudioId: studio.dibsStudioId,
        eventId,
        displayedTotalCents: totalCents,
      });

      // The SDK is global native state: this points it at the studio's connected account for the
      // sheet and puts the platform configuration back afterwards, whatever happens inside.
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
            // v1 is card-only server-side, and cards settle immediately — nothing in this sheet
            // completes after a delay.
            allowsDelayedPaymentMethods: false,
            defaultBillingDetails: {
              name: [account?.firstName, account?.lastName].filter(Boolean).join(' ') || undefined,
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

      // The card is AUTHORIZED, not charged. The server takes the seat first and captures only
      // once it is secured.
      return confirmClassBooking(apiClient, {
        dibsStudioId: studio.dibsStudioId,
        paymentIntentId: intent.paymentIntentId,
      });
    },

    onMutate: () => setStatus({ kind: 'working' }),

    onSuccess: (booking) => {
      setStatus({ kind: 'booked', booking });
      // Invalidate rather than patch: the roster is the record, and a locally-patched capacity is
      // a number that can disagree with what the next client sees.
      void queryClient.invalidateQueries({ queryKey: ['schedule'] });
      if (account) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.upcoming(account.userid, studio.dibsStudioId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.paymentMethods(account.userid),
        });
      }
    },

    onError: (error) => {
      if (error instanceof SheetDismissed) {
        setStatus({ kind: 'idle' });
        return;
      }

      if (error instanceof BookingRefusedError) {
        if (error.refusalCode === 'covered_by_pass') {
          setStatus({ kind: 'coveredByPass', message: error.message });
          return;
        }
        if (error.refusalCode === 'price_changed' && error.breakdown) {
          setStatus({
            kind: 'priceChanged',
            charge: chargeFromServerBreakdown(error.breakdown, currency),
            message: error.message,
          });
          return;
        }
        setStatus({
          kind: 'error',
          message: error.message,
          nothingCharged: error.nothingCharged,
        });
        return;
      }

      setStatus({
        kind: 'error',
        message:
          error instanceof Error && error.message
            ? error.message
            : 'Something went wrong. Please try again.',
        // Unknown failure: do NOT claim nothing was charged. The only honest source for that is
        // the server saying so.
        nothingCharged: false,
      });
    },
  });

  const book = useCallback((totalCents: number) => mutation.mutate(totalCents), [mutation]);

  return { status, book, reset, isWorking: status.kind === 'working' };
}

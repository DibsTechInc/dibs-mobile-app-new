/**
 * Buying a class pack with a card.
 *
 *   1. Create an UNCONFIRMED, manual-capture PaymentIntent (the server prices the package).
 *   2. PaymentSheet confirms it → the card is AUTHORIZED, 3DS runs here, nothing is captured.
 *   3. Confirm: the server re-checks purchase limits, THEN captures, then creates the pass.
 *
 * The same rail as class booking, deliberately — see `useCartCheckout` for why manual capture and
 * a CustomerSession are what they are. The differences are only that there is no seat to claim and
 * only ever one item.
 *
 * ── Cancelling is a decision, not an error ─────────────────────────────────────────────────────
 * Dismissing the sheet returns `Canceled` and the flow ends silently, back at idle. Telling
 * somebody off for changing their mind about spending $200 is worse than doing nothing.
 *
 * ── Every ending is reachable ──────────────────────────────────────────────────────────────────
 * `status` is the state machine and each value has a way out: idle → the Buy button;
 * priceChanged → confirm the new figure or back out; error → the message plus the button again;
 * bought → the confirmation and a way onward. There is no state that can be entered and not exited.
 */
import { useStripe } from '@stripe/stripe-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import { apiClient, confirmPackagePurchase, createPackagePaymentIntent, queryKeys } from '@/api';
import { PurchaseRefusedError } from '@/api/endpoints/package-purchase';
import type { ConfirmPackagePurchaseResponse } from '@/api/schemas/package-purchase';
import { studio } from '@/config/studio';
import { formatBalance } from '@/domain/money/format';
import { useAuth } from '@/features/auth/AuthProvider';
import { applePaySheetParams, stripeRedirectUrl, withConnectedStripeAccount } from '@/features/payments/stripeSession';
import { useStripeReadiness } from '@/features/payments/StripeSdkProvider';

/** The client dismissed the sheet. Never shown to them. */
class SheetDismissed extends Error {
  constructor() {
    super('Payment sheet dismissed.');
    this.name = 'SheetDismissed';
  }
}

export type PurchaseStatus =
  | { kind: 'idle' }
  | { kind: 'working'; packageId: number }
  /**
   * The server priced the package differently from what was on screen. NOT an error — nothing was
   * charged and no PaymentIntent was created. The client is shown the true figure and confirms it.
   */
  | { kind: 'priceChanged'; packageId: number; totalCents: number; totalLabel: string; message: string }
  | { kind: 'bought'; packageId: number; purchase: ConfirmPackagePurchaseResponse }
  | { kind: 'error'; packageId: number; message: string; nothingCharged: boolean };

export interface UsePurchasePackageArgs {
  currency?: string;
}

/**
 * `buy(packageId, totalCents)` takes the figure EXPLICITLY, for the same reason `useCartCheckout`
 * does: after a `price_changed` the screen is showing the SERVER's new number, and the value sent
 * must be the one the client just agreed to. One source for that figure — the screen — and it is
 * the same source the button label renders from.
 */
export function usePurchasePackage({ currency }: UsePurchasePackageArgs = {}) {
  const { account } = useAuth();
  const { publishableKey } = useStripeReadiness();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<PurchaseStatus>({ kind: 'idle' });
  const reset = useCallback(() => setStatus({ kind: 'idle' }), []);

  const mutation = useMutation({
    mutationFn: async ({
      packageId,
      totalCents,
    }: {
      packageId: number;
      totalCents: number;
    }) => {
      if (!publishableKey) {
        // "We have not asked Stripe yet" is not "you cannot pay" — the readiness state exists so
        // this can say something true instead of failing inside the sheet.
        throw new Error('Payments are still starting up. Give it a moment and try again.');
      }

      const intent = await createPackagePaymentIntent(apiClient, {
        dibsStudioId: studio.dibsStudioId,
        packageId,
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
            // Apple Pay, when this studio's build carries a merchant id. See applePaySheetParams.
            ...applePaySheetParams(),
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

      // The card is AUTHORIZED, not charged. The server re-checks the purchase limits and captures
      // only once it knows the client may still buy this.
      const purchase = await confirmPackagePurchase(apiClient, {
        dibsStudioId: studio.dibsStudioId,
        paymentIntentId: intent.paymentIntentId,
      });

      return { packageId, purchase };
    },

    onMutate: ({ packageId }) => setStatus({ kind: 'working', packageId }),

    onSuccess: ({ packageId, purchase }) => {
      setStatus({ kind: 'bought', packageId, purchase });
      if (account) {
        // The new pass has to appear everywhere at once — the wallet, the drawer balances, AND the
        // schedule, whose rows now read "Included" for classes this pack covers. Invalidating the
        // passes key is what makes the coverage decision re-run.
        void queryClient.invalidateQueries({
          queryKey: queryKeys.passes(account.userid, studio.dibsStudioId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.paymentMethods(account.userid),
        });
      }
      // An intro offer the client just used up must stop being offered.
      void queryClient.invalidateQueries({ queryKey: queryKeys.packages(studio.dibsStudioId) });
    },

    onError: (error, variables) => {
      const packageId = variables?.packageId ?? 0;

      if (error instanceof SheetDismissed) {
        setStatus({ kind: 'idle' });
        return;
      }

      if (error instanceof PurchaseRefusedError) {
        if (error.refusalCode === 'price_changed' && error.breakdown) {
          setStatus({
            kind: 'priceChanged',
            packageId,
            totalCents: error.breakdown.totalCents,
            totalLabel: formatBalance(error.breakdown.totalCents / 100, currency),
            message: error.message,
          });
          return;
        }
        setStatus({
          kind: 'error',
          packageId,
          message: error.message,
          nothingCharged: error.nothingCharged,
        });
        return;
      }

      setStatus({
        kind: 'error',
        packageId,
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

  const buy = useCallback(
    (packageId: number, totalCents: number) => mutation.mutate({ packageId, totalCents }),
    [mutation],
  );

  return { status, buy, reset };
}

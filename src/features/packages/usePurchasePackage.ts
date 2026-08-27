/**
 * Buying a class pack — by card, by studio credit, or both.
 *
 * Two routes, decided by the split the checkout sheet displayed:
 *
 *   credit covers it → ONE call (`purchase-with-credit`), no PaymentSheet. Stripe rejects a $0
 *                      PaymentIntent, so a fully-covered purchase has no card leg at all.
 *   anything else    → the two-call card rail: an UNCONFIRMED, manual-capture PaymentIntent
 *                      (sized to the CARD REMAINDER when credit is applied), the sheet
 *                      authorizes, and confirm claims the credit, captures, and creates the pass.
 *
 * The same rail as class booking, deliberately — see `useCartCheckout` for why manual capture and
 * a CustomerSession are what they are.
 *
 * ── The app never decides how much credit is spent ─────────────────────────────────────────────
 * It sends `applyCredit` (the client's yes/no) and `displayedCreditCents` (what the sheet showed).
 * The server resolves the split from the LIVE balance and refuses `credit_changed` on any
 * disagreement — so a stale balance is a re-render, never a wrong charge. A `credit_covers_package`
 * refusal (the balance GREW mid-checkout) hands off to the credit call, same as the cart does for
 * classes: the client said "use my credit", and the handoff only ever charges the card LESS.
 *
 * ── Cancelling is a decision, not an error ─────────────────────────────────────────────────────
 * Dismissing the sheet returns `Canceled` and the flow ends silently, back at idle.
 *
 * ── Every ending is reachable ──────────────────────────────────────────────────────────────────
 * idle → the Buy button; priceChanged / creditChanged → the sheet re-renders the fresh figures
 * and the same button confirms them; error → the message plus the button; bought → the
 * confirmation. There is no state that can be entered and not exited.
 */
import { useStripe } from '@stripe/stripe-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import {
  apiClient,
  confirmPackagePurchase,
  createPackagePaymentIntent,
  purchasePackageWithCredit,
  queryKeys,
} from '@/api';
import { PurchaseRefusedError } from '@/api/endpoints/package-purchase';
import type { ConfirmPackagePurchaseResponse } from '@/api/schemas/package-purchase';
import { studio } from '@/config/studio';
import type { CreditSplit } from '@/domain/credit/split';
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
  | { kind: 'working'; packageId: number; via: 'card' | 'credit' }
  /**
   * The server priced the package differently from what was on screen. NOT an error — nothing was
   * charged and no PaymentIntent was created. The client is shown the true figure and confirms it.
   */
  | { kind: 'priceChanged'; packageId: number; totalCents: number; totalLabel: string; message: string }
  /**
   * The credit balance moved between the screen and the call — spent (or granted) on another
   * device, most often. Worded as news exactly like `priceChanged`: nothing was charged, and the
   * sheet re-renders the fresh split for the same button to confirm.
   */
  | { kind: 'creditChanged'; packageId: number; message: string }
  | { kind: 'bought'; packageId: number; purchase: ConfirmPackagePurchaseResponse }
  | { kind: 'error'; packageId: number; message: string; nothingCharged: boolean };

export interface UsePurchasePackageArgs {
  currency?: string;
}

/**
 * What the checkout sheet displayed about the client's credit, passed with the tap that agreed to
 * it. Absent entirely for a caller that offers no credit (a membership) — the server then keeps
 * its legacy full-price behavior.
 */
export interface PurchaseCreditChoice {
  applyCredit: boolean;
  /** The split the sheet rendered, from `domain/credit/split.ts` — the figures on screen. */
  split: CreditSplit;
}

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
      credit,
    }: {
      packageId: number;
      totalCents: number;
      credit?: PurchaseCreditChoice;
    }) => {
      const creditOnly =
        credit !== undefined && credit.applyCredit && credit.split.kind === 'credit-only';

      // ── Fully covered: one call, no sheet ──────────────────────────────────────────────────
      if (creditOnly) {
        const purchase = await purchasePackageWithCredit(apiClient, {
          dibsStudioId: studio.dibsStudioId,
          packageId,
          displayedTotalCents: totalCents,
        });
        return { packageId, purchase };
      }

      // ── The card rail, with the displayed credit riding along for the server to verify ─────
      if (!publishableKey) {
        // "We have not asked Stripe yet" is not "you cannot pay" — the readiness state exists so
        // this can say something true instead of failing inside the sheet.
        throw new Error('Payments are still starting up. Give it a moment and try again.');
      }

      let intent;
      try {
        intent = await createPackagePaymentIntent(apiClient, {
          dibsStudioId: studio.dibsStudioId,
          packageId,
          displayedTotalCents: totalCents,
          // Sending a NUMBER (even 0) is what marks this build credit-aware. Omitted entirely
          // when the caller offers no credit, which keeps the server's legacy behavior.
          ...(credit !== undefined
            ? {
                applyCredit: credit.applyCredit,
                displayedCreditCents: credit.applyCredit ? credit.split.creditAppliedCents : 0,
              }
            : {}),
        });
      } catch (error) {
        /*
         * The balance GREW mid-checkout and now covers the package. The client asked for their
         * credit to be applied, so hand off to the credit call — it re-verifies everything, and
         * the only difference from what was on screen is that the card is charged NOTHING.
         * The cart does exactly this for classes.
         */
        if (
          error instanceof PurchaseRefusedError &&
          error.refusalCode === 'credit_covers_package' &&
          credit?.applyCredit === true
        ) {
          const purchase = await purchasePackageWithCredit(apiClient, {
            dibsStudioId: studio.dibsStudioId,
            packageId,
            displayedTotalCents: totalCents,
          });
          return { packageId, purchase };
        }
        throw error;
      }

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

      // The card is AUTHORIZED, not charged. The server re-checks the purchase limits, claims any
      // credit atomically, and captures only once it knows the client may still buy this.
      const purchase = await confirmPackagePurchase(apiClient, {
        dibsStudioId: studio.dibsStudioId,
        paymentIntentId: intent.paymentIntentId,
      });

      return { packageId, purchase };
    },

    onMutate: ({ packageId, credit }) =>
      setStatus({
        kind: 'working',
        packageId,
        // Named by funding route — "Charging your card…" over a credit purchase is a claim about
        // the client's money that is not true.
        via:
          credit !== undefined && credit.applyCredit && credit.split.kind === 'credit-only'
            ? 'credit'
            : 'card',
      }),

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
        // The balance moved (or may have) — the wallet and the next checkout must agree on it.
        void queryClient.invalidateQueries({
          queryKey: queryKeys.credit(account.userid, studio.dibsStudioId),
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

        /*
         * The balance moved under the split on screen. Refresh the balance the sheet reads —
         * that is what makes its next render show the TRUE figures — and word it as news, not
         * failure: nothing was charged and nothing was taken.
         */
        if (
          error.refusalCode === 'credit_changed' ||
          error.refusalCode === 'insufficient_credit'
        ) {
          if (account) {
            void queryClient.invalidateQueries({
              queryKey: queryKeys.credit(account.userid, studio.dibsStudioId),
            });
          }
          setStatus({
            kind: 'creditChanged',
            packageId,
            message: 'Your studio credit balance changed. Nothing was charged — confirm the updated amounts below.',
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
    (packageId: number, totalCents: number, credit?: PurchaseCreditChoice) => {
      // Single-flight. A second tap while one purchase runs must not open a second sheet or make
      // a second credit claim — the button shows loading, but a guard beats a promise.
      if (mutation.isPending) return;
      mutation.mutate({ packageId, totalCents, credit });
    },
    [mutation],
  );

  return { status, buy, reset };
}

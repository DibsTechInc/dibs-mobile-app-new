/**
 * Adding, removing and defaulting a card.
 *
 * Every mutation here ends by invalidating the card list — never by patching it. Stripe is the
 * record; a locally-patched list is a list that can disagree with what will actually be charged,
 * which is the exact failure the widget spent July 2026 recovering from.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useStripe } from '@stripe/stripe-react-native';
import { useCallback } from 'react';

import {
  apiClient,
  createSetupIntent,
  ensureConnectedCustomer,
  queryKeys,
  removeCard,
  setDefaultCard,
} from '@/api';
import { ApiError } from '@/api/errors';
import { studio } from '@/config/studio';
import { toRemoveCardPayload, type SavedCard } from '@/domain/payments/cards';
import { useAuth } from '@/features/auth/AuthProvider';
import { stripeRedirectUrl } from '@/features/payments/stripeSession';

/** Raised when the client dismissed the PaymentSheet. Not an error to show them. */
export class CardEntryCancelled extends Error {
  constructor() {
    super('Card entry cancelled.');
    this.name = 'CardEntryCancelled';
  }
}

export function useCardActions() {
  const { account } = useAuth();
  const queryClient = useQueryClient();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const userid = account?.userid ?? null;

  const refreshCards = useCallback(async () => {
    if (userid === null) return;
    await queryClient.invalidateQueries({ queryKey: queryKeys.paymentMethods(userid) });
  }, [queryClient, userid]);

  /**
   * Add a card.
   *
   *   1. SetupIntent on the Dibs PLATFORM account, passing the client's EXISTING platform
   *      customer id — see `CreateSetupIntentArgs.customerId` for why that argument is not
   *      optional in practice.
   *   2. PaymentSheet in setup mode. The card attaches to the platform customer.
   *   3. Make sure a customer exists on the studio's CONNECTED account, so the clone at charge
   *      time has somewhere to land. This step is advisory — see below.
   *   4. Re-read the list from Stripe.
   */
  const addCard = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error('addCard requires a resolved account.');

      const { clientSecret } = await createSetupIntent(apiClient, {
        userid: account.userid,
        dibsStudioId: studio.dibsStudioId,
        email: account.email ?? '',
        name: [account.firstName, account.lastName].filter(Boolean).join(' '),
        customerId: account.platformStripeCustomerId,
      });

      const init = await initPaymentSheet({
        setupIntentClientSecret: clientSecret,
        merchantDisplayName: studio.appName,
        // The client is saving a card to use later, not paying now. Stripe uses this to word the
        // sheet's own copy and to set up future off-session use.
        //
        // Built from the scheme Expo actually registered, NOT from the slug: `app.config.ts` sets
        // `scheme: \`dibs-${slug}\``, so the old `${studio.slug}://stripe-redirect` produced
        // `everyday-ballet://…` — a scheme nothing on the device handles. It never surfaced here
        // because 3DS on a card SAVE is rare; it would have surfaced immediately on booking.
        returnURL: stripeRedirectUrl(),
      });
      if (init.error) {
        throw new ApiError({
          status: null,
          code: 'server',
          message: init.error.message ?? 'We could not open the card form. Please try again.',
          retriable: true,
          body: init.error,
        });
      }

      const result = await presentPaymentSheet();
      if (result.error) {
        // Dismissing the sheet is a decision, not a failure. Surfacing it as an error message
        // tells someone off for changing their mind.
        if (result.error.code === 'Canceled') throw new CardEntryCancelled();
        throw new ApiError({
          status: null,
          code: 'server',
          message: result.error.message ?? 'That card could not be saved. Please try another.',
          retriable: true,
          body: result.error,
        });
      }

      // ADVISORY. The card is already attached to the platform customer by this point, so a
      // failure here does not mean "your card was not saved" — and the charge path creates the
      // connected customer itself if it is still missing. Reporting it as a failed card-add would
      // send the client back to add a card they already have.
      try {
        await ensureConnectedCustomer(apiClient, {
          userid: account.userid,
          dibsStudioId: studio.dibsStudioId,
        });
      } catch (error) {
        console.warn('[cards] connected customer could not be prepared', error);
      }
    },
    onSuccess: refreshCards,
  });

  const remove = useMutation({
    mutationFn: async (card: SavedCard) => {
      if (userid === null) throw new Error('removeCard requires a resolved account.');
      await removeCard(apiClient, {
        userid,
        dibsStudioId: studio.dibsStudioId,
        // Stripe's own raw values, not our display ones — the endpoint matches by attribute
        // equality across both accounts, which is what detaches both copies of one card.
        card: toRemoveCardPayload(card),
      });
    },
    onSuccess: refreshCards,
  });

  const makeDefault = useMutation({
    mutationFn: async (card: SavedCard) => {
      if (userid === null) throw new Error('setDefaultCard requires a resolved account.');
      await setDefaultCard(apiClient, {
        userid,
        dibsStudioId: studio.dibsStudioId,
        paymentMethodId: card.id,
        // 'Dibs' | 'Studio', exact casing. The service uses it to decide whether the card must be
        // cloned onto the connected customer before it can be that account's default.
        platform: card.platform,
      });
    },
    onSuccess: refreshCards,
  });

  return { addCard, remove, makeDefault };
}

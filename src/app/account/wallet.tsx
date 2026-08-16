/**
 * The wallet route.
 *
 * Same redirect rule as the account hub: this screen is entirely about one person's money, so a
 * resolved signed-out status goes to sign-in and `initializing` waits.
 *
 * Owns the card mutations because they are what the screen's actions do, and keeps the screen
 * itself presentational.
 */
import { Redirect, router } from 'expo-router';
import { useCallback, useState } from 'react';

import { describeApiError } from '@/api';
import { studio } from '@/config/studio';
import type { SavedCard } from '@/domain/payments/cards';
import type { WalletPass } from '@/domain/wallet/build-wallet';
import { ManageCardSheet } from '@/features/account/ManageCardSheet';
import { useCardActions, CardEntryCancelled } from '@/features/account/useCardActions';
import { CancelMembershipSheet } from '@/features/account/CancelMembershipSheet';
import { useCancelMembership } from '@/features/account/useCancelMembership';
import { useWallet } from '@/features/account/useWallet';
import { WalletScreen } from '@/features/account/WalletScreen';
import { useAuth } from '@/features/auth/AuthProvider';
import { useStripeReadiness } from '@/features/payments/StripeSdkProvider';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { usePullRefresh } from '@/lib/usePullRefresh';

export default function WalletRoute() {
  const { status, account } = useAuth();
  const { config } = useStudioConfig();
  const wallet = useWallet();
  const [cancelling, setCancelling] = useState<WalletPass | null>(null);
  const cancelMembership = useCancelMembership();
  const stripe = useStripeReadiness();
  const pull = usePullRefresh(() => {
    // A failed key fetch is the reason the add-card button is missing, so the gesture that
    // refreshes the screen also retries it.
    if (stripe.error) stripe.retry();
    return wallet.refresh();
  });
  const { addCard, remove, makeDefault } = useCardActions();

  /** The card whose sheet is open. Null closes it. */
  const [managing, setManaging] = useState<SavedCard | null>(null);

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/account');
  }, []);

  const closeSheet = useCallback(() => {
    setManaging(null);
    remove.reset();
    makeDefault.reset();
  }, [remove, makeDefault]);

  if (status === 'guest') return <Redirect href="/sign-in" />;

  const studioName = config?.studioName ?? studio.appName;

  /**
   * Adding a card needs three things to be true, and each absence is a different sentence.
   *
   * `null` here means the button is not offered at all — which is right while Stripe's key is
   * still in flight or the identity has not resolved, because a card form that cannot open is
   * worse than one that has not appeared yet.
   */
  const addCardError = (() => {
    if (addCard.error instanceof CardEntryCancelled) return null;
    if (addCard.error) return describeApiError(addCard.error);
    if (stripe.error) return 'Card payments are unavailable right now. Pull down to try again.';
    return null;
  })();

  const canAddCard = stripe.isReady && account !== null;

  return (
    <>
      <WalletScreen
        data={wallet.data}
        studioName={studioName}
        isRefreshing={pull.isRefreshing}
        onRefresh={pull.onRefresh}
        onBack={onBack}
        // The pass carries its own package id; without one there is nothing to cancel against.
        onCancelMembership={(pass) => setCancelling(pass)}
        onAddCard={canAddCard ? () => addCard.mutate() : undefined}
        isAddingCard={addCard.isPending}
        addCardError={addCardError}
        onManageCard={setManaging}
        onBrowsePackages={() => router.push('/packages')}
      />

      <ManageCardSheet
        card={managing}
        studioName={studioName}
        isWorking={remove.isPending || makeDefault.isPending}
        error={
          remove.error
            ? describeApiError(remove.error)
            : makeDefault.error
              ? describeApiError(makeDefault.error)
              : null
        }
        onClose={closeSheet}
        onMakeDefault={(card) => makeDefault.mutate(card, { onSuccess: closeSheet })}
        onRemove={(card) => remove.mutate(card, { onSuccess: closeSheet })}
      />
    </>
  );
}

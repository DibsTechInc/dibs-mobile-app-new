/**
 * The wallet route.
 *
 * Same redirect rule as the account hub: this screen is entirely about one person's money, so a
 * resolved signed-out status goes to sign-in and `initializing` waits.
 */
import { Redirect, router } from 'expo-router';
import { useCallback } from 'react';

import { studio } from '@/config/studio';
import { useWallet } from '@/features/account/useWallet';
import { WalletScreen } from '@/features/account/WalletScreen';
import { useAuth } from '@/features/auth/AuthProvider';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export default function WalletRoute() {
  const { status } = useAuth();
  const { config } = useStudioConfig();
  const wallet = useWallet();

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/account');
  }, []);

  if (status === 'guest') return <Redirect href="/sign-in" />;

  return (
    <WalletScreen
      data={wallet.data}
      studioName={config?.studioName ?? studio.appName}
      isRefreshing={wallet.isRefreshing}
      onRefresh={wallet.refresh}
      onBack={onBack}
      // `onAddCard`, `onManageCard` and `onBrowsePackages` are deliberately absent: adding a card
      // needs the Stripe PaymentSheet wired in, and packages is P4. An affordance that leads
      // nowhere is the dead end this codebase keeps refusing to ship.
    />
  );
}

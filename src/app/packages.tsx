/**
 * The packages route.
 *
 * Deliberately NOT gated on a session. The price list is public studio data, and somebody deciding
 * whether this studio is worth joining should be able to see what a membership costs before they
 * make an account. Only the "your passes" section needs a client, and it says so rather than
 * rendering an empty list — the difference between "you have none" and "we have not looked", which
 * is the same distinction the wallet keeps.
 */
import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { studio } from '@/config/studio';
import { useAuth } from '@/features/auth/AuthProvider';
import { useWallet } from '@/features/account/useWallet';
import { useAppDrawer } from '@/features/nav/useAppDrawer';
import { PackagesScreen } from '@/features/packages/PackagesScreen';
import { usePackages } from '@/features/packages/usePackages';
import { usePurchasePackage } from '@/features/packages/usePurchasePackage';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export default function PackagesRoute() {
  const { status } = useAuth();
  const { config } = useStudioConfig();
  const packages = usePackages();
  const wallet = useWallet();
  const purchase = usePurchasePackage({ currency: config?.currency });
  const [menuOpen, setMenuOpen] = useState(false);
  const drawer = useAppDrawer({ visible: menuOpen, onClose: () => setMenuOpen(false) });

  const studioName = config?.studioName ?? studio.appName;
  const isSignedIn = status === 'signedIn';

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  return (
    <>
      <PackagesScreen
        packages={packages.items}
        isLoadingPackages={packages.isLoading}
        packagesError={packages.error}
        // `null` is "we have not looked" — a guest. `[]` is a signed-in client with genuinely no
        // passes, and the storefront below is the answer to that.
        ownedPasses={isSignedIn ? wallet.data.passes.items : null}
        ownedStatus={wallet.data.passes.status}
        studioName={studioName}
        isSignedIn={isSignedIn}
        purchase={purchase.status}
        // Only ever called for a package `buildPackages` marked purchasable, and the figure comes
        // from the card the client just pressed — never re-derived here.
        onBuy={isSignedIn ? (pkg, totalCents) => purchase.buy(pkg.id, totalCents) : undefined}
        isRefreshing={packages.isRefreshing || wallet.isRefreshing}
        onRefresh={() => {
          packages.refresh();
          if (isSignedIn) wallet.refresh();
        }}
        onBack={onBack}
        onOpenMenu={() => setMenuOpen(true)}
        onSignIn={() => router.push('/sign-in')}
      />
      {drawer}
    </>
  );
}

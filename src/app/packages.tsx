/**
 * The packages route.
 *
 * Deliberately NOT gated on a session. The price list is public studio data, and somebody deciding
 * whether this studio is worth joining should be able to see what a membership costs before they
 * make an account. Only the "your passes" section needs a client, and it says so rather than
 * rendering an empty list — the difference between "you have none" and "we have not looked", which
 * is the same distinction the wallet keeps.
 *
 * ── Buying a PACK goes through the checkout sheet ──────────────────────────────────────────────
 * Tapping Buy opens `PackageCheckoutSheet` — the step where studio credit gets applied — and the
 * split it displays is resolved HERE, from the same balance query the wallet reads, so the two
 * screens can never show different numbers. A MEMBERSHIP skips the sheet and goes straight down
 * the card path: its first cycle funds the card the subscription renews on, so credit is not
 * offered (the admin enrol flow is the one credit-on-membership surface, by design).
 */
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { studio } from '@/config/studio';
import { balanceToCents, resolveCreditSplit } from '@/domain/credit/split';
import { formatBalance } from '@/domain/money/format';
import type { PackageView } from '@/domain/packages/build-packages';
import { useAuth } from '@/features/auth/AuthProvider';
import { useCreditBalance } from '@/features/account/useCreditBalance';
import { useWallet } from '@/features/account/useWallet';
import { useAppDrawer } from '@/features/nav/useAppDrawer';
import { PackageCheckoutSheet } from '@/features/packages/PackageCheckoutSheet';
import { PackagesScreen } from '@/features/packages/PackagesScreen';
import { usePackages } from '@/features/packages/usePackages';
import { usePurchasePackage } from '@/features/packages/usePurchasePackage';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { usePullRefresh } from '@/lib/usePullRefresh';

export default function PackagesRoute() {
  const { status } = useAuth();
  const { config } = useStudioConfig();
  const packages = usePackages();
  const wallet = useWallet();
  const credit = useCreditBalance();
  const purchase = usePurchasePackage({ currency: config?.currency });
  const [menuOpen, setMenuOpen] = useState(false);
  /** The pack sitting in the checkout sheet. Null = sheet closed. */
  const [confirming, setConfirming] = useState<PackageView | null>(null);
  const [applyCredit, setApplyCredit] = useState(true);
  const drawer = useAppDrawer({ visible: menuOpen, onClose: () => setMenuOpen(false) });

  const studioName = config?.studioName ?? studio.appName;
  const currency = config?.currency;
  const isSignedIn = status === 'signedIn';
  const pull = usePullRefresh(() =>
    Promise.all([
      packages.refresh(),
      isSignedIn ? wallet.refresh() : null,
      isSignedIn ? credit.refetch() : null,
    ]),
  );

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  /*
   * The figure being agreed to. After a `price_changed` it is the SERVER's new number — one
   * source, read by the sheet's Total, its button label, and the confirm call alike.
   */
  const activeStatus =
    confirming && purchase.status.kind !== 'idle' && purchase.status.packageId === confirming.id
      ? purchase.status
      : null;
  const effectiveTotalCents =
    activeStatus?.kind === 'priceChanged' ? activeStatus.totalCents : (confirming?.totalCents ?? 0);

  const balanceCents = balanceToCents(credit.data);
  const split = resolveCreditSplit({
    totalCents: effectiveTotalCents,
    balanceCents,
    applyCredit,
  });

  const isWorking = activeStatus?.kind === 'working';

  // The purchase landed — the sheet's job is done, and the card behind it carries the
  // "Added to your account" confirmation.
  useEffect(() => {
    if (activeStatus?.kind === 'bought') setConfirming(null);
  }, [activeStatus?.kind]);

  const onBuy = useCallback(
    (pkg: PackageView, totalCents: number) => {
      if (pkg.kind === 'membership') {
        // No credit, no sheet — the pre-existing card path, unchanged. See the header.
        purchase.buy(pkg.id, totalCents);
        return;
      }
      // A `priceChanged` for THIS pack is kept: the sheet must open showing the server's fresh
      // figure, not the stale one it just refused. Everything else is cleared so one package's
      // error never renders under another's checkout.
      const s = purchase.status;
      if (!(s.kind === 'priceChanged' && s.packageId === pkg.id)) purchase.reset();
      setApplyCredit(true);
      setConfirming(pkg);
    },
    [purchase],
  );

  const onConfirm = useCallback(() => {
    if (!confirming || effectiveTotalCents <= 0) return;
    purchase.buy(confirming.id, effectiveTotalCents, { applyCredit, split });
  }, [confirming, effectiveTotalCents, applyCredit, split, purchase]);

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
        onBuy={isSignedIn ? onBuy : undefined}
        isRefreshing={pull.isRefreshing}
        onRefresh={pull.onRefresh}
        onBack={onBack}
        onOpenMenu={() => setMenuOpen(true)}
        onSignIn={() => router.push('/sign-in')}
      />
      <PackageCheckoutSheet
        pkg={confirming}
        totalCents={effectiveTotalCents}
        totalLabel={formatBalance(effectiveTotalCents / 100, currency)}
        split={split}
        applyCredit={applyCredit}
        onApplyCreditChange={setApplyCredit}
        hasCredit={balanceCents > 0}
        purchase={activeStatus}
        formatCents={(cents) => formatBalance(cents / 100, currency)}
        onConfirm={onConfirm}
        // Mid-purchase the sheet stays — a checkout that vanishes with money in flight reads as
        // something having gone wrong. Android back lands here too, hence the guard.
        onClose={() => {
          if (!isWorking) setConfirming(null);
        }}
      />
      {drawer}
    </>
  );
}

/**
 * The drawer, assembled once.
 *
 * There is no tab bar in this app, so the drawer is the ONLY way to move sideways — which makes it
 * the one piece of navigation that must be identical on every screen. Two screens building their
 * own item lists is how a "Packages" row ends up on one and not the other.
 *
 * Returns an element rather than data so a screen mounts it with `{drawer}` and knows nothing
 * about its contents.
 */
import { router } from 'expo-router';
import { useMemo } from 'react';

import { studio } from '@/config/studio';
import { useAuth } from '@/features/auth/AuthProvider';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { useWallet } from '@/features/account/useWallet';

import { DrawerMenu, type DrawerBalance, type DrawerItem } from './DrawerMenu';

export interface AppDrawerArgs {
  visible: boolean;
  onClose: () => void;
}

export function useAppDrawer({ visible, onClose }: AppDrawerArgs) {
  const { status, account } = useAuth();
  const { config } = useStudioConfig();
  const wallet = useWallet();

  const studioName = config?.studioName ?? studio.appName;
  const isSignedIn = status === 'signedIn';

  const go = (path: Parameters<typeof router.push>[0]) => () => {
    onClose();
    router.push(path);
  };

  /**
   * Credit first, then each usable pass.
   *
   * A guest gets `[]` — not "$0.00", which would be a claim about an account that does not exist.
   * `null` means the wallet is still resolving, and the drawer shows placeholders rather than a
   * balance it has not been told yet.
   */
  const balances = useMemo<DrawerBalance[] | null>(() => {
    if (!isSignedIn) return [];
    const { credit, passes } = wallet.data;
    if (credit.status === 'loading' && passes.status === 'loading') return null;

    const rows: DrawerBalance[] = [];
    if (credit.label) rows.push({ label: 'Credit balance', value: credit.label });
    for (const pass of passes.items) {
      rows.push({ label: pass.name, value: pass.remainingLabel });
    }
    return rows;
  }, [isSignedIn, wallet.data]);

  const items = useMemo<DrawerItem[]>(() => {
    const rows: DrawerItem[] = [{ label: 'Book', icon: 'book', onPress: go('/schedule') }];

    // Only rows whose destinations exist. Referrals are later — and a drawer row that leads
    // nowhere is the dead end this codebase keeps refusing to ship.
    if (isSignedIn) {
      // Directly under Book, as in the approved mock's drawer: the two are a pair — what is on
      // offer, and what you have taken up.
      rows.push({ label: 'My calendar', icon: 'myCalendar', onPress: go('/my-calendar') });
      // Third, between what you have booked and your account: buying a pack is the thing you do
      // BETWEEN booking and administration, and burying it under Account is how a client
      // concludes the app has no way to buy one (Alicia, 2026-08-13).
      rows.push({ label: 'Packages', icon: 'packages', onPress: go('/packages') });
      rows.push({ label: 'Account', icon: 'account', onPress: go('/account') });
      rows.push({
        label: 'Payment methods',
        icon: 'paymentMethods',
        onPress: go('/account/wallet'),
      });
      // Next to Payment methods, because the pair is "how you pay" and "what you paid". Upcoming
      // charges live here too, which is the half a client is most likely to be looking for.
      rows.push({ label: 'Payments', icon: 'document', onPress: go('/account/billing') });
      rows.push({ label: 'Profile', icon: 'account', onPress: go('/account/profile') });
    } else {
      // A guest gets Packages too: the price list is public, and "what would this cost me" is a
      // reasonable question to answer before making an account.
      rows.push({ label: 'Packages', icon: 'packages', onPress: go('/packages') });
      rows.push({ label: 'Sign in', icon: 'account', onPress: go('/sign-in') });
    }

    return rows;
    // `go` closes over `onClose`, which the caller keeps stable; rebuilding these rows per render
    // would be cheap anyway, and the alternative is memoising a function that pushes a route.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, onClose]);

  return (
    <DrawerMenu
      visible={visible}
      onClose={onClose}
      name={account ? [account.firstName, account.lastName].filter(Boolean).join(' ') || null : null}
      studioName={studioName}
      balances={balances}
      items={items}
    />
  );
}

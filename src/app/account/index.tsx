/**
 * The account route.
 *
 * Signed-out clients never see this screen — they are sent to sign in, because every row on it is
 * about a person and there is no such person yet. The redirect keys off the RESOLVED status:
 * `initializing` is Firebase still answering, and treating that as signed-out would bounce a
 * signed-in client off their own account for a frame.
 */
import { Redirect, router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Linking } from 'react-native';

import { studio } from '@/config/studio';
import { formatPhoneForDisplay } from '@/domain/profile/validate';
import { AccountScreen, type AccountBalance, type AccountRow } from '@/features/account/AccountScreen';
import { useWallet } from '@/features/account/useWallet';
import { useAuth } from '@/features/auth/AuthProvider';
import { useAppDrawer } from '@/features/nav/useAppDrawer';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export default function AccountRoute() {
  const { status, account, signOut } = useAuth();
  const { config } = useStudioConfig();
  const wallet = useWallet();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawer = useAppDrawer({ visible: menuOpen, onClose: () => setMenuOpen(false) });

  const studioName = config?.studioName ?? studio.appName;

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  /**
   * Opening a URL can fail — no mail client, a malformed link — and it fails SILENTLY, which reads
   * as a dead row. Say something, and hand over the address so the tap was not wasted.
   */
  const open = useCallback(async (url: string, fallbackMessage: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error('unsupported');
      await Linking.openURL(url);
    } catch {
      Alert.alert('Could not open that', fallbackMessage);
    }
  }, []);

  /** Money first: credit, then each usable pass. Null while the wallet is still resolving. */
  const balances = useMemo<AccountBalance[] | null>(() => {
    const { credit, passes } = wallet.data;
    if (credit.status === 'loading' && passes.status === 'loading') return null;

    const rows: AccountBalance[] = [];
    if (credit.label) rows.push({ key: 'credit', label: 'Credit balance', value: credit.label });
    for (const pass of passes.items) {
      // Keyed by the pass id — two purchases of the same package share a label.
      rows.push({
        key: `pass-${pass.id}`,
        label: pass.name,
        detail: pass.expiresLabel ?? undefined,
        value: pass.remainingLabel,
      });
    }
    return rows;
  }, [wallet.data]);

  if (status === 'guest') return <Redirect href="/sign-in" />;

  // The studio's own configured address wins over the build's copy: a studio that changes where
  // its mail goes should not need a store release for their clients to reach them.
  const contactEmail = config?.customerServiceEmail?.trim() || studio.supportEmail;

  const rows: AccountRow[] = [
    {
      // Above Payment methods on purpose: buying a pack is a thing a client wants to DO, and
      // saved-card administration is a thing they occasionally have to. The balances block above
      // already tells them what they hold; this is the way to get more of it.
      label: 'Packages',
      icon: 'packages',
      detail: 'Class packs and memberships',
      onPress: () => router.push('/packages'),
    },
    {
      label: 'Payment methods',
      icon: 'paymentMethods',
      detail: 'Saved cards',
      onPress: () => router.push('/account/wallet'),
    },
    {
      // Beside Payment methods, the same pairing as the drawer: how you pay, then what you paid.
      // It was drawer-only, and a client on this screen had no path to their payment history at
      // all (Alicia, 2026-08-16) — the account page is where people go looking for money things.
      label: 'Payments',
      icon: 'document',
      detail: 'Charges and upcoming renewals',
      onPress: () => router.push('/account/billing'),
    },
    {
      label: 'Profile',
      icon: 'account',
      detail: 'Your name and mobile number',
      onPress: () => router.push('/account/profile'),
    },
    {
      label: `Contact ${studioName}`,
      icon: 'contact',
      detail: contactEmail,
      onPress: () => void open(`mailto:${contactEmail}`, `Email ${contactEmail} to reach the studio.`),
    },
  ];

  // Only when the studio published one. A phone row that dials nothing is worse than no row.
  const phone = config?.customerServicePhone?.trim();
  if (phone) {
    rows.push({
      label: 'Call the studio',
      icon: 'phone',
      detail: formatPhoneForDisplay(phone),
      onPress: () => void open(`tel:${phone.replace(/\D/g, '')}`, `Call ${formatPhoneForDisplay(phone)}.`),
    });
  }

  // The URL is recorded in every studio config but does not resolve to a policy yet
  // (`legal.privacyPolicyLive`), and a row leading to the widget's shell page is worse than none.
  if (studio.privacyPolicyUrl) {
    rows.push({
      label: 'Privacy policy',
      icon: 'document',
      onPress: () =>
        void open(studio.privacyPolicyUrl!, 'Visit dibsonline.com to read the privacy policy.'),
    });
  }

  return (
    <>
      <AccountScreen
        name={account ? [account.firstName, account.lastName].filter(Boolean).join(' ') || null : null}
        email={account?.email ?? null}
        studioName={studioName}
        balances={balances}
        rows={rows}
        onSignOut={() => {
          void signOut();
          // Home is where a signed-out client belongs: the studio's schedule is public, so signing
          // out lands them on a full screen rather than on a login wall.
          router.replace('/');
        }}
        onBack={onBack}
        onOpenMenu={() => setMenuOpen(true)}
      />
      {drawer}
    </>
  );
}

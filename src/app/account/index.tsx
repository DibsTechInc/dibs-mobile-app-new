/**
 * The account route.
 *
 * Signed-out clients never see this screen — they are sent to sign in, because every row on it
 * is about a person and there is no such person yet. The redirect is on the RESOLVED status, not
 * on the absence of a session: `initializing` is Firebase still answering, and treating that as
 * signed-out bounces a signed-in client off their own account screen for a frame.
 */
import { Redirect, router } from 'expo-router';
import { useCallback } from 'react';
import { Alert, Linking } from 'react-native';

import { studio } from '@/config/studio';
import { AccountScreen, type AccountRow } from '@/features/account/AccountScreen';
import { useAuth } from '@/features/auth/AuthProvider';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

export default function AccountRoute() {
  const { status, account, isResolvingAccount, signOut } = useAuth();
  const { config } = useStudioConfig();
  const studioName = config?.studioName ?? studio.appName;

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  /**
   * Opening a URL can fail — no mail client configured, a malformed link — and it fails silently,
   * which reads as a dead row. Say something instead, and give the address so the tap was not
   * wasted.
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

  if (status === 'guest') return <Redirect href="/sign-in" />;

  const accountRows: AccountRow[] = [
    {
      label: 'Wallet & payment',
      detail: 'Passes, credit and saved cards',
      onPress: () => router.push('/account/wallet'),
    },
  ];

  const supportRows: AccountRow[] = [
    {
      label: `Contact ${studioName}`,
      detail: studio.supportEmail,
      onPress: () =>
        void open(`mailto:${studio.supportEmail}`, `Email ${studio.supportEmail} to reach the studio.`),
    },
  ];

  // Only when there is something to open. The URL is recorded in every studio config but does not
  // resolve to a policy yet (`legal.privacyPolicyLive`), and a row leading to the widget's shell
  // page is worse than no row. Flipping that flag is a release gate.
  if (studio.privacyPolicyUrl) {
    supportRows.push({
      label: 'Privacy policy',
      onPress: () =>
        void open(studio.privacyPolicyUrl!, 'Visit dibsonline.com to read the privacy policy.'),
    });
  }

  return (
    <AccountScreen
      name={account ? [account.firstName, account.lastName].filter(Boolean).join(' ') || null : null}
      email={account?.email ?? null}
      studioName={studioName}
      accountRows={accountRows}
      supportRows={supportRows}
      isResolving={isResolvingAccount}
      onSignOut={() => {
        void signOut();
        // Home is where a signed-out client belongs: the studio's schedule is public, so signing
        // out lands them on a full screen rather than on a login wall.
        router.replace('/');
      }}
      onBack={onBack}
    />
  );
}

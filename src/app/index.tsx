/**
 * Home — the app's landing route.
 *
 * The studio's photograph and three ways in. It needs almost nothing from the network: the build
 * already knows the studio's name and ships its hero, so a first launch with no connection is
 * still recognisably their app rather than a spinner.
 *
 * The greeting is the only thing a session changes.
 */
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { studio } from '@/config/studio';
import { buildGreeting } from '@/domain/home/build-home-data';
import { useAuth } from '@/features/auth/AuthProvider';
import { HomeScreen, type HomeChoice } from '@/features/home/HomeScreen';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { useAppDrawer } from '@/features/nav/useAppDrawer';

export default function HomeRoute() {
  const { config, error: configError, refetch: refetchConfig, timeZone } = useStudioConfig();
  const { status, account } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawer = useAppDrawer({ visible: menuOpen, onClose: () => setMenuOpen(false) });

  const studioName = config?.studioName ?? studio.appName;
  const isSignedIn = status === 'signedIn';

  const greeting = useMemo(
    () => buildGreeting({ firstName: account?.firstName ?? null, studioName, timeZone }),
    [account?.firstName, studioName, timeZone],
  );

  const choices = useMemo<[HomeChoice, HomeChoice, HomeChoice]>(
    () => [
      { label: 'Book', icon: 'book', onPress: () => router.push('/schedule') },
      {
        label: 'My Calendar',
        icon: 'myCalendar',
        // Signed out there is no calendar to show, so the tap goes where it can become one
        // rather than to an empty screen that explains itself.
        onPress: () => router.push(isSignedIn ? '/account' : '/sign-in'),
      },
      isSignedIn
        ? { label: 'Account', icon: 'account', onPress: () => router.push('/account') }
        : { label: 'Sign In', icon: 'account', onPress: () => router.push('/sign-in') },
    ],
    [isSignedIn],
  );

  const onRetry = useCallback(() => refetchConfig(), [refetchConfig]);

  return (
    <>
      <HomeScreen
        greeting={greeting.title}
        subtitle={greeting.subtitle}
        choices={choices}
        onOpenMenu={() => setMenuOpen(true)}
        remoteHeroUri={config?.heroUrl ?? null}
        // Only reported when there is no photograph at all — which is the one state this screen
        // cannot render, since every element on it exists to sit on an image.
        error={configError}
        onRetry={onRetry}
      />
      {drawer}
    </>
  );
}

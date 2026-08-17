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
import { useCartCount } from '@/features/cart/cartStore';
import { HomeScreen, type HomeChoice } from '@/features/home/HomeScreen';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { useAppDrawer } from '@/features/nav/useAppDrawer';

export default function HomeRoute() {
  const { config, error: configError, refetch: refetchConfig } = useStudioConfig();
  const { status, account } = useAuth();
  const cartCount = useCartCount();
  const [menuOpen, setMenuOpen] = useState(false);
  const drawer = useAppDrawer({ visible: menuOpen, onClose: () => setMenuOpen(false) });

  const studioName = config?.studioName ?? studio.appName;
  const isSignedIn = status === 'signedIn';

  const greeting = useMemo(
    () => buildGreeting({ firstName: account?.firstName ?? null, studioName }),
    [account?.firstName, studioName],
  );

  const choices = useMemo<[HomeChoice, HomeChoice, HomeChoice]>(
    () => [
      { label: 'Book', icon: 'book', onPress: () => router.push('/schedule') },
      {
        label: 'My Calendar',
        icon: 'myCalendar',
        // Signed out there is no calendar to show, so the tap goes where it can become one
        // rather than to an empty screen that explains itself.
        onPress: () => router.push(isSignedIn ? '/my-calendar' : '/sign-in'),
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
        /*
         * Only when there is something in it.
         *
         * Home is the one screen with no cart bar — it is a photograph, and a bar across the foot
         * of it would be the wrong thing entirely. But a client can reach Home with a live cart
         * (they backed out of the schedule, or they just signed in), and a cart with no way to it
         * is a cart nobody finishes. The icon is that way, and it disappears again the moment the
         * cart empties rather than sitting there permanently as chrome.
         */
        onOpenCart={cartCount > 0 ? () => router.push('/checkout') : undefined}
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

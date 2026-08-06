import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query-client';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { installAuthBridge } from '@/features/auth/bridge';
import { StudioConfigProvider } from '@/features/studio/StudioConfigProvider';

// Module scope, not an effect. Effects run child-first, so by the time a provider's effect ran,
// its children's queries would already have asked for a token and gone out without one.
installAuthBridge();

/**
 * Hold the splash until the first real frame is drawable; ThemeProvider releases it once the
 * fonts resolve.
 *
 * Without this the splash lifts as soon as JS starts, exposing a blank frame while the fonts
 * load — which would put a white flash in the middle of the very handoff the matching splash
 * image exists to hide.
 *
 * No fade. The splash and Home's first frame are the same photograph at the same crop, so a hard
 * cut is genuinely invisible; a cross-fade would make a seam where there wasn't one by dipping
 * the image's opacity against itself.
 */
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: false });

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {/* StudioConfigProvider owns the theme: it fetches the studio's live branding and hands
            it to ThemeProvider as overrides, so a studio can change their colour or hero photo
            without a store release. It renders its children immediately either way — the build
            already ships the studio's seed accent. */}
        <StudioConfigProvider>
          <AuthProvider>
            <Stack screenOptions={{ headerShown: false }} />
            {/* Light content throughout: v1 has no dark mode, and the background is always light. */}
            <StatusBar style="dark" />
          </AuthProvider>
        </StudioConfigProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

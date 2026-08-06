import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query-client';
import { StudioConfigProvider } from '@/features/studio/StudioConfigProvider';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {/* StudioConfigProvider owns the theme: it fetches the studio's live branding and hands
            it to ThemeProvider as overrides, so a studio can change their colour or hero photo
            without a store release. It renders its children immediately either way — the build
            already ships the studio's seed accent. */}
        <StudioConfigProvider>
          <Stack screenOptions={{ headerShown: false }} />
          {/* Light content throughout: v1 has no dark mode, and the background is always light. */}
          <StatusBar style="dark" />
        </StudioConfigProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

import '../global.css';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query-client';
import { ThemeProvider } from '@/theme/ThemeProvider';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }} />
          {/* Light content throughout: v1 has no dark mode, and the background is always light. */}
          <StatusBar style="dark" />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

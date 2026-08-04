/**
 * Makes the merged theme available to the tree, and loads the two bundled font families.
 *
 * The studio's personality comes from the white-label build config (`src/config/studio.ts`);
 * the live hero and logo URLs arrive later from `get-basic-config` and can be layered on via
 * the `overrides` prop without rebuilding the app.
 */
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Fraunces_400Regular, Fraunces_500Medium } from '@expo-google-fonts/fraunces';
import { useFonts } from 'expo-font';
import { createContext, use, useMemo, type ReactNode } from 'react';

import { studio as buildStudio } from '@/config/studio';

import { createTheme, type StudioPersonality, type Theme } from './theme';

const ThemeContext = createContext<Theme | null>(null);

export interface ThemeProviderProps {
  children: ReactNode;
  /**
   * Live values that win over the build config — the hero and logo URLs from get-basic-config,
   * and the studio's accent if it changed since the app shipped. This is what lets a studio
   * update their branding without a store release.
   */
  overrides?: Partial<StudioPersonality>;
  /** Rendered while the fonts load. Typography IS the identity — never flash a fallback face. */
  fallback?: ReactNode;
}

export function ThemeProvider({ children, overrides, fallback = null }: ThemeProviderProps) {
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  const theme = useMemo(
    () =>
      createTheme({
        accentColor: overrides?.accentColor ?? buildStudio.accentColor,
        appName: overrides?.appName ?? buildStudio.appName,
        heroUri: overrides?.heroUri ?? null,
        logoUri: overrides?.logoUri ?? null,
        showInstructor: overrides?.showInstructor ?? buildStudio.display.showInstructor,
      }),
    [overrides],
  );

  // A font that fails to load is not a reason to show nothing forever — the system face is
  // wrong but legible, and a blank screen is not. Only an unresolved load blocks.
  if (!fontsLoaded && !fontError) return <>{fallback}</>;

  return <ThemeContext value={theme}>{children}</ThemeContext>;
}

export function useTheme(): Theme {
  const theme = use(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside a <ThemeProvider>.');
  }
  return theme;
}

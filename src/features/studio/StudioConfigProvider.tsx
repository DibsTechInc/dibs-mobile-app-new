/**
 * Fetches the studio's live config once, provides it to the tree, and feeds the parts of it that
 * are branding into the theme.
 *
 * This is what lets a studio change their hero photograph or their brand colour without a store
 * release: the build ships a seed accent so the very first frame is already theirs, and this
 * replaces it with whatever `get-basic-config` says the moment the response lands.
 *
 * It deliberately does NOT block rendering. A studio whose API is unreachable still gets a
 * themed, branded app running on the build's own config — a spinner in front of the whole
 * product because one request is slow is a worse failure than slightly stale branding.
 */
import { useQuery } from '@tanstack/react-query';
import { createContext, use, useMemo, type ReactNode } from 'react';

import { apiClient, fetchBasicConfig, queryKeys } from '@/api';
import type { BasicConfig } from '@/api/schemas/basic-config';
import { normalizeAccentHex } from '@/api/schemas/basic-config';
import { studio } from '@/config/studio';
import { ThemeProvider } from '@/theme/ThemeProvider';

export interface StudioConfigState {
  config: BasicConfig | null;
  isLoading: boolean;
  error: unknown;
  refetch: () => void;
  /**
   * The timezone every time comparison in the app runs in.
   *
   * The live value wins, because a studio that moves is a real thing and the build's copy is
   * only a seed. Never read `studio.timezone` directly in a screen — read this.
   */
  timeZone: string;
}

const StudioConfigContext = createContext<StudioConfigState | null>(null);

export function StudioConfigProvider({ children }: { children: ReactNode }) {
  // Destructured, not held as `query`: the query object is a fresh identity on every render, so
  // a memo depending on it would hand a new context value to the whole tree each time.
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.config(studio.dibsStudioId),
    queryFn: ({ signal }) => fetchBasicConfig(apiClient, studio.dibsStudioId, signal),
    // Branding and cancel windows change on a human timescale, not a request one.
    staleTime: 15 * 60 * 1000,
  });

  const config = data ?? null;

  const state = useMemo<StudioConfigState>(
    () => ({
      config,
      isLoading,
      error,
      refetch: () => void refetch(),
      timeZone: config?.timezone ?? studio.timezone,
    }),
    [config, isLoading, error, refetch],
  );

  const overrides = useMemo(
    () => ({
      // The API sends the hex WITHOUT a '#'; normalize, and fall back to the build's own accent
      // if it is unparseable rather than letting a bad string reach the colour maths.
      accentColor: normalizeAccentHex(config?.color, studio.accentColor),
      heroUri: config?.heroUrl ?? null,
      logoUri: config?.colorLogo ?? null,
    }),
    [config],
  );

  return (
    <StudioConfigContext value={state}>
      <ThemeProvider overrides={overrides}>{children}</ThemeProvider>
    </StudioConfigContext>
  );
}

export function useStudioConfig(): StudioConfigState {
  const state = use(StudioConfigContext);
  if (!state) {
    throw new Error('useStudioConfig must be used inside a <StudioConfigProvider>.');
  }
  return state;
}

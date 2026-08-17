/**
 * Resolves the version gate for this build, once, at startup.
 *
 * The query is fire-and-forget by design: `fetchAppRelease` never rejects, so there is no error
 * state to render and nothing here can throw into the tree.
 */
import { useQuery } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { useEffect, useState } from 'react';

import { apiClient, fetchAppRelease } from '@/api';
import { studio } from '@/config/studio';
import { decideReleaseGate, type GatePlatform, type ReleaseGate, type SoftPromptRecord } from '@/domain/app-release/gate';

import { readSoftPrompt } from './softPromptStore';

const NO_GATE: ReleaseGate = { kind: 'none' };

/**
 * Anything that is not iOS or Android — web, or a platform this app has no store listing on —
 * has no store to send anybody to, so it is never gated.
 */
function currentPlatform(): GatePlatform | null {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return null;
}

export function useReleaseGate(): ReleaseGate {
  const platform = currentPlatform();

  // Read once at mount. Held in state rather than read inside the decision so the gate does not
  // depend on an async read completing — `undefined` while loading is treated as "never
  // prompted", which at worst shows the soft sheet a moment early.
  const [softPrompt, setSoftPrompt] = useState<SoftPromptRecord | null>(null);
  useEffect(() => {
    let cancelled = false;
    void readSoftPrompt().then((record) => {
      if (!cancelled) setSoftPrompt(record);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const { data } = useQuery({
    queryKey: ['appRelease', studio.slug],
    queryFn: ({ signal }) => fetchAppRelease(apiClient, studio.slug, signal),
    // A release is not news that changes minute to minute, and the endpoint is edge-cached for
    // five minutes anyway.
    staleTime: 30 * 60 * 1000,
    // `fetchAppRelease` resolves null instead of throwing, so a retry would only re-ask a
    // question we already have a safe answer to.
    retry: false,
    enabled: platform !== null,
  });

  if (!platform) return NO_GATE;

  return decideReleaseGate({
    body: data ?? null,
    platform,
    runningBuild: studio.buildNumber,
    now: Date.now(),
    lastSoftPrompt: softPrompt,
  });
}

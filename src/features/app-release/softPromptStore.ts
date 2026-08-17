/**
 * Remembers when the "should update" sheet was last shown, so it is not shown again for a week.
 *
 * AsyncStorage rather than SecureStore: this is a timestamp and a build number, not a credential,
 * and losing it costs one extra prompt.
 *
 * Every function here swallows its own errors. A storage failure must not stop the gate deciding
 * — the worst case is prompting again, which is what would have happened anyway.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SoftPromptRecord } from '@/domain/app-release/gate';

const STORAGE_KEY = 'dibs.appRelease.softPrompt';

export async function readSoftPrompt(): Promise<SoftPromptRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    // Returned unvalidated on purpose: `isSoftPromptSuppressed` is the one place that decides
    // what a usable record looks like, and it treats anything malformed as "never prompted".
    return parsed as SoftPromptRecord;
  } catch {
    return null;
  }
}

export async function writeSoftPrompt(latestBuild: number, shownAt: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ latestBuild, shownAt }));
  } catch {
    // Nothing to do. The prompt reappears next launch, which is a nuisance, not a failure.
  }
}

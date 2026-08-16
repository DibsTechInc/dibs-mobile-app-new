/**
 * The version gate, rendered above the navigation tree.
 *
 * ── It OVERLAYS; it never blocks rendering ──────────────────────────────────────────────────
 * Children render immediately and the blocking screen covers them once the answer lands, rather
 * than the tree waiting on a request. Two reasons, and the second is the real one:
 *
 *  1. Waiting would put a spinner — or, given that ThemeProvider releases the splash on fonts
 *     rather than on this, a white screen — in front of every client on every launch, to protect
 *     against something that happens once or twice in an app's life.
 *  2. A gate that can hold the tree open is a gate that can hold it open forever. `fetchAppRelease`
 *     already cannot reject and already has its own timeout, but "the UI cannot be held hostage by
 *     this request" is a property worth having structurally rather than by inspection.
 *
 * In practice the answer arrives during the launch sequence, so the required screen is what the
 * client sees. The residual case — an answer arriving seconds later, over a screen the client is
 * already using — is accepted: a required update is rare, deliberate, and days behind its release.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Sheet } from '@/components/Sheet';
import { Text } from '@/components/Text';
import { studio } from '@/config/studio';
import { useTheme } from '@/theme/ThemeProvider';

import { useReleaseGate } from './useReleaseGate';
import { writeSoftPrompt } from './softPromptStore';

const DEFAULT_REQUIRED_MESSAGE =
  'This version of the app is out of date and can no longer book classes. Update to carry on.';
const DEFAULT_RECOMMENDED_MESSAGE = 'A newer version of the app is available.';

/**
 * Opening a URL fails silently, and on the blocking screen a dead button is the whole trap: the
 * client cannot use the app and cannot leave the screen either. Say so, and give them the
 * support address in the same breath.
 */
function useOpenStore(storeUrl: string | null) {
  return useCallback(async () => {
    if (!storeUrl) {
      Alert.alert(
        'No store link',
        `Search for ${studio.appName} in the App Store, or email ${studio.supportEmail}.`,
      );
      return;
    }
    try {
      const supported = await Linking.canOpenURL(storeUrl);
      if (!supported) throw new Error('unsupported');
      await Linking.openURL(storeUrl);
    } catch {
      Alert.alert(
        'Could not open the store',
        `Search for ${studio.appName} in the App Store, or email ${studio.supportEmail}.`,
      );
    }
  }, [storeUrl]);
}

function ContactLine() {
  const theme = useTheme();
  const onEmail = useCallback(() => {
    void Linking.openURL(`mailto:${studio.supportEmail}`).catch(() => {
      Alert.alert('Could not open mail', `Email ${studio.supportEmail}.`);
    });
  }, []);

  return (
    <View style={{ marginTop: theme.spacing.lg, alignItems: 'center' }}>
      <Text variant="secondary" color="secondary" style={{ textAlign: 'center' }}>
        Stuck? {studio.shortName} can help.
      </Text>
      <Button label={studio.supportEmail} variant="ghost" fullWidth={false} onPress={onEmail} />
    </View>
  );
}

/**
 * Full-screen, non-dismissible, no back gesture, rendered OVER the router.
 *
 * Two actions, not one: the store link, and a human. A client whose update path is broken — no
 * store app, a region mismatch, an account they cannot sign into — has nowhere else to go, and
 * one action is not enough when the action can fail.
 */
function RequiredScreen({ storeUrl, message }: { storeUrl: string | null; message: string | null }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const openStore = useOpenStore(storeUrl);

  return (
    <View
      testID="release-gate-required"
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + theme.spacing.xl,
          paddingBottom: insets.bottom + theme.spacing.xl,
          paddingHorizontal: theme.spacing.lg,
          justifyContent: 'center',
        },
      ]}
    >
      <Text variant="display" style={{ textAlign: 'center' }}>
        Time to update
      </Text>
      <Text
        variant="body"
        color="secondary"
        style={{ textAlign: 'center', marginTop: theme.spacing.md }}
      >
        {message ?? DEFAULT_REQUIRED_MESSAGE}
      </Text>
      <View style={{ marginTop: theme.spacing.xl }}>
        <Button label="Update the app" onPress={openStore} />
      </View>
      <ContactLine />
    </View>
  );
}

function RecommendedSheet({
  latestBuild,
  storeUrl,
  message,
}: {
  latestBuild: number;
  storeUrl: string | null;
  message: string | null;
}) {
  const theme = useTheme();
  const [visible, setVisible] = useState(true);
  const openStore = useOpenStore(storeUrl);

  /**
   * The window starts when the sheet is SHOWN, not when it is dismissed.
   *
   * Recording it on dismissal would mean a client who force-quits instead of tapping sees the
   * sheet again on the next launch, forever — the spam the interval exists to prevent, arrived at
   * by the client doing nothing wrong.
   */
  useEffect(() => {
    void writeSoftPrompt(latestBuild, Date.now());
  }, [latestBuild]);

  const dismiss = useCallback(() => setVisible(false), []);

  return (
    <Sheet visible={visible} onClose={dismiss} title="Update available" testID="release-gate-recommended">
      <Text variant="body" color="secondary">
        {message ?? DEFAULT_RECOMMENDED_MESSAGE}
      </Text>
      <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.sm }}>
        <Button label="Update now" onPress={openStore} />
        <Button label="Not now" variant="secondary" onPress={dismiss} />
      </View>
    </Sheet>
  );
}

export function AppReleaseGate({ children }: { children: ReactNode }) {
  const gate = useReleaseGate();

  return (
    <>
      {children}
      {gate.kind === 'recommended' ? (
        <RecommendedSheet
          latestBuild={gate.latestBuild}
          storeUrl={gate.storeUrl}
          message={gate.message}
        />
      ) : null}
      {/* Last, so it paints over everything including the sheet. The two are mutually exclusive
          by construction, but a required update must win any ordering argument. */}
      {gate.kind === 'required' ? (
        <RequiredScreen storeUrl={gate.storeUrl} message={gate.message} />
      ) : null}
    </>
  );
}

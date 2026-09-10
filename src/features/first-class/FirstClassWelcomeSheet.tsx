/**
 * The one-time "Your first class is $15" sheet after sign-up (2026-09-10).
 *
 * ── Never before the fetch resolves; nothing on a failed fetch ────────────────────────────────
 * Visible only while `pendingSignUp` is set AND `useFirstClassOffer` has resolved ELIGIBLE —
 * derived, not stored, so there is no state to get ahead of the fetch. A resolved "no" consumes
 * the flag silently; a FAILED read leaves it and shows nothing, so a later successful read may
 * still greet them. A greeting naming a price the server has not confirmed is a promise the
 * checkout would then refuse.
 */
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Sheet, Text } from '@/components';
import { formatPrice } from '@/domain/money/format';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { useFirstClassWelcomeStore } from './firstClassWelcomeStore';
import { useFirstClassOffer } from './useFirstClassOffer';

export function FirstClassWelcomeSheet() {
  const theme = useTheme();
  const { config } = useStudioConfig();
  const pending = useFirstClassWelcomeStore((state) => state.pendingSignUp);
  const consume = useFirstClassWelcomeStore((state) => state.consume);
  const { eligibility, isEligible, priceCents, isResolving } = useFirstClassOffer();
  // Set ONLY from the client's own tap. Everything else about visibility is derived.
  const [dismissed, setDismissed] = useState(false);

  const resolved = !isResolving && eligibility !== undefined;
  const visible = pending && resolved && isEligible && Boolean(priceCents) && !dismissed;

  useEffect(() => {
    // Resolved and NOT eligible: nothing to say, and the flag must not fire on a later screen.
    // (Store write, not React state — the flag lives outside this component on purpose.)
    if (pending && resolved && !isEligible) consume();
  }, [pending, resolved, isEligible, consume]);

  const close = () => {
    setDismissed(true);
    consume();
  };

  const priceLabel = priceCents ? formatPrice(priceCents / 100, config?.currency) : '';
  const studioName = config?.studioName ?? 'the studio';

  return (
    <Sheet visible={visible} onClose={close} title={`Your first class is ${priceLabel}`}>
      <View style={{ gap: theme.spacing.base }}>
        <Text variant="secondary" color="secondary">
          As a new client at {studioName}, your first group class is {priceLabel}. It’s applied
          automatically when you book — one class, ever.
        </Text>
        <Button
          label="See the schedule"
          onPress={() => {
            close();
            router.push('/schedule');
          }}
        />
        <Button label="Not now" variant="ghost" onPress={close} />
      </View>
    </Sheet>
  );
}

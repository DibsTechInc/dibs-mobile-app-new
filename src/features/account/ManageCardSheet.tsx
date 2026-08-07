/**
 * What a client can do with one saved card. Opened from the wallet's "Manage".
 *
 * A sheet rather than a route, per the platform's "it just works" rule: the decision resolves on
 * the screen that raised it. Two actions, both spelled out in words — a card row with a bare "···"
 * is a quiz, and this is money.
 *
 * ── Removal is confirmed IN PLACE, never with a system alert ────────────────────────────────
 * A `confirm()`-style dialog on top of a sheet is two modals deep and reads as an error. The sheet
 * swaps to a confirmation state instead, which also lets the copy be specific — naming the card,
 * and saying plainly what removing it does and does not affect.
 */
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Sheet, StatusTag, Text } from '@/components';
import type { SavedCard } from '@/domain/payments/cards';
import { useTheme } from '@/theme/ThemeProvider';

export interface ManageCardSheetProps {
  card: SavedCard | null;
  studioName: string;
  isWorking: boolean;
  error: string | null;
  onClose: () => void;
  onMakeDefault: (card: SavedCard) => void;
  onRemove: (card: SavedCard) => void;
}

export function ManageCardSheet({
  card,
  studioName,
  isWorking,
  error,
  onClose,
  onMakeDefault,
  onRemove,
}: ManageCardSheetProps) {
  const theme = useTheme();
  const [confirmingRemoval, setConfirmingRemoval] = useState(false);

  const close = () => {
    setConfirmingRemoval(false);
    onClose();
  };

  if (!card) return <Sheet visible={false} onClose={close} />;

  return (
    <Sheet
      visible
      onClose={close}
      title={card.label}
      // A half-finished removal should not evaporate because a finger landed outside the sheet.
      dismissOnBackdropPress={!confirmingRemoval && !isWorking}
    >
      <View style={{ gap: theme.spacing.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Text variant="secondary" color="secondary">
            {card.expiryLabel}
          </Text>
          {card.isDefault ? <StatusTag label="Default" tone="accent" /> : null}
        </View>

        {error ? (
          <Text variant="secondary" color="danger">
            {error}
          </Text>
        ) : null}

        {confirmingRemoval ? (
          <View style={{ gap: theme.spacing.md }}>
            <Text variant="heading">Remove this card?</Text>
            <Text variant="secondary" color="secondary">
              {card.label} will be removed from your {studioName} account. Classes you have already
              booked are unaffected — this only removes the card from future payments.
            </Text>
            <View style={{ gap: theme.spacing.sm }}>
              <Button
                label="Remove card"
                variant="destructive"
                loading={isWorking}
                onPress={() => onRemove(card)}
              />
              <Button
                label="Keep it"
                variant="ghost"
                disabled={isWorking}
                onPress={() => setConfirmingRemoval(false)}
              />
            </View>
          </View>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {/* Only offered when it would change something. "Make default" on the card that
                already is one is a button that does nothing. */}
            {card.isDefault ? (
              <Text variant="secondary" color="secondary">
                This is the card {studioName} will charge.
              </Text>
            ) : (
              <Button
                label="Use this card by default"
                variant="secondary"
                loading={isWorking}
                onPress={() => onMakeDefault(card)}
              />
            )}
            <Button
              label="Remove card"
              variant="ghost"
              disabled={isWorking}
              onPress={() => setConfirmingRemoval(true)}
            />
          </View>
        )}
      </View>
    </Sheet>
  );
}

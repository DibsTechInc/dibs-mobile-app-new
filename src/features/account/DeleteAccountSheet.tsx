/**
 * Deleting your account — the one action in the app that cannot be undone.
 *
 * ── Why a TYPED confirmation ───────────────────────────────────────────────────────────────────
 * Every other destructive act here (cancelling a class, a membership) is recoverable by booking
 * or enrolling again. This one is not, so a tap is not enough consent: the client types DELETE,
 * which cannot happen by pocket, by mis-tap, or by a toddler. The button stays disabled until
 * the word matches.
 *
 * ── The blocked state is a doorway, not a wall ────────────────────────────────────────────────
 * The server refuses while a membership or recurring booking is still billing, and that refusal
 * arrives with its own sentence. The sheet shows THAT sentence and offers the route to the thing
 * that must be cancelled first — a refusal with no way forward is the dead-end shape this
 * codebase keeps refusing to ship.
 */
import { useState } from 'react';
import { View } from 'react-native';

import { Button, Input, Sheet, Text } from '@/components';
import type { DeleteAccountStatus } from '@/features/account/useDeleteAccount';
import { useTheme } from '@/theme/ThemeProvider';

/** Case-insensitive on purpose: "delete" typed on a phone keyboard is the same intent. */
const CONFIRM_WORD = 'DELETE';

export interface DeleteAccountSheetProps {
  visible: boolean;
  studioName: string;
  status: DeleteAccountStatus;
  onConfirm: () => void;
  onClose: () => void;
  /** The way forward from a `blocked` refusal — where memberships are cancelled. */
  onGoToPasses: () => void;
}

export function DeleteAccountSheet({
  visible,
  studioName,
  status,
  onConfirm,
  onClose,
  onGoToPasses,
}: DeleteAccountSheetProps) {
  const theme = useTheme();
  const [typed, setTyped] = useState('');

  const working = status.kind === 'working';
  const confirmed = typed.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Delete your account?"
      // Mid-request a backdrop tap has no honest meaning — the deletion may already be done.
      dismissOnBackdropPress={!working}
    >
      <View style={{ gap: theme.spacing.md }}>
        {status.kind === 'blocked' ? (
          <>
            {/* The server's own sentence — it names what is still billing. */}
            <Text variant="body">{status.message}</Text>
            <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
              <Button label="See my passes" onPress={onGoToPasses} />
              <Button label="Keep my account" variant="secondary" onPress={onClose} />
            </View>
          </>
        ) : (
          <>
            <Text variant="body">
              This permanently removes your sign-in and erases your personal details. It cannot
              be undone.
            </Text>
            <Text variant="secondary" color="secondary">
              Records of past purchases stay with {studioName}, as required for their financial
              records. Any upcoming classes you no longer plan to attend should be cancelled
              first.
            </Text>

            <Input
              label={`Type ${CONFIRM_WORD} to confirm`}
              value={typed}
              onChangeText={setTyped}
              autoCapitalize="characters"
              autoCorrect={false}
              editable={!working}
            />

            {status.kind === 'error' ? (
              <Text variant="body" color="danger">
                {status.message}
              </Text>
            ) : null}

            <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
              <Button
                label={working ? 'Deleting…' : 'Delete my account'}
                variant="destructive"
                onPress={onConfirm}
                disabled={!confirmed || working}
              />
              <Button label="Keep my account" variant="secondary" onPress={onClose} disabled={working} />
            </View>
          </>
        )}
      </View>
    </Sheet>
  );
}

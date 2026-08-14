/**
 * Confirming a membership cancellation.
 *
 * Cancels at PERIOD END, so the sheet says so before the tap — a client who believes they lost
 * access immediately calls the studio, which is the call this app exists to prevent.
 */
import { View } from 'react-native';

import { Button, Sheet, Text } from '@/components';
import { formatIsoDate } from '@/domain/time/studio-now';
import type { WalletPass } from '@/domain/wallet/build-wallet';
import type { CancelMembershipStatus } from '@/features/account/useCancelMembership';
import { useTheme } from '@/theme/ThemeProvider';

export interface CancelMembershipSheetProps {
  pass: WalletPass | null;
  status: CancelMembershipStatus;
  /** Where access runs to — the pass's own expiry, which is the end of the paid period. */
  accessUntilLabel?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function CancelMembershipSheet({
  pass,
  status,
  accessUntilLabel,
  onConfirm,
  onClose,
}: CancelMembershipSheetProps) {
  const theme = useTheme();
  if (!pass) return null;

  const working = status.kind === 'working';
  const done = status.kind === 'done';
  const refused = status.kind === 'refused' ? status : null;

  const title = done
    ? 'Membership cancelled'
    : refused
      ? 'Not yet — there is a minimum commitment'
      : 'Cancel this membership?';

  return (
    <Sheet visible onClose={onClose} title={title} dismissOnBackdropPress={!working}>
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="heading">{pass.name}</Text>

        {done ? (
          <Text variant="body">
            {accessUntilLabel
              ? `Your membership will not renew. You keep access until ${accessUntilLabel}.`
              : 'Your membership will not renew. You keep access until the end of the period you have already paid for.'}
          </Text>
        ) : refused ? (
          /*
           * Unreachable in practice — the button is hidden when the server says the commitment is
           * unserved. If it fires, the app and the server disagreed, and the client is owed the
           * server's answer legibly rather than a toast. Hence the date and the way forward.
           */
          <>
            <Text variant="body">
              {formatIsoDate(refused.eligibleOn)
                ? `You can cancel this membership from ${formatIsoDate(refused.eligibleOn)}.`
                : 'This membership is still inside its minimum commitment period.'}
            </Text>
            <Text variant="secondary" color="secondary">
              Contact the studio if you need to change it sooner.
            </Text>
          </>
        ) : (
          <>
            {/* The consequence, stated before the tap. Naming the date is the whole point. */}
            <Text variant="body">
              {accessUntilLabel
                ? `Your membership will stop renewing. You keep access until ${accessUntilLabel}.`
                : 'Your membership will stop renewing. You keep access until the end of the period you have already paid for.'}
            </Text>
            {status.kind === 'error' ? (
              <Text variant="body" color="danger">
                {status.message}
              </Text>
            ) : null}
          </>
        )}

        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
          {done || refused ? (
            <Button label="Done" onPress={onClose} />
          ) : (
            <>
              <Button
                label={working ? 'Cancelling…' : 'Cancel membership'}
                onPress={onConfirm}
                disabled={working}
              />
              {/* "Keep it" rather than "Cancel" — a Cancel button on a cancel confirmation is
                  exactly the ambiguity the foolproof-by-default rule exists to prevent. */}
              <Button
                label="Keep my membership"
                variant="secondary"
                onPress={onClose}
                disabled={working}
              />
            </>
          )}
        </View>
      </View>
    </Sheet>
  );
}

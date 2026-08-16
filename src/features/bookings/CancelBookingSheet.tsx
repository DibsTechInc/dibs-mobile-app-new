/**
 * Confirming a cancel, and reporting what it actually cost.
 *
 * Two states in one sheet: the question, then the server's answer. The answer is rendered from
 * `returned`, not from the prediction the question was based on — a boundary crossed between the
 * two makes the prediction wrong, and the wallet will side with the server.
 */
import { View } from 'react-native';

import { Button, Sheet, Text } from '@/components';
import type { CancelWindow } from '@/domain/cancellation/cancel-window';
import { cancelWindowSentence } from '@/domain/cancellation/cancel-window';
import { describeDropOutcome } from '@/domain/cancellation/drop-outcome';
import type { BookingListItem } from '@/domain/bookings/group-bookings';
import type { DropStatus } from '@/features/bookings/useDropClass';
import { useTheme } from '@/theme/ThemeProvider';

export interface CancelBookingSheetProps {
  booking: BookingListItem | null;
  /** The studio's policy for this class, or null when it publishes none. */
  window: CancelWindow | null;
  status: DropStatus;
  currency?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function CancelBookingSheet({
  booking,
  window,
  status,
  currency = 'USD',
  onConfirm,
  onClose,
}: CancelBookingSheetProps) {
  const theme = useTheme();
  if (!booking) return null;

  const done = status.kind === 'done' ? status.result : null;
  const working = status.kind === 'working';

  const outcome = done
    ? describeDropOutcome(done.returned, done.creditAmountCents, done.wasEarly, currency)
    : null;

  return (
    <Sheet
      visible
      onClose={onClose}
      title={outcome ? outcome.title : 'Cancel this booking?'}
      // While the request is in flight there is no safe answer to give a backdrop tap: the drop
      // may already have happened. Closing would leave the client unsure whether it did.
      dismissOnBackdropPress={!working}
    >
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="heading">{booking.name}</Text>
        <Text variant="secondary" color="secondary">
          {booking.whenLabel} · {booking.timeLabel}
        </Text>

        {outcome ? (
          <Text variant="body">{outcome.body}</Text>
        ) : (
          <>
            {/* The consequence, in the studio's terms, BEFORE the tap. Silent when the studio
                publishes no window — inventing a policy on their behalf is worse than saying
                nothing. */}
            {cancelWindowSentence(window) ? (
              <Text variant="body" color={window?.isStillFree ? 'secondary' : 'primary'}>
                {cancelWindowSentence(window)}
              </Text>
            ) : null}
            {status.kind === 'error' ? (
              <Text variant="body" color="danger">
                {status.message}
              </Text>
            ) : null}
          </>
        )}

        <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.xs }}>
          {outcome ? (
            <Button label="Done" onPress={onClose} />
          ) : (
            <>
              <Button
                label={working ? 'Cancelling…' : 'Cancel booking'}
                onPress={onConfirm}
                disabled={working}
              />
              {/* "Keep it" rather than "Cancel": a Cancel button on a cancel confirmation is the
                  ambiguity this rule exists to prevent. */}
              <Button label="Keep my spot" variant="secondary" onPress={onClose} disabled={working} />
            </>
          )}
        </View>
      </View>
    </Sheet>
  );
}

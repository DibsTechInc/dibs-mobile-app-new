/**
 * Booked — the celebratory beat, then the facts.
 *
 * Renders from the `useLastBooking` snapshot written in the same breath the booking succeeded.
 * Arriving here without one (a deep link, a stale resume) redirects Home rather than showing an
 * empty celebration for nothing.
 */
import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components';
import { formatPrice } from '@/domain/money/format';
import { formatStoredTime } from '@/domain/time/studio-now';
import { useTheme } from '@/theme/ThemeProvider';

import { useAppointmentDraft } from './appointmentDraft';
import { useLastBooking } from './useBookAppointment';

export function BookedScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const snapshot = useLastBooking((state) => state.snapshot);
  const clearDraft = useAppointmentDraft((state) => state.clear);
  const clearSnapshot = useLastBooking((state) => state.clear);

  // Arrival is what finishes the flow: the draft clears HERE, not at booking time, because the
  // checkout route redirects the moment its slot disappears and would race the navigation.
  useEffect(() => {
    if (snapshot) clearDraft();
    else router.replace('/');
  }, [snapshot, clearDraft]);

  // The snapshot dies with the screen — a later deep link must not celebrate an old booking.
  useEffect(() => () => clearSnapshot(), [clearSnapshot]);

  if (!snapshot) return null;

  const dayLabel = formatStoredTime(snapshot.startIso, { weekday: 'long' });
  const timeLabel = formatStoredTime(snapshot.startIso);
  const dateLine = `${formatStoredTime(snapshot.startIso, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} · ${timeLabel}`;

  const lead = snapshot.providerName
    ? `${snapshot.providerName.split(' ')[0]} has you ${dayLabel} at ${timeLabel}.`
    : `You're booked for ${dayLabel} at ${timeLabel}.`;

  const paidLine =
    snapshot.paidWith === 'pass'
      ? 'Covered by your pass.'
      : snapshot.paidWith === 'credit'
        ? 'Paid with studio credit.'
        : snapshot.paidTotal > 0
          ? `Paid ${formatPrice(snapshot.paidTotal)} by card.`
          : null;

  const extraSessions = snapshot.sessionIsos.length - 1;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: insets.top,
        paddingHorizontal: theme.spacing.lg,
        justifyContent: 'center',
      }}
    >
      <View style={{ alignItems: 'center', gap: theme.spacing.base }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: theme.radii.pill,
            backgroundColor: theme.colors.accentWash,
            borderWidth: 1,
            borderColor: theme.colors.accentBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" size={32} color={theme.colors.accentInk} />
        </View>

        <Text variant="display">{'You’re in.'}</Text>
        <Text variant="body" color="secondary" style={{ textAlign: 'center' }}>
          {`${lead} We’ve emailed the details.`}
        </Text>
      </View>

      <View
        style={{
          marginTop: theme.spacing.xl,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radii.card,
          padding: theme.spacing.base + 2,
          gap: theme.spacing.sm,
        }}
      >
        <Text variant="numeral">{dateLine}</Text>
        <Text variant="body">
          {snapshot.serviceName}
          {snapshot.durationMinutes ? ` · ${snapshot.durationMinutes} min` : ''}
        </Text>
        {snapshot.isRecurring && extraSessions > 0 ? (
          <Text variant="secondary" color="secondary">
            Plus {extraSessions} more {dayLabel}
            {extraSessions === 1 ? '' : 's'} this month — then your spot renews monthly.
          </Text>
        ) : null}
        {paidLine ? (
          <>
            <View style={{ height: 1, backgroundColor: theme.colors.divider }} />
            <Text variant="caption" color="tertiary">
              {paidLine}
            </Text>
          </>
        ) : null}
      </View>

      <View style={{ marginTop: theme.spacing.xl, paddingBottom: insets.bottom + theme.spacing.lg }}>
        <Button
          label="Done"
          variant="primary"
          onPress={() => router.replace('/my-calendar')}
        />
      </View>
    </View>
  );
}

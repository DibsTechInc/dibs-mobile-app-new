/**
 * One class. Reference mock: `design/mockups/booking-and-account.html` step 2.
 *
 * The time is the headline — a Fraunces numeral, the largest thing on the screen. It is the fact
 * the client came here to confirm, and setting it as a display moment rather than as metadata is
 * most of what keeps this from reading as gym software.
 *
 * The cancellation window is stated in plain time BEFORE booking, not as a policy in hours. A
 * client deciding at 9pm whether to commit to a 7am class deserves to know the window has already
 * closed on them before they tap, not afterwards.
 */
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, StatusTag, Text } from '@/components';
import type { CancelWindow } from '@/domain/cancellation/cancel-window';
import { cancelWindowSentence } from '@/domain/cancellation/cancel-window';
import type { ScheduleEntry } from '@/domain/schedule/types';
import { formatStoredTime } from '@/domain/time/studio-now';
import { useTheme } from '@/theme/ThemeProvider';

export interface ClassDetailScreenProps {
  entry: ScheduleEntry;
  /** 'Tuesday, August 5' — the back link doubles as the day the class is on. */
  dayLabel: string;
  description: string | null;
  locationLabel: string | null;
  cancelWindow: CancelWindow | null;
  /** False when the studio is offboarded or in soft lockout — the CTA comes down. */
  acceptingBookings: boolean;
  /** Booking is P3. Until then the CTA states plainly that it is not live yet. */
  onBook?: () => void;
  onBack: () => void;
}

export function ClassDetailScreen({
  entry,
  dayLabel,
  description,
  locationLabel,
  cancelWindow,
  acceptingBookings,
  onBook,
  onBack,
}: ClassDetailScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  /**
   * "6:00" and "PM", split apart so the meridiem can be set smaller.
   *
   * Split from ONE formatted string rather than formatted twice: `{ hour: 'numeric' }` on its own
   * renders "6 PM", not "6", so composing the two halves separately puts the meridiem in twice.
   * `\s` covers the narrow no-break space newer ICU versions use before AM/PM.
   */
  const [clock, meridiem = ''] = formatStoredTime(entry.startsAt, {
    hour: 'numeric',
    minute: '2-digit',
  }).split(/\s/);

  const cancelSentence = cancelWindowSentence(cancelWindow);
  const bookable = acceptingBookings && !entry.isFull;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
          flexGrow: 1,
        }}
      >
        <Text
          variant="caption"
          color="accent"
          onPress={onBack}
          accessibilityRole="button"
          style={{ paddingVertical: theme.spacing.md }}
        >
          ← {dayLabel}
        </Text>

        {/* The meridiem is set much smaller and baseline-aligned, so "6:00" reads as the moment
            and "PM" as the qualifier rather than as part of the same word. */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
          <Text variant="hero" color="accent">
            {clock}
          </Text>
          {meridiem ? (
            <Text
              variant="title"
              color="accent"
              style={{ marginLeft: theme.spacing.sm, marginBottom: theme.spacing.md }}
            >
              {meridiem}
            </Text>
          ) : null}
        </View>

        <Text variant="display" style={{ marginTop: theme.spacing.sm }}>
          {entry.name}
        </Text>
        <Text variant="secondary" color="secondary" style={{ marginTop: theme.spacing.sm }}>
          {[
            entry.instructor && `with ${entry.instructor}`,
            entry.durationMinutes && `${entry.durationMinutes} minutes`,
            locationLabel,
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>

        <View
          style={{
            height: 1,
            backgroundColor: theme.colors.divider,
            marginVertical: theme.spacing.lg,
          }}
        />

        {description ? (
          <Text variant="body" style={{ marginBottom: theme.spacing.lg }}>
            {description}
          </Text>
        ) : null}

        {/* What it costs, settled here — the same answer the schedule row gave. Once passes are
            wired this is where coverage appears, resolved by the ONE shared helper rather than a
            second computation that can disagree with checkout. */}
        <Card emphasis="flat">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md }}>
            <View style={{ gap: theme.spacing.xs, flexShrink: 1 }}>
              <Text variant="heading">
                {entry.price.kind === 'covered' ? 'Included in your pass' : 'Drop in'}
              </Text>
              {entry.price.kind === 'covered' ? (
                <Text variant="secondary" color="secondary">
                  {entry.price.label}
                </Text>
              ) : null}
            </View>
            {entry.price.kind === 'amount' ? (
              <Text variant="numeral">{entry.price.amountLabel}</Text>
            ) : entry.price.kind === 'covered' ? (
              <Text variant="numeral">$0</Text>
            ) : null}
          </View>
        </Card>

        {entry.isFull ? (
          <View style={{ marginTop: theme.spacing.base, alignSelf: 'flex-start' }}>
            <StatusTag label={entry.hasWaitlist ? 'Waitlist only' : 'Full'} tone="danger" />
          </View>
        ) : entry.spotsLeft !== null && entry.spotsLeft <= 3 ? (
          <View style={{ marginTop: theme.spacing.base, alignSelf: 'flex-start' }}>
            <StatusTag label={`${entry.spotsLeft} spot${entry.spotsLeft === 1 ? '' : 's'} left`} tone="accent" />
          </View>
        ) : null}

        {cancelSentence ? (
          <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.base }}>
            {cancelSentence}
          </Text>
        ) : null}
      </ScrollView>

      {/* One filled CTA. If a second action mattered as much, neither would. */}
      <View
        style={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.base,
          paddingBottom: insets.bottom + theme.spacing.base,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        }}
      >
        {!acceptingBookings ? (
          <Text variant="secondary" color="secondary" align="center">
            Booking is temporarily unavailable. Contact the studio to book this class.
          </Text>
        ) : (
          <Button
            label={
              entry.isFull ? (entry.hasWaitlist ? 'Join the waitlist' : 'Class is full') : 'Book this class'
            }
            // Booking lands in P3. Saying so plainly beats a button that looks live and does
            // nothing — a CTA that no-ops against the state it appears to resolve is the exact
            // shape of the widget's "Use this card" dead end.
            disabled={!bookable || !onBook}
            onPress={onBook}
          />
        )}
        {bookable && !onBook ? (
          <Text variant="caption" color="tertiary" align="center" style={{ marginTop: theme.spacing.sm }}>
            Booking from the app is coming shortly.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

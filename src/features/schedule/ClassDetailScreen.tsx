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
import type { ClassCharge } from '@/domain/pricing/class-charge';
import type { ScheduleEntry } from '@/domain/schedule/types';
import { formatStoredTime } from '@/domain/time/studio-now';
import type { BookingStatus } from '@/features/bookings/useBookClass';
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
  /**
   * What the card will actually be charged, tax included.
   *
   * The schedule row quotes the pre-tax drop-in because a list is scanned, but this is the screen
   * where somebody commits, and being shown $22 then billed $23.82 is the exact "saw one number,
   * paid another" problem the server-side price check exists to prevent. Null when the class has
   * no card-payable price at all.
   */
  charge: ClassCharge | null;
  /** Where the booking flow currently is. Every value has a way out — see `useBookClass`. */
  bookingStatus?: BookingStatus;
  /**
   * Start (or, after a price change, confirm) the booking. Receives the total the client is
   * agreeing to, so a re-render after `price_changed` sends the number that is on screen NOW.
   */
  onBook?: (totalCents: number) => void;
  onBack: () => void;
}

export function ClassDetailScreen({
  entry,
  dayLabel,
  description,
  locationLabel,
  cancelWindow,
  acceptingBookings,
  charge,
  bookingStatus = { kind: 'idle' },
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

  /** Label left, figure right — the shape every line of the price block shares. */
  const priceRow = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  };

  const cancelSentence = cancelWindowSentence(cancelWindow);

  // A price change is not an error — the number moved, and the client is being asked to confirm
  // the true one. It replaces what the schedule row implied for the rest of this screen.
  const priceChanged = bookingStatus.kind === 'priceChanged';
  const effectiveCharge = priceChanged ? bookingStatus.charge : charge;
  const chargeable = effectiveCharge?.status === 'chargeable';

  // The card path is the only one built. A free class, a pass-covered class or one priced
  // elsewhere books through paths that do not exist in the app yet, so the CTA is not offered for
  // them — an unpayable button is worse than an honest sentence.
  const bookable = acceptingBookings && !entry.isFull && chargeable && Boolean(onBook);
  const isWorking = bookingStatus.kind === 'working';
  const booked = bookingStatus.kind === 'booked';

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

        {/* What it costs, settled here. The schedule row quotes the drop-in because a list is
            scanned; this is where somebody commits, so the TOTAL is the number set as the
            numeral and the tax is spelled out above it rather than appearing on a statement. */}
        <Card emphasis="flat">
          {chargeable && effectiveCharge ? (
            <View style={{ gap: theme.spacing.sm }}>
              <View style={priceRow}>
                <Text variant="secondary" color="secondary">
                  {effectiveCharge.isDiscounted ? 'Drop in (off-peak rate)' : 'Drop in'}
                </Text>
                <Text variant="secondary">{effectiveCharge.subtotalLabel}</Text>
              </View>

              {effectiveCharge.taxCents > 0 ? (
                <View style={priceRow}>
                  <Text variant="secondary" color="secondary">
                    Tax
                  </Text>
                  <Text variant="secondary">{effectiveCharge.taxLabel}</Text>
                </View>
              ) : null}

              <View
                style={{
                  height: 1,
                  backgroundColor: theme.colors.divider,
                  marginVertical: theme.spacing.xs,
                }}
              />

              <View style={priceRow}>
                <Text variant="heading">Total</Text>
                <Text variant="numeral">{effectiveCharge.totalLabel}</Text>
              </View>
            </View>
          ) : (
            <View style={{ ...priceRow, gap: theme.spacing.md }}>
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
          )}
        </Card>

        {priceChanged ? (
          // Deliberately worded as news, not as a failure. An off-peak window closing between the
          // schedule render and the tap is the ordinary cause, and nothing was charged — no
          // PaymentIntent was even created.
          <Text variant="secondary" color="secondary" style={{ marginTop: theme.spacing.base }}>
            The price for this class updated to {effectiveCharge?.totalLabel}. Tap book to confirm
            at the new price.
          </Text>
        ) : null}

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
        {booked ? (
          // The end of the flow. Confirmation copy, not another button — a primary CTA still
          // sitting there after a successful booking invites a second one.
          <Text variant="heading" align="center">
            You’re booked. See you {dayLabel.split(',')[0]}.
          </Text>
        ) : !acceptingBookings ? (
          <Text variant="secondary" color="secondary" align="center">
            Booking is temporarily unavailable. Contact the studio to book this class.
          </Text>
        ) : (
          <>
            {bookingStatus.kind === 'error' ? (
              <Text
                variant="secondary"
                color="danger"
                align="center"
                style={{ marginBottom: theme.spacing.md }}
              >
                {bookingStatus.message}
                {/* Only ever said when the SERVER confirmed it. Claiming it on an unknown failure
                    would be a guess about somebody's money. */}
                {bookingStatus.nothingCharged ? ' Your card was not charged.' : ''}
              </Text>
            ) : null}

            <Button
              label={
                entry.isFull
                  ? entry.hasWaitlist
                    ? 'Join the waitlist'
                    : 'Class is full'
                  : // The total rides ON the button, because that is the thing being pressed to
                    // agree to it.
                    chargeable && effectiveCharge
                    ? `${priceChanged ? 'Confirm' : 'Book'} · ${effectiveCharge.totalLabel}`
                    : 'Book this class'
              }
              loading={isWorking}
              // A CTA that no-ops against the state it appears to resolve is the shape of the
              // widget's "Use this card" dead end. When booking is not possible the button is
              // disabled AND the line below says why.
              disabled={!bookable}
              onPress={
                onBook && effectiveCharge ? () => onBook(effectiveCharge.totalCents) : undefined
              }
            />

            {!entry.isFull && !chargeable ? (
              <Text
                variant="caption"
                color="tertiary"
                align="center"
                style={{ marginTop: theme.spacing.sm }}
              >
                {effectiveCharge?.status === 'free'
                  ? 'This class is free — book it with the studio directly for now.'
                  : 'Booking this class from the app is coming shortly.'}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

/**
 * One class, in full — the screen behind "Details". Reference mock:
 * `design/mockups/booking-and-account.html` step 2.
 *
 * The time is the headline — a Fraunces numeral, the largest thing on the screen. It is the fact
 * the client came here to confirm, and setting it as a display moment rather than as metadata is
 * most of what keeps this from reading as gym software.
 *
 * The cancellation window is stated in plain time BEFORE booking, not as a policy in hours. A
 * client deciding at 9pm whether to commit to a 7am class deserves to know the window has already
 * closed on them before they tap, not afterwards.
 *
 * ── This screen is for READING. It does not take money ────────────────────────────────────────
 * A client who knows what they want never comes here: they tap Book on the schedule row and go
 * straight to checkout. This is the other path — the description, the location, the policy, room
 * to decide — and its CTA does exactly what the row's does, which is add the class to the cart.
 *
 * That is deliberate, and it is the reason the booking state machine was taken OUT of here. Two
 * screens that can each independently create a PaymentIntent are two places a price is decided,
 * and the widget's history is a long argument for having exactly one. `/checkout` is that one.
 */
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, StatusTag, Text } from '@/components';
import type { CancelWindow } from '@/domain/cancellation/cancel-window';
import { cancelWindowSentence } from '@/domain/cancellation/cancel-window';
import type { ClassCharge } from '@/domain/pricing/class-charge';
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
  /**
   * What the card will actually be charged, tax included.
   *
   * The schedule row quotes the pre-tax drop-in because a list is scanned, but this is the screen
   * where somebody commits, and being shown $22 then billed $23.82 is the exact "saw one number,
   * paid another" problem the server-side price check exists to prevent. Null when the class has
   * no card-payable price at all.
   */
  charge: ClassCharge | null;
  /** Already in the cart. The CTA becomes the way to the cart rather than a second add. */
  inCart: boolean;
  /** Add this class to the cart. Absent when the studio cannot take bookings at all. */
  onAddToCart?: () => void;
  /** Go to checkout. Present whenever `onAddToCart` is — adding leads straight here. */
  onOpenCart?: () => void;
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
  inCart,
  onAddToCart,
  onOpenCart,
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

  /**
   * A pass the client holds covers this class — decided by `toScheduleEntry`, which calls the same
   * `choosePassForClass` the cart and the server use.
   *
   * Checked BEFORE `chargeable`, and that ordering is the point. `charge` is the CARD price and it
   * is perfectly valid for a covered class — the studio still lists it at $39. Branching on
   * `chargeable` first would put "Book · $42.23" on the button for a member whose membership
   * already pays for it, which is the widget's single most expensive pass bug.
   */
  const coveredByPass = entry.price.kind === 'covered';

  const effectiveCharge = charge;
  const chargeable = effectiveCharge?.status === 'chargeable';

  // A free class or one priced elsewhere books through paths that do not exist in the app yet, so
  // the CTA is not offered for them — an unpayable button is worse than an honest sentence. A
  // COVERED class is bookable regardless of what the card price says.
  const bookable =
    acceptingBookings && !entry.isFull && (coveredByPass || chargeable) && Boolean(onAddToCart);

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
          {coveredByPass ? (
            // The pass is NAMED. "Included" alone leaves a member wondering which of their passes
            // is about to lose a class, and the one named here is the one that gets spent.
            <View style={{ ...priceRow, gap: theme.spacing.md }}>
              <View style={{ gap: theme.spacing.xs, flexShrink: 1 }}>
                <Text variant="heading">Included in your pass</Text>
                <Text variant="secondary" color="secondary">
                  {entry.price.kind === 'covered' ? entry.price.label : ''}
                </Text>
              </View>
              <Text variant="numeral">$0</Text>
            </View>
          ) : chargeable && effectiveCharge ? (
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
        ) : entry.isFull ? (
          // No button. A control labelled "Join the waitlist" with no waitlist behind it is worse
          // than a plain sentence, and the tag above already states the fact.
          <Text variant="secondary" color="secondary" align="center">
            {entry.hasWaitlist
              ? 'This class is full. Contact the studio about the waitlist.'
              : 'This class is full.'}
          </Text>
        ) : inCart && onOpenCart ? (
          // Already added. The CTA becomes the way ONWARD rather than a second add that would
          // silently do nothing — the shape of the widget's "Use this card" dead end.
          <>
            <Button label="Review your cart" onPress={onOpenCart} />
            <Text
              variant="caption"
              color="tertiary"
              align="center"
              style={{ marginTop: theme.spacing.sm }}
            >
              This class is in your cart.
            </Text>
          </>
        ) : (
          <>
            <Button
              // The total rides ON the button, because that is the thing being pressed to agree
              // to it — tax included, which is the whole reason this screen quotes a total where
              // the schedule row quotes a drop-in. A covered class carries no figure at all: a
              // price on that button is a price nobody is paying.
              label={
                coveredByPass
                  ? 'Book with your pass'
                  : chargeable && effectiveCharge
                    ? `Book · ${effectiveCharge.totalLabel}`
                    : 'Book this class'
              }
              // A CTA that no-ops against the state it appears to resolve is the shape of the
              // widget's "Use this card" dead end. When booking is not possible the button is
              // disabled AND the line below says why.
              disabled={!bookable}
              onPress={onAddToCart}
            />

            {!coveredByPass && !chargeable ? (
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

/**
 * Checkout — what is in the cart, what it costs, and one button.
 *
 * ── This is the screen where somebody commits, so it shows the TOTAL ──────────────────────────
 * The schedule quotes the pre-tax drop-in because a list is scanned. Here the tax is spelled out
 * on its own line and the figure on the button is the figure the card is charged. Being shown $39
 * and billed $42.23 is the exact problem the server-side price check exists to prevent, and a
 * checkout that repeats the schedule's number would recreate it.
 *
 * ── Every line states its own outcome ──────────────────────────────────────────────────────────
 * Classes are charged one at a time (see `useCartCheckout`), so a run can end with two booked and
 * one declined. Each line therefore carries its own verdict, and the summary underneath counts
 * what actually happened rather than reporting the run as a single success or failure.
 *
 * ── Nothing here is a dead end ────────────────────────────────────────────────────────────────
 * A cancelled class, one that filled while it sat in the cart, one covered by a pass, one the
 * studio does not price for cards — each gets a sentence saying which it is and keeps its Remove
 * control. The CTA is present only when there is something a card can actually pay for; when there
 * is not, the screen says why instead of offering a button that cannot succeed.
 */
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, EmptyState, Icon, SkeletonList, StatusTag, Text } from '@/components';
import type { CartLine } from '@/domain/cart/build-cart';
import { formatStoredTime } from '@/domain/time/studio-now';
import { useTheme } from '@/theme/ThemeProvider';

import type { CheckoutPhase, LineOutcome } from './useCartCheckout';

export interface CheckoutLineView extends CartLine {
  /** "Free cancellation until 4:00 PM on Friday." Null when the studio publishes no window. */
  cancelSentence: string | null;
  outcome: LineOutcome;
}

export interface CheckoutScreenProps {
  lines: CheckoutLineView[];
  /** Counts and money from `useCart` — never recomputed here. */
  chargeableCount: number;
  totalCents: number;
  totalLabel: string;
  /** True while the schedule is still arriving; without it every line reads as cancelled. */
  isResolving: boolean;
  /** False when the studio is offboarded or in soft lockout — the CTA comes down. */
  acceptingBookings: boolean;
  studioName: string;
  phase: CheckoutPhase;
  onRemove: (eventId: number) => void;
  onConfirm: () => void;
  onBack: () => void;
  /** Where a client goes once something is booked. */
  onViewCalendar: () => void;
  onBrowseClasses: () => void;
}

/** Label left, figure right — the shape every price line shares. */
const priceRow = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
};

function OutcomeNote({ outcome }: { outcome: LineOutcome }) {
  const theme = useTheme();

  switch (outcome.kind) {
    case 'booked':
      return (
        <View style={{ marginTop: theme.spacing.md }}>
          <StatusTag label="Booked" tone="success" />
        </View>
      );
    case 'working':
      return (
        <Text variant="caption" color="secondary" style={{ marginTop: theme.spacing.md }}>
          Charging your card…
        </Text>
      );
    case 'coveredByPass':
      // Good news, so it is not styled as an error. The server's sentence names the package.
      return (
        <Text variant="secondary" color="secondary" style={{ marginTop: theme.spacing.md }}>
          {outcome.message}
        </Text>
      );
    case 'priceChanged':
      // Deliberately worded as news, not as a failure. An off-peak window closing between the
      // schedule render and the tap is the ordinary cause, and nothing was charged.
      return (
        <Text variant="secondary" color="secondary" style={{ marginTop: theme.spacing.md }}>
          The price updated to {outcome.charge.totalLabel}. Confirm below to book at the new price.
        </Text>
      );
    case 'failed':
      return (
        <Text variant="secondary" color="danger" style={{ marginTop: theme.spacing.md }}>
          {outcome.message}
          {/* Only ever said when the SERVER confirmed it. Claiming it on an unknown failure would
              be a guess about somebody's money. */}
          {outcome.nothingCharged ? ' Your card was not charged.' : ''}
        </Text>
      );
    default:
      return null;
  }
}

function LineCard({
  line,
  onRemove,
  removable,
}: {
  line: CheckoutLineView;
  onRemove: () => void;
  removable: boolean;
}) {
  const theme = useTheme();

  // A price change replaces what the cart implied for the rest of this line — the client is being
  // asked to confirm the server's number, so the server's number is what shows.
  const charge = line.outcome.kind === 'priceChanged' ? line.outcome.charge : line.charge;
  const showPrices = line.state === 'ready' && charge?.status === 'chargeable';

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radii.card,
        padding: theme.spacing.base,
        // A booked line steps back rather than disappearing: it is the receipt for what just
        // happened, and removing it mid-run would make the screen shuffle under a thumb.
        opacity: line.outcome.kind === 'booked' ? 0.7 : 1,
      }}
    >
      <View style={{ ...priceRow, alignItems: 'flex-start', gap: theme.spacing.md }}>
        <View style={{ flexShrink: 1, gap: 3 }}>
          <Text variant="heading">{line.entry?.name ?? 'This class'}</Text>
          {line.entry ? (
            <Text variant="secondary" color="secondary">
              {/* Stored wall-clock, printed verbatim — never device-converted. */}
              {[line.dayLabel, formatStoredTime(line.entry.startsAt)].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
          {line.entry ? (
            <Text variant="caption" color="tertiary">
              {[
                line.entry.instructor && `with ${line.entry.instructor}`,
                line.entry.durationMinutes && `${line.entry.durationMinutes} minutes`,
                line.locationLabel,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          ) : null}
        </View>

        {/* Labelled, not a bare ✕. An unlabelled glyph beside a price is a quiz, and the wrong
            answer here removes a class somebody meant to book. */}
        {removable ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${line.entry?.name ?? 'this class'} from your cart`}
            onPress={onRemove}
            hitSlop={10}
            style={({ pressed }) => [{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3,
              opacity: pressed ? 0.55 : 1,
            }]}
          >
            <Icon name="close" size={14} color={theme.colors.textTertiary} />
            <Text variant="caption" color="tertiary">
              Remove
            </Text>
          </Pressable>
        ) : null}
      </View>

      {showPrices && charge ? (
        <View
          style={{
            marginTop: theme.spacing.base,
            paddingTop: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.divider,
            gap: theme.spacing.sm,
          }}
        >
          <View style={priceRow}>
            <Text variant="secondary" color="secondary">
              {charge.isDiscounted ? 'Drop in (off-peak rate)' : 'Drop in'}
            </Text>
            <Text variant="secondary">{charge.subtotalLabel}</Text>
          </View>

          {charge.taxCents > 0 ? (
            <View style={priceRow}>
              <Text variant="secondary" color="secondary">
                Tax
              </Text>
              <Text variant="secondary">{charge.taxLabel}</Text>
            </View>
          ) : null}

          <View style={priceRow}>
            <Text variant="bodyMedium">Charged</Text>
            <Text variant="numeral">{charge.totalLabel}</Text>
          </View>
        </View>
      ) : line.note ? (
        <Text variant="secondary" color="secondary" style={{ marginTop: theme.spacing.md }}>
          {line.note}
        </Text>
      ) : null}

      {/* Stated BEFORE booking, in plain time. Someone deciding at 9pm whether to commit to a 7am
          class deserves to know the window has already closed on them before they tap. */}
      {line.cancelSentence && line.state === 'ready' && line.outcome.kind !== 'booked' ? (
        <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.md }}>
          {line.cancelSentence}
        </Text>
      ) : null}

      <OutcomeNote outcome={line.outcome} />
    </View>
  );
}

export function CheckoutScreen({
  lines,
  chargeableCount,
  totalCents,
  totalLabel,
  isResolving,
  acceptingBookings,
  studioName,
  phase,
  onRemove,
  onConfirm,
  onBack,
  onViewCalendar,
  onBrowseClasses,
}: CheckoutScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const isWorking = phase.kind === 'working';
  const bookedCount = lines.filter((line) => line.outcome.kind === 'booked').length;
  const anyRetryable = lines.some(
    (line) =>
      line.state === 'ready' &&
      (line.outcome.kind === 'failed' || line.outcome.kind === 'priceChanged'),
  );
  // Finished ONLY when something actually booked and nothing is left to charge. A cart whose every
  // line was blocked has `chargeableCount === 0` too, and titling that screen "Booked" would be
  // the app claiming a booking nobody made.
  const isComplete = bookedCount > 0 && chargeableCount === 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: theme.spacing.lg }}>
        <Text
          variant="caption"
          color="accent"
          onPress={onBack}
          accessibilityRole="button"
          style={{ paddingVertical: theme.spacing.md }}
        >
          ← Back to the schedule
        </Text>
        <Text variant="display">{isComplete ? 'Booked' : 'Checkout'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xl,
          gap: theme.spacing.md,
          flexGrow: 1,
        }}
      >
        {isResolving && lines.length > 0 ? (
          // Before the schedule lands every line would resolve to "no longer on the schedule".
          // Telling a client their class was cancelled because their connection was slow is the
          // "empty list means you have none" mistake in a new costume.
          <SkeletonList count={lines.length} />
        ) : lines.length === 0 ? (
          <EmptyState
            title={bookedCount > 0 ? 'That’s everything booked.' : 'Your cart is empty.'}
            body={
              bookedCount > 0
                ? `Your ${bookedCount === 1 ? 'class is' : 'classes are'} in My calendar. See you at ${studioName}.`
                : `Tap Book on a class at ${studioName} and it will show up here.`
            }
            action={
              bookedCount > 0
                ? { label: 'See my calendar', onPress: onViewCalendar }
                : { label: 'Browse classes', onPress: onBrowseClasses }
            }
          />
        ) : (
          <>
            {lines.map((line) => (
              <LineCard
                key={line.eventId}
                line={line}
                removable={line.outcome.kind !== 'booked' && !isWorking}
                onRemove={() => onRemove(line.eventId)}
              />
            ))}

            {/*
              Said plainly, and only when it applies.

              There is no multi-class booking endpoint: each class is its own PaymentIntent on the
              studio's connected account, so a cart of three is three lines on a statement. A single
              combined total presented as one charge would be a number the client never actually
              gets billed.
            */}
            {chargeableCount > 1 ? (
              <Text variant="caption" color="tertiary">
                Each class is charged separately, so you’ll see {chargeableCount} charges from{' '}
                {studioName}.
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>

      {lines.length > 0 ? (
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.base,
            paddingBottom: insets.bottom + theme.spacing.base,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.background,
            gap: theme.spacing.md,
          }}
        >
          {chargeableCount > 0 ? (
            <View style={priceRow}>
              <Text variant="heading">Total</Text>
              <Text variant="numeral">{totalLabel}</Text>
            </View>
          ) : null}

          {!acceptingBookings ? (
            <Text variant="secondary" color="secondary" align="center">
              Booking is temporarily unavailable. Contact {studioName} to book these classes.
            </Text>
          ) : bookedCount > 0 && chargeableCount === 0 ? (
            // The end of the flow, and it must not be a dead end. A confirmation with no way
            // onward leaves somebody who just paid hunting for a back chevron.
            <>
              {/* Counts what booked, and claims nothing about the lines that did not. "All N
                  booked" beside a class that filled up would be the screen contradicting itself
                  two inches apart. */}
              <Text variant="heading" align="center">
                {bookedCount === 1 ? 'You’re booked.' : `${bookedCount} classes booked.`}
              </Text>
              <Button label="See my calendar" variant="secondary" onPress={onViewCalendar} />
            </>
          ) : chargeableCount === 0 ? (
            // Every line is blocked and nothing booked. There is nothing to charge, so there is no
            // primary button — the lines above each say why, and Remove is still on all of them.
            <Text variant="secondary" color="secondary" align="center">
              None of these can be booked with a card right now.
            </Text>
          ) : (
            <Button
              // The total rides ON the button, because that is the thing being pressed to agree
              // to it.
              label={
                anyRetryable
                  ? `Try again · ${totalLabel}`
                  : `Book ${chargeableCount === 1 ? 'class' : `${chargeableCount} classes`} · ${totalLabel}`
              }
              loading={isWorking}
              disabled={isWorking || totalCents <= 0}
              onPress={onConfirm}
            />
          )}

          {phase.kind === 'done' && bookedCount > 0 && chargeableCount > 0 ? (
            // A partial run. Say what landed, so the remaining button does not read as though
            // nothing worked.
            <Text variant="caption" color="tertiary" align="center">
              {bookedCount} of {bookedCount + chargeableCount} booked. The rest are still here.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

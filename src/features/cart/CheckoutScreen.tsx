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
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, EmptyState, Icon, SkeletonList, StatusTag, Text } from '@/components';
import type { CartLine } from '@/domain/cart/build-cart';
import type { CheckoutPaymentSummary } from '@/domain/payments/checkout-method';
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
  /** Counts and money resolved by the route — never recomputed here. */
  chargeableCount: number;
  /** Still-to-book lines a pass covers. They cost $0 and open no payment sheet. */
  coveredCount: number;
  totalCents: number;
  totalLabel: string;
  /** True while the schedule is still arriving; without it every line reads as cancelled. */
  isResolving: boolean;
  /**
   * The client's studio credit, and their choice about spending it.
   *
   * `creditBalanceCents` is what they hold; `creditAppliedCents` is what this cart will consume.
   * The toggle is absent entirely when the balance is zero — an off switch for something they do
   * not have is noise.
   */
  creditBalanceCents?: number;
  creditAppliedCents?: number;
  applyCredit?: boolean;
  onApplyCreditChange?: (next: boolean) => void;
  /** Formats cents in the studio's currency. */
  formatCents?: (cents: number) => string;
  /** False when the studio is offboarded or in soft lockout — the CTA comes down. */
  acceptingBookings: boolean;
  studioName: string;
  phase: CheckoutPhase;
  /**
   * What is about to pay for this, resolved by `describeCheckoutPayment`.
   *
   * Never computed here — the label above the button and the money leaving the account have to
   * come from one resolution, which is the whole lesson of the widget's payment-method work.
   */
  payment: CheckoutPaymentSummary;
  onRemove: (eventId: number) => void;
  onConfirm: () => void;
  /** Book a SECOND spot in one class. Only ever reachable from an `alreadyBooked` line. */
  onBookAnother: (eventId: number) => void;
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

function OutcomeNote({
  outcome,
  onBookAnother,
}: {
  outcome: LineOutcome;
  /** Absent while a run is in flight, so a second tap cannot open a second sheet. */
  onBookAnother?: () => void;
}) {
  const theme = useTheme();

  switch (outcome.kind) {
    case 'booked':
      return (
        <View style={{ marginTop: theme.spacing.md }}>
          <StatusTag label="Booked" tone="success" />
        </View>
      );
    /*
     * The client is already in this class.
     *
     * This used to render as a red failure under a button reading "Try again · $40.76" — and
     * trying again could only ever produce the same refusal, because the server counts attendee
     * rows and nothing about tapping changes that. A wall dressed as a retry.
     *
     * It is a question instead. Booking a second spot is legitimate and common (a friend, a
     * partner, a child), so the line states the fact in a neutral voice and offers the one action
     * that actually moves: book another. Nothing is assumed — the duplicate permission is minted
     * by this tap and nothing else.
     */
    case 'alreadyBooked':
      return (
        <View style={{ marginTop: theme.spacing.md, gap: theme.spacing.md }}>
          <Text variant="secondary" color="secondary">
            {outcome.existingCount && outcome.existingCount > 1
              ? `You already have ${outcome.existingCount} spots in this class.`
              : 'You’re already booked into this class.'}{' '}
            Booking again adds another spot — useful if you’re bringing someone.
          </Text>
          {onBookAnother ? (
            <View style={{ alignSelf: 'flex-start' }}>
              <Button
                label="Book another spot"
                variant="secondary"
                size="compact"
                fullWidth={false}
                onPress={onBookAnother}
              />
            </View>
          ) : null}
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
    /*
     * This class cannot be booked in the app at all — today, a virtual class at a studio that
     * sells them only on the web.
     *
     * Neutral, not red: nothing went wrong and nothing was charged, and the class is genuinely
     * bookable, just somewhere else. The one action that moves is Remove, which the line already
     * carries — so this says so rather than adding a second button beside it. The CTA has already
     * stopped counting this line (see `outstanding` in checkout.tsx), which is what stops it
     * reading as a retryable failure.
     */
    /*
     * Their credit balance moved between the screen and the tap — spent on another device, most
     * often. Worded as news exactly like `priceChanged`, because that is what it is: nothing was
     * charged, no PaymentIntent was created, and the same button confirms the new split.
     */
    case 'creditChanged':
      return (
        <Text variant="secondary" color="secondary" style={{ marginTop: theme.spacing.md }}>
          Your credit balance changed. Confirm below to book at the updated split.
        </Text>
      );
    case 'unavailable':
      return (
        <Text variant="secondary" color="secondary" style={{ marginTop: theme.spacing.md }}>
          {outcome.message} Remove it to check out the rest.
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
  onBookAnother,
}: {
  line: CheckoutLineView;
  onRemove: () => void;
  removable: boolean;
  onBookAnother?: () => void;
}) {
  const theme = useTheme();

  // A price change replaces what the cart implied for the rest of this line — the client is being
  // asked to confirm the server's number, so the server's number is what shows.
  const charge = line.outcome.kind === 'priceChanged' ? line.outcome.charge : line.charge;
  const showPrices = line.state === 'ready' && charge?.status === 'chargeable';
  const covered = line.state === 'covered';

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
      ) : covered ? (
        // Named, not just zeroed. "Included" alone leaves a member wondering WHICH of their passes
        // is about to lose a class — and the pass named here is the one the server will spend,
        // because both use the same chooser.
        <View
          style={{
            marginTop: theme.spacing.base,
            paddingTop: theme.spacing.md,
            borderTopWidth: 1,
            borderTopColor: theme.colors.divider,
            ...priceRow,
          }}
        >
          <Text variant="secondary" color="secondary" style={{ flexShrink: 1 }} numberOfLines={2}>
            {line.passName ? `Using your ${line.passName}` : 'Covered by your pass'}
          </Text>
          <Text variant="numeral">$0</Text>
        </View>
      ) : line.note ? (
        <Text variant="secondary" color="secondary" style={{ marginTop: theme.spacing.md }}>
          {line.note}
        </Text>
      ) : null}

      {/* Stated BEFORE booking, in plain time. Someone deciding at 9pm whether to commit to a 7am
          class deserves to know the window has already closed on them before they tap. It applies
          to a pass booking exactly as much as to a card one — arguably more, since a late cancel
          there costs a class rather than money. */}
      {line.cancelSentence && (line.state === 'ready' || covered) && line.outcome.kind !== 'booked' ? (
        <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.md }}>
          {line.cancelSentence}
        </Text>
      ) : null}

      <OutcomeNote outcome={line.outcome} onBookAnother={onBookAnother} />
    </View>
  );
}

/**
 * The end of the flow, given the room it earns.
 *
 * ── Why this is a screen and not a footer line ────────────────────────────────────────────────
 * It used to be the word "Booked" in the header and "You're booked." in six-point-something type
 * above a secondary button, over a cart line that still looked like a cart line. Alicia's note,
 * 2026-08-14: *"it just says that you're booked at the bottom — this screen needs more
 * personality."* She is right, and the reason is structural rather than decorative: the moment a
 * client commits money is the one moment the app has their full attention, and it was answering
 * with the visual weight of a form validation message.
 *
 * So the confirmation becomes the subject. The accent field, the serif at hero size, the class
 * named with the day and time somebody will actually need to remember — and then the two things a
 * person wants next, in the order they want them: see it in my calendar, or book another.
 *
 * ── What it does NOT do ───────────────────────────────────────────────────────────────────────
 * It does not claim more than happened. The count is the count of lines that actually booked, and
 * a partial run never reaches this screen at all — the list stays up with the remaining lines and
 * their own actions, because "2 classes booked" printed above a class that filled up would be the
 * screen contradicting itself two inches apart.
 */
function BookedConfirmation({
  lines,
  studioName,
  onViewCalendar,
  onBrowseClasses,
}: {
  /** Only the lines that actually booked. */
  lines: CheckoutLineView[];
  studioName: string;
  onViewCalendar: () => void;
  onBrowseClasses: () => void;
}) {
  const theme = useTheme();
  const first = lines[0];
  const more = lines.length - 1;

  return (
    <View style={{ gap: theme.spacing.lg }}>
      <View
        style={{
          borderRadius: theme.radii.card,
          borderWidth: 1,
          borderColor: theme.colors.accentBorder,
          backgroundColor: theme.colors.accentWash,
          padding: theme.spacing.lg,
        }}
      >
        <Text variant="label" color="accent" uppercase>
          {lines.length === 1 ? 'Confirmed' : `${lines.length} confirmed`}
        </Text>

        {/* The one place on this flow the type scale is allowed to shout. */}
        <Text variant="hero" style={{ marginTop: theme.spacing.sm }}>
          {lines.length === 1 ? 'You’re in.' : 'You’re all set.'}
        </Text>

        {first?.entry ? (
          <View style={{ marginTop: theme.spacing.base, gap: 3 }}>
            <Text variant="title">{first.entry.name}</Text>
            <Text variant="secondary" color="secondary">
              {/* Stored wall-clock, printed verbatim — never device-converted. */}
              {[first.dayLabel, formatStoredTime(first.entry.startsAt)].filter(Boolean).join(' · ')}
            </Text>
            {first.entry.instructor ? (
              <Text variant="caption" color="tertiary">
                with {first.entry.instructor}
              </Text>
            ) : null}
            {/* Plural carts name the first and count the rest rather than listing four cards. The
                calendar is one tap away and is the right place for a list. */}
            {more > 0 ? (
              <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.xs }}>
                and {more} more {more === 1 ? 'class' : 'classes'}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Said once, quietly, because it is the question people ask next and the answer is boring:
          yes, something arrived. Not promised as a channel — the studio decides whether that is an
          email, a text, or both, and naming the wrong one is worse than naming none. */}
      <Text variant="secondary" color="secondary">
        {studioName} has your booking, and a confirmation is on its way.
      </Text>

      <View style={{ gap: theme.spacing.md }}>
        <Button label="See my calendar" onPress={onViewCalendar} />
        {/* The second action matters as much as the first. A confirmation with one way out sends
            everybody to the same place; a lot of people finish booking one class wanting another. */}
        <Button label="Book another class" variant="secondary" onPress={onBrowseClasses} />
      </View>
    </View>
  );
}

export function CheckoutScreen({
  lines,
  chargeableCount,
  coveredCount,
  totalCents,
  totalLabel,
  isResolving,
  acceptingBookings,
  studioName,
  phase,
  payment,
  onRemove,
  onConfirm,
  onBookAnother,
  onBack,
  onViewCalendar,
  onBrowseClasses,
  creditBalanceCents = 0,
  creditAppliedCents = 0,
  applyCredit = true,
  onApplyCreditChange,
  formatCents,
}: CheckoutScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const isWorking = phase.kind === 'working';
  const bookedLines = lines.filter((line) => line.outcome.kind === 'booked');
  const bookedCount = bookedLines.length;
  /*
   * `alreadyBooked` is deliberately NOT retryable.
   *
   * It is the one refusal a retry cannot change: the server counts attendee rows, and pressing a
   * button labelled "Try again" does not remove one. That is what put "Try again · $40.76" under
   * "You're already booked into this class" — a primary CTA that could only ever reproduce the
   * refusal it was offered in response to. The line carries its own action instead.
   */
  const anyRetryable = lines.some(
    (line) =>
      (line.state === 'ready' || line.state === 'covered') &&
      (line.outcome.kind === 'failed' || line.outcome.kind === 'priceChanged'),
  );

  /** Everything still to book, by either route. What the CTA acts on. */
  const bookableCount = chargeableCount + coveredCount;

  // Finished ONLY when something actually booked and nothing is left to do. A cart whose every
  // line was blocked has `bookableCount === 0` too, and titling that screen "Booked" would be the
  // app claiming a booking nobody made.
  const isComplete = bookedCount > 0 && bookableCount === 0;

  /**
   * What the button says.
   *
   * Three shapes, because a cart can be all-pass, all-card, or mixed — and a button reading
   * "Book 2 classes · $0.00" for two pass-covered classes puts a price on something free, which is
   * the sort of detail that makes people close an app.
   */
  const ctaLabel = (() => {
    const noun = bookableCount === 1 ? 'class' : `${bookableCount} classes`;
    const verb = anyRetryable ? 'Try again' : 'Book';
    if (chargeableCount === 0) return `${verb} · ${noun} with your pass`;
    if (anyRetryable) return `Try again · ${totalLabel}`;
    return `Book ${noun} · ${totalLabel}`;
  })();

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
        {/* No "Booked" title over the confirmation — the confirmation says it, at hero size, and
            a display heading repeating it would be the same word twice in two sizes. */}
        {isComplete ? null : <Text variant="display">Checkout</Text>}
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
        {isComplete ? (
          <BookedConfirmation
            lines={bookedLines}
            studioName={studioName}
            onViewCalendar={onViewCalendar}
            onBrowseClasses={onBrowseClasses}
          />
        ) : isResolving && lines.length > 0 ? (
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
                // Withheld while a run is in flight — the runner guards against a second run, but
                // a live-looking button that does nothing is its own small lie.
                onBookAnother={isWorking ? undefined : () => onBookAnother(line.eventId)}
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

      {/* The confirmation owns the whole screen and carries its own actions, so the footer comes
          down entirely rather than sitting under it with a Total for a cart that is settled. */}
      {lines.length > 0 && !isComplete ? (
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
          ) : coveredCount > 0 ? (
            // No Total row for a pass-only cart. "Total $0.00" is a money line about a transaction
            // that is not happening, and it reads as though something might still be charged.
            <Text variant="secondary" color="secondary" align="center">
              {coveredCount === 1
                ? 'Covered by your pass — nothing to pay.'
                : `All ${coveredCount} covered by your passes — nothing to pay.`}
            </Text>
          ) : null}

          {/*
            WHAT is about to pay for it, immediately above the button that agrees to it.

            Checkout showed a total and a CTA and said nothing about the source of the money, so
            the only way to find out which card was about to be charged was to press the button
            (Alicia, 2026-08-14). `payment.label` is null whenever there is nothing true to say —
            before Stripe answers, silence rather than a guess. See `describeCheckoutPayment`.
          */}
          {payment.label && bookableCount > 0 ? (
            <View style={{ gap: 2 }}>
              <Text variant="secondary" color="secondary">
                {payment.label}
              </Text>
              {payment.caption ? (
                <Text variant="caption" color="tertiary">
                  {payment.caption}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/*
            The credit switch. Shown only when there IS a balance and something to spend it on —
            an off switch for money the client does not have is noise, and one on an empty cart
            controls nothing.

            Default ON, decided by the route. This is the affordance for the real intention the
            default cannot serve: keeping the balance for something else.
          */}
          {creditBalanceCents > 0 && bookableCount > 0 && onApplyCreditChange ? (
            <Pressable
              onPress={() => onApplyCreditChange(!applyCredit)}
              accessibilityRole="switch"
              accessibilityState={{ checked: applyCredit }}
              accessibilityLabel="Use studio credit"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="secondary">Use studio credit</Text>
                <Text variant="caption" color="tertiary">
                  {/* The BALANCE, always — so turning it off still says what is being kept back. */}
                  {formatCents ? formatCents(creditBalanceCents) : ''} available
                  {applyCredit && creditAppliedCents > 0 && formatCents
                    ? ` · ${formatCents(creditAppliedCents)} to this booking`
                    : ''}
                </Text>
              </View>
              <Switch
                value={applyCredit}
                onValueChange={onApplyCreditChange}
                trackColor={{ true: theme.colors.accentFill, false: theme.colors.border }}
              />
            </Pressable>
          ) : null}

          {!acceptingBookings ? (
            <Text variant="secondary" color="secondary" align="center">
              Booking is temporarily unavailable. Contact {studioName} to book these classes.
            </Text>
          ) : bookableCount === 0 ? (
            // Nothing left the button could act on. Each line above says why and keeps its own
            // action — an already-booked line has "Book another spot", the rest have Remove — so
            // there is deliberately no primary button here to give them a false one.
            <Text variant="secondary" color="secondary" align="center">
              {lines.some((line) => line.outcome.kind === 'alreadyBooked')
                ? 'Nothing more to book — you’re already in these classes.'
                : lines.every((line) => line.outcome.kind === 'unavailable')
                  ? // "right now" would be a lie here — it is not a temporary state, and telling
                    // somebody to come back later for a class that will never be sold in the app
                    // is how a support call starts.
                    `These are only bookable on ${studioName}’s website.`
                  : 'None of these can be booked right now.'}
            </Text>
          ) : (
            <Button
              // The total rides ON the button when there IS one, because that is the thing being
              // pressed to agree to it. A pass-only cart gets no figure — see `ctaLabel`.
              label={ctaLabel}
              loading={isWorking}
              // NOT gated on `totalCents > 0`: a pass-covered cart legitimately totals zero, and
              // disabling the button there would leave a member holding a membership with no way
              // to book at all.
              disabled={isWorking}
              onPress={onConfirm}
            />
          )}

          {phase.kind === 'done' && bookedCount > 0 && bookableCount > 0 ? (
            // A partial run. Say what landed, so the remaining button does not read as though
            // nothing worked.
            <Text variant="caption" color="tertiary" align="center">
              {bookedCount} of {bookedCount + bookableCount} booked. The rest are still here.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

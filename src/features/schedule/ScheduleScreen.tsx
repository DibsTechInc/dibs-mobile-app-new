/**
 * The class schedule. Approved 2026-08-07; reference mock: `design/mockups/rework.html`.
 *
 * ── The studio's colour is structural here ──────────────────────────────────────────────────
 * A solid accent block holds the month and the day strip. That is the one move the old app got
 * right that this one had lost: it says whose app you are in without spending room on a logo, and
 * a pink header beside a slate-blue one is two studios running the same software — which is the
 * whole promise of a white-label build.
 *
 * Three rules that are not cosmetic:
 *
 * 1. **The month label is load-bearing.** The strip runs past the end of a month, so without it the
 *    numerals read `… 18 · 19 · 2 · 8` and look like a broken sort. They are September dates.
 * 2. **Empty days stay in the strip, dimmed.** Dropping them made the numerals jump `8 · 10`, which
 *    looks broken rather than empty. They remain tappable: a dimmed day that refuses the tap is a
 *    dead control, one that opens onto "nothing scheduled" has answered the question.
 * 3. **Rows align to the TOP.** The time's first line sits level with the class name's, whatever
 *    the name does below it. Centred, a time drifts down beside a name that wraps to three lines
 *    (reported on device 2026-08-07).
 *
 * There is no tab bar. A back chevron returns to Home; the drawer moves sideways.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, describeApiError } from '@/api/errors';
import type { Pass } from '@/api/schemas/passes';
import { Button, EmptyState, ErrorState, Icon, SkeletonList, StatusTag, Text } from '@/components';
import {
  bookedSpotsFor,
  bookedSpotsLabel,
  type BookedCounts,
} from '@/domain/bookings/booked-counts';
import { monthLabelFor, type ScheduleDay } from '@/domain/schedule/days';
import { toScheduleEntry } from '@/domain/schedule/entry';
import type { ScheduleEntry } from '@/domain/schedule/types';
import { formatStoredTime } from '@/domain/time/studio-now';
import { CartBar } from '@/features/cart/CartBar';
import { useTheme } from '@/theme/ThemeProvider';

/** Capacity only becomes news at three or fewer. Above that, silence is more honest. */
const SPOTS_LEFT_THRESHOLD = 3;

/**
 * The time rail, and the size the time is set at.
 *
 * Measured, not guessed: "12:00 PM" at the `numeral` role (20px Fraunces) needs ~86pt, so a 76pt
 * rail truncated it to "12:00 …" on device. Rather than widen the rail — which takes width from
 * the class name, the thing people are actually reading — the time drops to 17px, which fits 84pt
 * with room to spare and still reads as the numeral moment it is.
 */
const TIME_RAIL = 84;
const TIME_SIZE = 17;

/**
 * The day strip, revised on device 2026-08-10 (Alicia) against the booking widget.
 *
 * The approved mock draws this strip at ~52pt per day with the numerals in Fraunces, and the app
 * matched it. On a real 393pt screen that puts EIGHT dates on screen at once with barely a hair
 * between them, and the serif numerals — set beside a sans weekday label, in a row of eight — read
 * as decoration rather than as dates. Alicia's words: "too close together", "the font looks meh,
 * like it's trying too hard". The widget's own strip shows FOUR dates in sans and is legible at a
 * glance, which is the bar. This is a deliberate revision OF the mock, not a drift from it.
 *
 * 68 rather than a width that divides the screen evenly: at 393pt it leaves a partial cell at the
 * right edge, which is the only thing on screen that says the strip scrolls. A whole number of
 * cells looks like the whole week and hides the rest of the month.
 */
const DAY_CELL = 68;

/**
 * How much room the list leaves for the sticky cart bar.
 *
 * Measured against `CartBar`'s own anatomy: a ~52pt button plus its 12pt padding top and bottom
 * plus the hairline, then a comfortable margin so the last row does not sit flush against it. The
 * safe-area inset is added separately by the caller, because it varies by device.
 */
const CART_BAR_CLEARANCE = 108;

function DayChip({
  day,
  selected,
  onPress,
}: {
  day: ScheduleDay;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const empty = day.events.length === 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={empty ? `${day.longLabel}, no classes` : day.longLabel}
      onPress={onPress}
      style={({ pressed }) => [{
        // NOT `flex: 1`. The parent cell is `width: 52` with no definite HEIGHT, so a flex child
        // gets `flexBasis: 0` with no free space to grow into and collapses to its padding —
        // clipping both labels to nothing. Height comes from the content; width already
        // stretches to the cell.
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingVertical: theme.spacing.sm,
        // Insets the highlight inside its cell, so the selected day is a tab with air around it
        // rather than a white slab butting against its neighbours. The cell keeps its full 68 for
        // hit area; only the painted surface shrinks.
        marginHorizontal: theme.spacing.xs,
        // A rounded tab, not a circle. `pill` was drawn against a ~52pt square cell, where a full
        // radius rounds all the way to a disc that crops its own label; at 68pt it would stretch
        // to a lozenge instead. A fixed radius reads the same at any cell width.
        borderRadius: theme.radii.card,
        backgroundColor: selected ? theme.colors.background : 'transparent',
        // Dimmed, not hidden. The strip is a calendar and must not skip dates.
        opacity: empty && !selected ? 0.42 : pressed ? 0.7 : 1,
      }]}
    >
      <Text
        variant="label"
        style={{ color: selected ? theme.colors.accentInk : theme.colors.textInverse, opacity: selected ? 1 : 0.8 }}
      >
        {day.weekdayLabel}
      </Text>
      {/* DM Sans, not the `numeral` role's Fraunces — see DAY_CELL. A date in a strip is a label
          you scan, not a figure you read; the serif is kept for the month above, where it is one
          phrase and does the editorial work on its own. */}
      <Text
        variant="heading"
        style={{ color: selected ? theme.colors.accentInk : theme.colors.textInverse }}
      >
        {day.dayOfMonth}
      </Text>
    </Pressable>
  );
}

/**
 * How wide the right-hand action column is allowed to get.
 *
 * A cap, not a width — the column shrinks to its content and simply cannot take more than this.
 * Without it a long label in that column starves the class name: "Included · 10-class Package"
 * rendered at numeral size took nearly the whole row and squeezed "STUDIO Beginner BASIC Ballet"
 * into a single character per line, top to bottom (reported on device 2026-08-14). Coverage now
 * lives in the main column where it belongs, and this stops any future label doing the same thing.
 */
const ACTION_COLUMN_MAX = 96;

/**
 * One class.
 *
 * ── Three tap targets, each labelled ───────────────────────────────────────────────────────────
 * The row body and the "Details" link both open class detail — the same destination, so there is
 * no mis-tap to make. **Book** is its own separated control on the right, and it is the only thing
 * on the row that changes state. That separation is the platform's foolproof rule: two different
 * actions must never share one hit area, especially on a phone held one-handed.
 *
 * "Details" is spelled out rather than left as a bare chevron. An unlabelled glyph is a quiz, and
 * this row already earns its keep without one.
 *
 * ── Book is a toggle, and it says which way it is pointing ────────────────────────────────────
 * Tapping Book adds the class to the cart; the button then reads **"Added"** and tapping it again
 * takes it out. Every add has a visible undo in the place the add happened — no going to another
 * screen to remove something you did not mean to put there.
 *
 * ── Coverage is a fact about the CLASS, not a figure in the price column ──────────────────────
 * "Included · 10-class Package" used to render where "$39" goes, at the same size, because both
 * came out of `entry.price`. They are not the same kind of thing: one is a number you scan down
 * the right edge, the other is a sentence about the client's own account. It reads beneath the
 * class name now, in the accent, and the right column is left to the price and the button.
 *
 * ── A class you are already in says so, before you tap Book ───────────────────────────────────
 * Booking a second spot is legitimate — for a friend, a partner, a child — so this is stated, not
 * prevented. Finding out at checkout, from a refusal, is the dead end this replaces.
 */
function ClassRow({
  entry,
  inCart,
  bookedSpots,
  onPress,
  onBook,
}: {
  entry: ScheduleEntry;
  inCart: boolean;
  /** Live spots this client already holds in this class. 0 for most rows. */
  bookedSpots: number;
  onPress: () => void;
  onBook?: () => void;
}) {
  const theme = useTheme();

  const capacityNote =
    entry.spotsLeft !== null && entry.spotsLeft <= SPOTS_LEFT_THRESHOLD && !entry.isFull
      ? `${entry.spotsLeft} spot${entry.spotsLeft === 1 ? '' : 's'} left`
      : null;

  const coveredLabel = entry.price.kind === 'covered' ? entry.price.label : null;
  const amountLabel = entry.price.kind === 'amount' ? entry.price.amountLabel : null;
  const bookedLabel = bookedSpotsLabel(bookedSpots);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[
        formatStoredTime(entry.startsAt),
        entry.name,
        bookedLabel,
        coveredLabel,
        'Details',
      ]
        .filter(Boolean)
        .join('. ')}
      onPress={onPress}
      style={({ pressed }) => [{
        // TOP-aligned. See rule 3 in the header.
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.base,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        backgroundColor: pressed ? theme.colors.surface : theme.colors.background,
      }]}
    >
      <View style={{ width: TIME_RAIL, flexShrink: 0 }}>
        {/* Stored wall-clock, printed verbatim — never device-converted. */}
        <Text variant="numeral" numberOfLines={1} style={{ fontSize: TIME_SIZE, lineHeight: 22 }}>
          {formatStoredTime(entry.startsAt)}
        </Text>
        {entry.durationMinutes ? (
          <Text variant="caption" color="tertiary" style={{ marginTop: 3 }}>
            {entry.durationMinutes} min
          </Text>
        ) : null}
      </View>

      {/* `minWidth: 0` is load-bearing: a flex child defaults to `min-width: auto` and refuses to
          shrink below its content, so without it a long class name pushes the action column off
          the row instead of wrapping. */}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="heading">{entry.name}</Text>
        {entry.instructor ? (
          <Text variant="caption" color="tertiary" style={{ marginTop: 3 }}>
            {entry.instructor}
          </Text>
        ) : null}

        {/* Good news, in the studio's colour, on its own line. Two lines at most — a studio can
            name a package anything, and this must wrap rather than push the row around. */}
        {coveredLabel ? (
          <Text variant="caption" color="accent" numberOfLines={2} style={{ marginTop: 3 }}>
            {coveredLabel}
          </Text>
        ) : null}

        {capacityNote ? (
          <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
            {capacityNote}
          </Text>
        ) : null}

        {bookedLabel ? (
          <View style={{ alignSelf: 'flex-start', marginTop: theme.spacing.sm }}>
            <StatusTag label={bookedLabel} tone="success" />
          </View>
        ) : null}

        {/* Its own hit area, inset from the row's, so a thumb aiming here cannot land on Book. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Details for ${entry.name}`}
          onPress={onPress}
          hitSlop={{ top: 6, bottom: 6, left: 4, right: 8 }}
          style={({ pressed }) => [{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            gap: 2,
            marginTop: theme.spacing.sm,
            opacity: pressed ? 0.55 : 1,
          }]}
        >
          <Text variant="caption" color="secondary">
            Details
          </Text>
          <Icon name="forward" size={13} color={theme.colors.textTertiary} />
        </Pressable>
      </View>

      {/* Price above the action, right-aligned — the widget's own composition, and the reason it
          works is that the eye reads down the right edge: what it costs, then how to get it.
          Capped, and `flexShrink: 0` so it keeps its own content rather than being crushed by a
          long class name from the other direction. */}
      <View
        style={{
          alignItems: 'flex-end',
          gap: theme.spacing.sm,
          maxWidth: ACTION_COLUMN_MAX,
          flexShrink: 0,
        }}
      >
        {amountLabel ? (
          <Text variant="numeral" numberOfLines={1} style={{ fontSize: TIME_SIZE, lineHeight: 22 }}>
            {amountLabel}
          </Text>
        ) : null}

        {/* A full class gets a STATUS, never a button.
            A disabled control labelled "Waitlist" implies a waitlist you could join if only you
            tapped harder, and there is no waitlist flow in the app — so the row states the fact
            and stops. Saying nothing at all would be worse: the client would be left wondering
            why this row alone has no way to book. */}
        {entry.isFull ? (
          <StatusTag label={entry.hasWaitlist ? 'Waitlist only' : 'Full'} tone="neutral" />
        ) : onBook ? (
          <Button
            // "Book again" on a class they already hold a spot in, so the button says what it will
            // do rather than looking like the app forgot. It is NOT disabled — a second spot is a
            // real thing people book.
            label={inCart ? 'Added' : bookedSpots > 0 ? 'Book again' : 'Book'}
            // `secondary` once added: the neutral border retires the studio's colour from a row
            // whose decision has already been made, so the accent stays on the rows still asking.
            variant={inCart ? 'secondary' : 'accentOutline'}
            size="compact"
            fullWidth={false}
            onPress={onBook}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

export interface ScheduleScreenProps {
  days: ScheduleDay[];
  /** Which day is showing. Held by the route so it survives a trip into class detail. */
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  studioName: string;
  showInstructor: boolean;
  currency?: string;
  /**
   * The client's usable passes. Rows a pass covers read "Included · {pass}" instead of a price.
   *
   * Undefined for a guest and while the wallet resolves — NOT `[]`, which would be a claim that
   * they hold nothing.
   */
  passes?: Pass[];
  isLoading?: boolean;
  error?: unknown;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onOpenClass: (eventId: number) => void;
  /**
   * Add this class to the cart, or take it back out — the row's button is a toggle.
   *
   * Absent only when booking is impossible at all (an offboarded studio), and while it is absent
   * no row shows a Book button that does nothing.
   */
  onBookClass?: (eventId: number) => void;
  /** Which classes are already in the cart. Drives the Added state on each row. */
  cartEventIds?: readonly number[];
  /**
   * Spots the client already holds, by event id.
   *
   * Omitted for a guest and while the bookings query resolves — and, as with `passes`, that is
   * why it is optional rather than defaulting to an empty map. An empty map is the claim "we
   * asked, and you are in none of these"; `undefined` is "we have not asked". Both render the
   * same absence of a badge, but only one of them would be a lie if it were wrong.
   */
  bookedCounts?: BookedCounts;
  onBack: () => void;
  /** The sticky bar's destination. Absent → no bar, whatever is in the cart. */
  onOpenCart?: () => void;
  /** Rendered by the caller from `useCart`, so the bar and checkout quote the same figures. */
  cartSummary?: {
    chargeableCount: number;
    coveredCount: number;
    blockedCount: number;
    totalLabel: string;
  };
}

export function ScheduleScreen({
  days,
  selectedDate,
  onSelectDate,
  studioName,
  showInstructor,
  currency,
  passes,
  isLoading,
  error,
  isRefreshing = false,
  onRefresh,
  onOpenClass,
  onBookClass,
  cartEventIds,
  bookedCounts,
  onBack,
  onOpenCart,
  cartSummary,
}: ScheduleScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const stripRef = useRef<ScrollView>(null);

  // A Set, so a 20-class day is 20 O(1) lookups rather than 20 array scans.
  const inCart = useMemo(() => new Set(cartEventIds ?? []), [cartEventIds]);

  const showCartBar = Boolean(
    onOpenCart &&
      cartSummary &&
      cartSummary.chargeableCount + cartSummary.coveredCount + cartSummary.blockedCount > 0,
  );

  // Fall back to the first day that HAS something rather than to a fixed index: the selected date
  // can be a day that has since emptied out, and an unmatched selection would render an empty list
  // under a strip where nothing looks selected.
  const active = useMemo(
    () => days.find((day) => day.date === selectedDate) ?? days.find((d) => d.events.length > 0) ?? days[0] ?? null,
    [days, selectedDate],
  );

  const entries = useMemo(
    () =>
      (active?.events ?? []).map((event) =>
        toScheduleEntry(event, { showInstructor, currency, passes }),
      ),
    [active, showInstructor, currency, passes],
  );

  const monthLabel = useMemo(() => monthLabelFor(days, active?.date ?? null), [days, active?.date]);

  // Keep the selected chip in view when the screen opens on a day that is not the first. Measured
  // in DAY_CELL, not a repeated literal — a second copy of the cell width silently mis-scrolls the
  // strip the moment the first one changes, which is exactly what happened at 52.
  const activeIndex = active ? days.indexOf(active) : 0;
  useEffect(() => {
    if (activeIndex > 2) stripRef.current?.scrollTo({ x: (activeIndex - 2) * DAY_CELL, animated: false });
  }, [activeIndex]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* THE ACCENT BLOCK — month and strip together, so the strip has somewhere to live. */}
      <View style={{ backgroundColor: theme.colors.accentFill, paddingTop: insets.top + theme.spacing.sm }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.base,
            paddingBottom: theme.spacing.sm,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Back to ${studioName}`}
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => [{ padding: theme.spacing.xs, opacity: pressed ? 0.55 : 1 }]}
          >
            <Icon name="back" size={20} color={theme.colors.onAccent} />
          </Pressable>

          <Text variant="title" style={{ fontSize: 17, color: theme.colors.onAccent }}>
            {monthLabel || 'Schedule'}
          </Text>

          {/* A spacer, so the month stays optically centred rather than drifting right.
              There is deliberately NO cart icon here: the sticky bar at the foot of the screen is
              the cart's one affordance. Two ways into the same thing, one of them a bare glyph in
              a corner, is how a client ends up unsure whether they are the same thing. */}
          <View style={{ width: 20 + theme.spacing.xs * 2 }} />
        </View>

        {days.length > 0 ? (
          <ScrollView
            ref={stripRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            // A horizontal ScrollView inside a flex COLUMN has no intrinsic height, so it stretches
            // to fill whatever is left — on device that was a ~400px void under the strip.
            style={{ flexGrow: 0, flexShrink: 0 }}
            contentContainerStyle={{
              // Aligns the first day with the back chevron above it, and keeps the selected tab
              // off the screen edge — at 8 it read as clipped rather than as the first item.
              paddingHorizontal: theme.spacing.md,
              paddingBottom: theme.spacing.base,
            }}
          >
            {days.map((day) => (
              <View key={day.date} style={{ width: DAY_CELL }}>
                <DayChip
                  day={day}
                  selected={day.date === active?.date}
                  onPress={() => onSelectDate(day.date)}
                />
              </View>
            ))}
          </ScrollView>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{
          // Clears the sticky bar when it is up. Without this the last class of the day sits
          // underneath it and cannot be scrolled to — a row you can see but never reach.
          paddingBottom: insets.bottom + (showCartBar ? CART_BAR_CLEARANCE : theme.spacing.xxl),
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.textSecondary}
            />
          ) : undefined
        }
      >
        {isLoading ? (
          <View style={{ padding: theme.spacing.lg }}>
            <SkeletonList count={5} />
          </View>
        ) : error && days.length === 0 ? (
          <ErrorState
            message={describeApiError(error)}
            retriable={!(error instanceof ApiError) || error.retriable}
            onRetry={onRefresh}
          />
        ) : days.length === 0 ? (
          <EmptyState
            title="Nothing on the schedule."
            body={`${studioName} has not posted its next sessions yet.`}
          />
        ) : entries.length === 0 ? (
          // A dimmed day the client tapped. Answering plainly is the point of leaving it tappable.
          <EmptyState
            title="Nothing scheduled."
            body={`${studioName} has no classes on ${active?.longLabel ?? 'this day'}.`}
          />
        ) : (
          <>
            <View
              style={{
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.base,
                paddingBottom: theme.spacing.sm,
              }}
            >
              <Text variant="label" color="tertiary" uppercase>
                {active?.longLabel}
              </Text>
            </View>
            {entries.map((entry) => (
              <ClassRow
                key={entry.eventId}
                entry={entry}
                inCart={inCart.has(entry.eventId)}
                bookedSpots={bookedSpotsFor(bookedCounts, entry.eventId)}
                onPress={() => onOpenClass(entry.eventId)}
                onBook={onBookClass ? () => onBookClass(entry.eventId) : undefined}
              />
            ))}
          </>
        )}
      </ScrollView>

      {showCartBar && cartSummary && onOpenCart ? (
        <CartBar
          chargeableCount={cartSummary.chargeableCount}
          coveredCount={cartSummary.coveredCount}
          blockedCount={cartSummary.blockedCount}
          totalLabel={cartSummary.totalLabel}
          onPress={onOpenCart}
        />
      ) : null}
    </View>
  );
}

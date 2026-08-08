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
import { Button, EmptyState, ErrorState, Icon, SkeletonList, Text } from '@/components';
import { monthLabelFor, type ScheduleDay } from '@/domain/schedule/days';
import { toScheduleEntry } from '@/domain/schedule/entry';
import type { ScheduleEntry } from '@/domain/schedule/types';
import { formatStoredTime } from '@/domain/time/studio-now';
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
        gap: 2,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radii.pill,
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
      <Text
        variant="numeral"
        style={{ color: selected ? theme.colors.accentInk : theme.colors.textInverse }}
      >
        {day.dayOfMonth}
      </Text>
    </Pressable>
  );
}

function ClassRow({
  entry,
  onPress,
  onBook,
}: {
  entry: ScheduleEntry;
  onPress: () => void;
  onBook?: () => void;
}) {
  const theme = useTheme();

  const capacityNote =
    entry.spotsLeft !== null && entry.spotsLeft <= SPOTS_LEFT_THRESHOLD && !entry.isFull
      ? `${entry.spotsLeft} spot${entry.spotsLeft === 1 ? '' : 's'} left`
      : null;

  const priceNote =
    entry.price.kind === 'covered'
      ? entry.price.label
      : entry.price.kind === 'amount'
        ? entry.price.amountLabel
        : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${formatStoredTime(entry.startsAt)} ${entry.name}`}
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
      <View style={{ width: TIME_RAIL }}>
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

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="heading">{entry.name}</Text>
        {entry.instructor ? (
          <Text variant="caption" color="tertiary" style={{ marginTop: 3 }}>
            {entry.instructor}
          </Text>
        ) : null}
        {priceNote || capacityNote ? (
          <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
            {[priceNote, capacityNote].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>

      {/* One tap, not two. The action is always in the same place on every row. */}
      {onBook ? (
        <Button
          label={entry.isFull ? (entry.hasWaitlist ? 'Waitlist' : 'Full') : 'Book'}
          variant={entry.isFull ? 'secondary' : entry.price.kind === 'covered' ? 'secondary' : 'primary'}
          size="compact"
          fullWidth={false}
          disabled={entry.isFull && !entry.hasWaitlist}
          onPress={onBook}
        />
      ) : null}
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
  isLoading?: boolean;
  error?: unknown;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onOpenClass: (eventId: number) => void;
  /** Absent until P3 — and while it is absent, no row shows a Book button that does nothing. */
  onBookClass?: (eventId: number) => void;
  onBack: () => void;
  onOpenCart?: () => void;
}

export function ScheduleScreen({
  days,
  selectedDate,
  onSelectDate,
  studioName,
  showInstructor,
  currency,
  isLoading,
  error,
  isRefreshing = false,
  onRefresh,
  onOpenClass,
  onBookClass,
  onBack,
  onOpenCart,
}: ScheduleScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const stripRef = useRef<ScrollView>(null);

  // Fall back to the first day that HAS something rather than to a fixed index: the selected date
  // can be a day that has since emptied out, and an unmatched selection would render an empty list
  // under a strip where nothing looks selected.
  const active = useMemo(
    () => days.find((day) => day.date === selectedDate) ?? days.find((d) => d.events.length > 0) ?? days[0] ?? null,
    [days, selectedDate],
  );

  const entries = useMemo(
    () => (active?.events ?? []).map((event) => toScheduleEntry(event, { showInstructor, currency })),
    [active, showInstructor, currency],
  );

  const monthLabel = useMemo(() => monthLabelFor(days, active?.date ?? null), [days, active?.date]);

  // Keep the selected chip in view when the screen opens on a day that is not the first.
  const activeIndex = active ? days.indexOf(active) : 0;
  useEffect(() => {
    if (activeIndex > 3) stripRef.current?.scrollTo({ x: (activeIndex - 3) * 52, animated: false });
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

          {/* A spacer of the same width when there is no cart, so the month stays optically
              centred rather than drifting right. */}
          {onOpenCart ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cart"
              onPress={onOpenCart}
              hitSlop={12}
              style={({ pressed }) => [{ padding: theme.spacing.xs, opacity: pressed ? 0.55 : 1 }]}
            >
              <Icon name="cart" size={20} color={theme.colors.onAccent} />
            </Pressable>
          ) : (
            <View style={{ width: 20 + theme.spacing.xs * 2 }} />
          )}
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
              paddingHorizontal: theme.spacing.sm,
              paddingBottom: theme.spacing.md,
            }}
          >
            {days.map((day) => (
              <View key={day.date} style={{ width: 52 }}>
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
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spacing.xxl }}
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
                onPress={() => onOpenClass(entry.eventId)}
                onBook={onBookClass ? () => onBookClass(entry.eventId) : undefined}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

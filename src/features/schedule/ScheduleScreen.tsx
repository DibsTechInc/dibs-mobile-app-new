/**
 * The full class schedule. Reference mock: `design/mockups/booking-and-account.html` step 1.
 *
 * A day strip across the top, then that day's classes. The strip only ever offers days that have
 * something left on them — a strip entry leading to an empty list is a tap that goes nowhere, and
 * the studio's honest answer to "what about Sunday" is that there is nothing on Sunday.
 *
 * Presentational: every action is a prop, and the data is already in view-model shape.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, describeApiError } from '@/api/errors';
import { Card, EmptyState, ErrorState, SkeletonList, StatusTag, Text } from '@/components';
import type { ScheduleDay } from '@/domain/schedule/days';
import { toScheduleEntry } from '@/domain/schedule/entry';
import type { ScheduleEntry } from '@/domain/schedule/types';
import { formatStoredTime } from '@/domain/time/studio-now';
import { useTheme } from '@/theme/ThemeProvider';

/** Capacity only becomes news at three or fewer. Above that, silence is more honest. */
const SPOTS_LEFT_THRESHOLD = 3;

function capacityTag(entry: ScheduleEntry) {
  if (entry.isFull) {
    return <StatusTag label={entry.hasWaitlist ? 'Waitlist' : 'Full'} tone="danger" />;
  }
  if (entry.spotsLeft !== null && entry.spotsLeft <= SPOTS_LEFT_THRESHOLD) {
    return <StatusTag label={`${entry.spotsLeft} spot${entry.spotsLeft === 1 ? '' : 's'} left`} tone="accent" />;
  }
  return null;
}

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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={day.longLabel}
      onPress={onPress}
      style={({ pressed }) => ({
        minWidth: 52,
        minHeight: theme.minTapTarget,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm + 2,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.radii.card,
        borderWidth: selected ? 0 : 1,
        borderColor: theme.colors.border,
        backgroundColor: selected
          ? theme.colors.accentFill
          : pressed
            ? theme.colors.surface
            : theme.colors.background,
      })}
    >
      <Text variant="label" color={selected ? 'onAccent' : 'tertiary'}>
        {day.weekdayLabel}
      </Text>
      <Text variant="numeral" color={selected ? 'onAccent' : 'primary'}>
        {day.dayOfMonth}
      </Text>
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
  onBack: () => void;
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
  onBack,
}: ScheduleScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const stripRef = useRef<ScrollView>(null);

  // Fall back to the first day that HAS something rather than to a fixed index: the selected
  // date can be a day that has since emptied out, and an unmatched selection would render an
  // empty list under a strip where nothing looks selected.
  const active = useMemo(
    () => days.find((day) => day.date === selectedDate) ?? days[0] ?? null,
    [days, selectedDate],
  );

  const entries = useMemo(
    () => (active?.events ?? []).map((event) => toScheduleEntry(event, { showInstructor, currency })),
    [active, showInstructor, currency],
  );

  // Keep the selected chip in view when the screen opens on a day that is not the first one.
  const activeIndex = active ? days.indexOf(active) : 0;
  useEffect(() => {
    if (activeIndex > 2) stripRef.current?.scrollTo({ x: (activeIndex - 2) * 60, animated: false });
  }, [activeIndex]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
        <Text
          variant="caption"
          color="accent"
          onPress={onBack}
          accessibilityRole="button"
          style={{ paddingVertical: theme.spacing.md }}
        >
          ← {studioName}
        </Text>
        <Text variant="display" style={{ marginBottom: theme.spacing.base }}>
          Schedule
        </Text>
      </View>

      {days.length > 0 ? (
        <ScrollView
          ref={stripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          // A horizontal ScrollView inside a flex COLUMN has no intrinsic height, so it stretches
          // to fill whatever is left — on device that was a ~400px void between the day strip and
          // the first class. `flexGrow: 0` makes it take only its content's height.
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            gap: theme.spacing.sm,
            paddingBottom: theme.spacing.base,
          }}
        >
          {days.map((day) => (
            <DayChip
              key={day.date}
              day={day}
              selected={day.date === active?.date}
              onPress={() => onSelectDate(day.date)}
            />
          ))}
        </ScrollView>
      ) : null}

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          paddingBottom: insets.bottom + theme.spacing.xxl,
          gap: theme.spacing.md,
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
          <SkeletonList count={5} />
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
        ) : (
          <>
            <Text variant="label" color="tertiary" uppercase style={{ marginBottom: theme.spacing.xs }}>
              {active?.longLabel}
            </Text>
            {entries.map((entry) => (
              <Card
                key={entry.eventId}
                onPress={() => onOpenClass(entry.eventId)}
                accessibilityLabel={`${formatStoredTime(entry.startsAt)} ${entry.name}`}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
                  <View style={{ gap: theme.spacing.xs, flexShrink: 1 }}>
                    {/* Stored wall-clock, printed verbatim — never device-converted. */}
                    <Text variant="numeral">{formatStoredTime(entry.startsAt)}</Text>
                    <Text variant="heading">{entry.name}</Text>
                    <Text variant="secondary" color="secondary">
                      {[entry.instructor, entry.durationMinutes && `${entry.durationMinutes} min`]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: theme.spacing.xs }}>
                    {capacityTag(entry)}
                    {entry.price.kind === 'amount' ? (
                      <Text variant="secondary" color="secondary">
                        {entry.price.amountLabel}
                      </Text>
                    ) : entry.price.kind === 'covered' ? (
                      <Text variant="secondary" color="secondary">
                        {entry.price.label}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Step 3 — pick the date and time.
 *
 * The accent block holds the month and the day strip, exactly like the class schedule — same
 * DAY_CELL, same tab language — so the two booking surfaces read as one product. Two structural
 * differences from the schedule, both forced by the endpoint's shape:
 *
 *  • Availability is fetched PER DAY, so the strip cannot dim empty days (nothing knows a day is
 *    empty until it is asked). Every day is a plain calendar cell.
 *  • A day change shows the skeleton rather than the previous grid — a slot chip that outlives
 *    a date change is a tap away from booking the wrong day (`useAvailability` enforces this at
 *    the cache too).
 *
 * At a monthlyCommitment studio, a selected slot reveals the Single / Lock-in-monthly toggle.
 * It sits ABOVE the footer because it changes the footer's own total — the one figure a client
 * must never watch flicker after committing.
 */
import { router } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';

import { ApiError, describeApiError } from '@/api/errors';
import type { AvailabilitySlot } from '@/api/schemas/appointments';
import { Button, EmptyState, ErrorState, SkeletonList, Text } from '@/components';
import { priceMonthlyCommitment, priceSingleSession } from '@/domain/appointments/pricing';
import { remainingWeeklyDatesInMonth } from '@/domain/appointments/recurring';
import { bookableDays, groupSlotsByDaypart, type BookableDay } from '@/domain/appointments/slots';
import { formatPrice } from '@/domain/money/format';
import { formatStoredTime } from '@/domain/time/studio-now';
import { studio } from '@/config/studio';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { useTheme } from '@/theme/ThemeProvider';

import { useAppointmentDraft, type CommitmentKind } from './appointmentDraft';
import { FlowFooter, FlowHeader, SummaryBand } from './FlowChrome';
import { useAppointmentTypes, useAvailability } from './useAppointmentData';

/** Shared with the schedule strip — the two must feel like one control. */
const DAY_CELL = 68;
const FOOTER_CLEARANCE = 148;

function DayChip({
  day,
  selected,
  onPress,
}: {
  day: BookableDay;
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
      style={({ pressed }) => [{
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        paddingVertical: theme.spacing.sm,
        marginHorizontal: theme.spacing.xs,
        borderRadius: theme.radii.card,
        backgroundColor: selected ? theme.colors.background : 'transparent',
        opacity: pressed && !selected ? 0.7 : 1,
      }]}
    >
      {/* `onAccent`, never textInverse: on a light accent (IGTS blue) the readable ink on the
          accent block is DARK, and white weekday labels vanish at ~2.4:1. */}
      <Text
        variant="label"
        style={{
          color: selected ? theme.colors.accentInk : theme.colors.onAccent,
          opacity: selected ? 1 : 0.8,
        }}
      >
        {day.weekdayLabel}
      </Text>
      <Text
        variant="heading"
        style={{ color: selected ? theme.colors.accentInk : theme.colors.onAccent }}
      >
        {day.dayOfMonth}
      </Text>
    </Pressable>
  );
}

function SlotChip({
  slot,
  selected,
  onPress,
}: {
  slot: AvailabilitySlot;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const label = formatStoredTime(slot.start_time);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [{
        flexGrow: 1,
        flexBasis: '30%',
        minHeight: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.radii.button,
        borderWidth: 1,
        borderColor: selected ? theme.colors.accentFill : theme.colors.border,
        backgroundColor: selected
          ? theme.colors.accentFill
          : pressed
            ? theme.colors.accentWash
            : theme.colors.background,
      }]}
    >
      <Text
        variant="bodyMedium"
        style={{ color: selected ? theme.colors.onAccent : theme.colors.text }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** 'America/New_York' → 'ET', for the "Times are the studio's" note. Empty when unknowable. */
function zoneAbbreviation(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    }).formatToParts(new Date());
    return parts.find((part) => part.type === 'timeZoneName')?.value ?? '';
  } catch {
    return '';
  }
}

function CommitmentToggle({
  commitment,
  onChange,
  caption,
}: {
  commitment: CommitmentKind;
  onChange: (next: CommitmentKind) => void;
  caption: string | null;
}) {
  const theme = useTheme();

  const options: { key: CommitmentKind; label: string }[] = [
    { key: 'single', label: 'Single session' },
    { key: 'monthly', label: 'Lock in monthly' },
  ];

  return (
    <View style={{ paddingHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg }}>
      <View
        style={{
          flexDirection: 'row',
          gap: theme.spacing.xs,
          padding: 3,
          borderRadius: theme.radii.pill,
          backgroundColor: theme.colors.surface,
        }}
      >
        {options.map((option) => {
          const active = option.key === commitment;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label}
              onPress={() => onChange(option.key)}
              style={({ pressed }) => [{
                flex: 1,
                minHeight: 38,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: theme.radii.pill,
                borderWidth: active ? 1 : 0,
                borderColor: theme.colors.accentBorder,
                backgroundColor: active ? theme.colors.background : 'transparent',
                opacity: pressed && !active ? 0.7 : 1,
              }]}
            >
              <Text
                variant="secondary"
                style={{
                  color: active ? theme.colors.accentInk : theme.colors.textSecondary,
                  fontWeight: active ? '600' : '500',
                }}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {caption ? (
        <Text variant="caption" color="secondary" style={{ marginTop: theme.spacing.sm }}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

export function SlotsScreen() {
  const theme = useTheme();
  const { config, timeZone } = useStudioConfig();
  const types = useAppointmentTypes();
  const draft = useAppointmentDraft();
  const stripRef = useRef<ScrollView>(null);

  const days = useMemo(
    () => bookableDays(timeZone, config?.intervalEnd ?? 30),
    [timeZone, config?.intervalEnd],
  );

  // The route can be entered with no date yet — the strip's first day is the studio's today.
  const activeDate = draft.date ?? days[0]?.date ?? null;
  useEffect(() => {
    if (!draft.date && days[0]) draft.selectDate(days[0].date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  const availability = useAvailability({
    serviceId: draft.serviceId,
    providerId: draft.providerId,
    date: activeDate,
  });

  const service = useMemo(
    () => (types.data ?? []).find((type) => type.id === draft.serviceId) ?? null,
    [types.data, draft.serviceId],
  );

  /**
   * The chosen slot must exist in the CURRENT grid. A slot chosen before a refetch — or before a
   * date change round-tripped — is silently dropped rather than carried: the times on screen are
   * the only times that can be booked.
   */
  const slots = useMemo(() => availability.data ?? [], [availability.data]);
  const selectedSlot = useMemo(() => {
    if (!draft.slot) return null;
    return slots.find((slot) => slot.start_time === draft.slot?.start_time) ?? null;
  }, [slots, draft.slot]);

  const groups = useMemo(() => groupSlotsByDaypart(slots), [slots]);
  const activeDay = days.find((day) => day.date === activeDate) ?? null;

  const activeIndex = activeDay ? days.indexOf(activeDay) : 0;
  useEffect(() => {
    if (activeIndex > 2) stripRef.current?.scrollTo({ x: (activeIndex - 2) * DAY_CELL, animated: false });
  }, [activeIndex]);

  const taxRatePercent = config?.taxRate ?? config?.salesTaxRate ?? 0;
  const monthlyEnabled = studio.features.monthlyCommitment;

  const monthlySessionIsos = useMemo(
    () =>
      selectedSlot && draft.commitment === 'monthly'
        ? remainingWeeklyDatesInMonth(selectedSlot.start_time)
        : [],
    [selectedSlot, draft.commitment],
  );

  // The footer's figure. Monthly is the PRE-conflict estimate — checkout re-checks each date and
  // re-prices; a conflicted date can only make this number smaller.
  const footerTotal = useMemo(() => {
    if (!selectedSlot || typeof selectedSlot.priceAppt !== 'number') return null;
    if (draft.commitment === 'monthly') {
      return priceMonthlyCommitment({
        sessionCount: monthlySessionIsos.length,
        pricePerSession: selectedSlot.priceAppt,
        taxRatePercent,
      }).total;
    }
    return priceSingleSession({ priceDollars: selectedSlot.priceAppt, taxRatePercent }).total;
  }, [selectedSlot, draft.commitment, monthlySessionIsos.length, taxRatePercent]);

  const commitmentCaption = useMemo(() => {
    if (!selectedSlot) return null;
    if (draft.commitment !== 'monthly') return null;
    const weekday = formatStoredTime(selectedSlot.start_time, { weekday: 'long' });
    const month = formatStoredTime(selectedSlot.start_time, { month: 'long' });
    const n = monthlySessionIsos.length;
    return `Every ${weekday} at this time, renewing monthly. ${n} ${weekday}${n === 1 ? '' : 's'} left in ${month} — all booked today.`;
  }, [selectedSlot, draft.commitment, monthlySessionIsos.length]);

  const zoneNote = useMemo(() => {
    const abbreviation = zoneAbbreviation(timeZone);
    return abbreviation
      ? `Times are the studio’s — ${abbreviation}.`
      : 'Times are shown in the studio’s timezone.';
  }, [timeZone]);

  const summarySecondary = service
    ? [
        typeof service.length_minutes === 'number' ? `${service.length_minutes} min` : null,
        typeof selectedSlot?.priceAppt === 'number'
          ? formatPrice(selectedSlot.priceAppt)
          : typeof service.default_price === 'number' && service.default_price > 0
            ? formatPrice(service.default_price)
            : null,
      ]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <FlowHeader
        title={activeDay?.monthLabel || 'Choose a time'}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/book'))}
      >
        <ScrollView
          ref={stripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.md,
            paddingBottom: theme.spacing.base,
          }}
        >
          {days.map((day) => (
            <View key={day.date} style={{ width: DAY_CELL }}>
              <DayChip
                day={day}
                selected={day.date === activeDate}
                onPress={() => draft.selectDate(day.date)}
              />
            </View>
          ))}
        </ScrollView>
      </FlowHeader>

      {service ? (
        <SummaryBand
          primary={service.appointment_type ?? 'Your session'}
          secondary={summarySecondary}
          onEdit={() => router.replace('/book')}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={{
          paddingBottom: selectedSlot ? FOOTER_CLEARANCE : theme.spacing.xxl,
        }}
      >
        <View
          style={{
            paddingHorizontal: theme.spacing.lg,
            paddingTop: theme.spacing.base,
          }}
        >
          <Text variant="label" color="tertiary" uppercase>
            {activeDay?.longLabel ?? ''}
          </Text>
          <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
            {zoneNote}
          </Text>
        </View>

        {availability.isFetching ? (
          <View style={{ padding: theme.spacing.lg }}>
            <SkeletonList count={4} />
          </View>
        ) : availability.error ? (
          <ErrorState
            message={describeApiError(availability.error)}
            retriable={
              !(availability.error instanceof ApiError) || availability.error.retriable
            }
            onRetry={() => void availability.refetch()}
          />
        ) : groups.length === 0 ? (
          <EmptyState
            title={`Nothing open on ${activeDay?.longLabel ?? 'this day'}.`}
            body="Try another day in the strip above — the studio may have openings nearby."
          />
        ) : (
          groups.map((group) => (
            <View key={group.key} style={{ paddingHorizontal: theme.spacing.lg }}>
              <Text
                variant="label"
                color="tertiary"
                uppercase
                style={{ marginTop: theme.spacing.lg + 6, marginBottom: theme.spacing.sm }}
              >
                {group.label}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
                {group.slots.map((slot) => (
                  <SlotChip
                    key={slot.start_time}
                    slot={slot}
                    selected={selectedSlot?.start_time === slot.start_time}
                    onPress={() =>
                      draft.selectSlot(
                        selectedSlot?.start_time === slot.start_time ? null : slot,
                      )
                    }
                  />
                ))}
              </View>
            </View>
          ))
        )}

        {monthlyEnabled && selectedSlot ? (
          <CommitmentToggle
            commitment={draft.commitment}
            onChange={draft.setCommitment}
            caption={commitmentCaption}
          />
        ) : null}
      </ScrollView>

      {selectedSlot ? (
        <FlowFooter
          leftLabel={`${formatStoredTime(selectedSlot.start_time, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })} · ${formatStoredTime(selectedSlot.start_time)}${
            draft.commitment === 'monthly' ? ` · ${monthlySessionIsos.length} sessions` : ''
          }`}
          rightLabel={footerTotal !== null ? formatPrice(footerTotal) : null}
        >
          <Button
            label="Review"
            variant="primary"
            onPress={() => {
              // Re-snapshot from the LIVE grid, not the tap-time copy — a refetch between the
              // tap and Review may have re-priced the slot, and checkout must show the fresh one.
              draft.selectSlot(selectedSlot);
              router.push('/book/checkout');
            }}
          />
        </FlowFooter>
      ) : null}
    </View>
  );
}

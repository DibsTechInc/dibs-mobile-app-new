/**
 * My Calendar — the client's own bookings.
 *
 * ── It is the schedule, seen from the other side ────────────────────────────────────────────
 * Deliberately the SAME row shape as `ScheduleScreen`: a time rail on the left, the class and its
 * detail to the right, day headers between. Someone who books on the schedule and then checks what
 * they have booked is looking at the same objects, and a second visual language for them would be
 * two designs for one idea. Days are headed "Tomorrow" / "Fri, Aug 15" rather than dated, because
 * this is a list you plan around rather than one you scan by date.
 *
 * ── Past is a different question, so it looks different ─────────────────────────────────────
 * Upcoming answers "where do I have to be". Past answers "what have I done" — no time rail, no
 * day headers, one line per booking with the outcome stated. Cancelled bookings live here rather
 * than vanishing: a client who cancelled wants to see that it happened.
 *
 * There is no tab bar. A back chevron returns; the drawer moves sideways.
 */
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, describeApiError } from '@/api/errors';
import { Button, EmptyState, ErrorState, Icon, SkeletonList, StatusTag, Text } from '@/components';
import type { BookingDaySection, BookingListItem } from '@/domain/bookings/group-bookings';
import { useTheme } from '@/theme/ThemeProvider';

/** Matches ScheduleScreen's rail exactly — the two lists must line up. */
const TIME_RAIL = 84;
const TIME_SIZE = 17;

function SectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
      }}
    >
      <Text variant="label" color="tertiary" uppercase>
        {children}
      </Text>
    </View>
  );
}

function UpcomingRow({ booking }: { booking: BookingListItem }) {
  const theme = useTheme();

  return (
    <View
      style={{
        // TOP-aligned, like the schedule: the time stays level with the first line of the name
        // however far the name wraps.
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.base,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      <View style={{ width: TIME_RAIL }}>
        {/* Stored wall-clock, printed verbatim — never device-converted. */}
        <Text variant="numeral" numberOfLines={1} style={{ fontSize: TIME_SIZE, lineHeight: 22 }}>
          {booking.timeLabel}
        </Text>
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="heading">{booking.name}</Text>
        {booking.instructor ? (
          <Text variant="caption" color="tertiary" style={{ marginTop: 3 }}>
            {booking.instructor}
          </Text>
        ) : null}
        {/* Location and payment are the two things a booked client actually checks: where am I
            going, and did this use a class off my pack. Joined rather than stacked so the row
            stays one glance. */}
        {booking.locationLabel || booking.paidWithLabel ? (
          <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
            {[booking.locationLabel, booking.paidWithLabel].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function PastRow({ booking }: { booking: BookingListItem }) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text variant="body" color={booking.isCancelled ? 'tertiary' : 'primary'} numberOfLines={1}>
          {booking.name}
        </Text>
        <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
          {[booking.whenLabel, booking.timeLabel].filter(Boolean).join(' · ')}
        </Text>
      </View>

      {/* Only stated when there is something to state. "Booked" on every past row is noise. */}
      {booking.isCancelled ? (
        <StatusTag label="Cancelled" tone="neutral" />
      ) : booking.didAttend ? (
        <StatusTag label="Attended" tone="success" />
      ) : null}
    </View>
  );
}

export interface MyCalendarScreenProps {
  /** Upcoming bookings, already grouped by the studio's day. */
  sections: BookingDaySection[];
  past: BookingListItem[];
  studioName: string;
  /**
   * Signed out we have not looked, so we must not say "nothing booked" — that tells a client with
   * a full calendar that it is empty, and points the one available action at the wrong thing.
   */
  isSignedIn: boolean;
  isLoading?: boolean;
  error?: unknown;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onBack: () => void;
  /** The way out of an empty calendar. Without it the empty state is a dead end. */
  onBrowseClasses?: () => void;
  onOpenMenu?: () => void;
}

export function MyCalendarScreen({
  sections,
  past,
  studioName,
  isSignedIn,
  isLoading,
  error,
  isRefreshing = false,
  onRefresh,
  onBack,
  onBrowseClasses,
  onOpenMenu,
}: MyCalendarScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const hasNothing = sections.length === 0 && past.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.base,
          paddingTop: theme.spacing.sm,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Back to ${studioName}`}
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [{ padding: theme.spacing.xs, opacity: pressed ? 0.55 : 1 }]}
        >
          <Icon name="back" size={20} color={theme.colors.text} />
        </Pressable>

        {/* A spacer of the same width when there is no drawer, so the header stays balanced
            rather than letting the chevron drift into the middle. */}
        {onOpenMenu ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            onPress={onOpenMenu}
            hitSlop={12}
            style={({ pressed }) => [{ padding: theme.spacing.xs, opacity: pressed ? 0.55 : 1 }]}
          >
            <Icon name="menu" size={20} color={theme.colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 20 + theme.spacing.xs * 2 }} />
        )}
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
        <Text variant="display">My calendar</Text>
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
            <SkeletonList count={4} />
          </View>
        ) : error && hasNothing ? (
          <ErrorState
            message={describeApiError(error)}
            retriable={!(error instanceof ApiError) || error.retriable}
            onRetry={onRefresh}
          />
        ) : hasNothing ? (
          <EmptyState
            title={isSignedIn ? 'Nothing booked yet.' : 'Sign in to see your classes.'}
            body={
              isSignedIn
                ? `When you book a class at ${studioName}, it will show up here.`
                : `Your ${studioName} bookings live here once you are signed in.`
            }
            action={
              onBrowseClasses
                ? { label: isSignedIn ? 'Browse classes' : 'Sign in', onPress: onBrowseClasses }
                : undefined
            }
          />
        ) : (
          <>
            {sections.map((section) => (
              <View key={section.label}>
                <SectionLabel>{section.label}</SectionLabel>
                {section.bookings.map((booking) => (
                  <UpcomingRow key={`${booking.eventId}@${booking.startsAt}`} booking={booking} />
                ))}
              </View>
            ))}

            {/* "You have nothing coming up" is the single most useful thing this screen can say,
                and it is invisible unless it is said. Without this the client with history but no
                bookings sees an unheaded list of classes they have already been to and has to
                work out for themselves that none of them is in the future. */}
            {sections.length === 0 ? (
              <View
                style={{
                  paddingHorizontal: theme.spacing.lg,
                  paddingTop: theme.spacing.lg,
                  paddingBottom: theme.spacing.base,
                  gap: theme.spacing.md,
                }}
              >
                <Text variant="body" color="secondary">
                  Nothing coming up.
                </Text>
                {onBrowseClasses ? (
                  <Button label="Browse classes" variant="secondary" fullWidth={false} onPress={onBrowseClasses} />
                ) : null}
              </View>
            ) : null}

            {past.length > 0 ? (
              <>
                <SectionLabel>Past</SectionLabel>
                {past.map((booking) => (
                  <PastRow key={`${booking.eventId}@${booking.startsAt}`} booking={booking} />
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

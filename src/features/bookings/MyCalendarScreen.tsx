/**
 * My Calendar — the client's own bookings. Redesigned 2026-08-13 (Alicia: "it looks messy, it
 * needs to be more designed").
 *
 * ── What was wrong with the first version ──────────────────────────────────────────────────────
 * It was one undifferentiated scroll. Upcoming rows, then — with no warning and no break — past
 * rows in a DIFFERENT shape, so the list appeared to change its mind halfway down. Nothing on the
 * screen was bigger or more important than anything else, so the eye had nowhere to land, and the
 * single most useful fact ("you have a class tomorrow at noon") was buried in row one of a list
 * that looked exactly like row six. Beside the schedule screen — which opens with a solid accent
 * block — it read as a page nobody had finished.
 *
 * Three moves fix it, and each is a hierarchy decision rather than a decoration:
 *
 * **1. NEXT UP is a hero, not a row.** The next booking gets the accent field, the day named in
 *    words, and the time set as a Fraunces numeral — the "numeral as a moment" role the template
 *    reserves for exactly this. It is lifted OUT of the list rather than repeated in it
 *    (`splitNextUp`), because a hero above a list starting with the same booking reads as a bug.
 *
 * **2. Upcoming and Past are two views, not one scroll.** A segmented control at the top. They
 *    answer different questions — "where do I have to be" versus "what have I done" — and mixing
 *    them was what made the shape change mid-scroll. Now each view has one row shape, all the way
 *    down. The count rides on the tab, so orientation costs no reading.
 *
 * **3. Days are headed with a rule, not just an eyebrow.** A relative label ("Tomorrow") on the
 *    left and the date on the right, over a hairline. The eyebrow alone gave the list no
 *    structure; a stated date stops "Tomorrow" being the only thing anchoring a booking in time.
 *
 * The row anatomy still matches `ScheduleScreen` exactly — same 84pt time rail, same top
 * alignment. Someone who books on the schedule and then checks what they booked is looking at the
 * same objects, and a second visual language for them would be two designs for one idea.
 */
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, describeApiError } from '@/api/errors';
import { Button, EmptyState, ErrorState, Icon, Skeleton, StatusTag, Text } from '@/components';
import type { BookingDaySection, BookingListItem } from '@/domain/bookings/group-bookings';
import { formatStoredTime } from '@/domain/time/studio-now';
import { useTheme } from '@/theme/ThemeProvider';

/** Matches ScheduleScreen's rail exactly — the two lists must line up. */
const TIME_RAIL = 84;
const TIME_SIZE = 17;

export type CalendarTab = 'upcoming' | 'past';

/**
 * Upcoming / Past, with the counts on them.
 *
 * A segmented pair rather than two chips: these are two views of one thing and exactly one is
 * always active, which is what a segment means and what a chip does not. The accent wash marks
 * the active side — the accent is scarce, and the hero below already has the filled version.
 */
function Segments({
  tab,
  upcomingCount,
  pastCount,
  onSelect,
}: {
  tab: CalendarTab;
  upcomingCount: number;
  pastCount: number;
  onSelect: (tab: CalendarTab) => void;
}) {
  const theme = useTheme();

  const options: { key: CalendarTab; label: string }[] = [
    { key: 'upcoming', label: upcomingCount > 0 ? `Upcoming · ${upcomingCount}` : 'Upcoming' },
    { key: 'past', label: pastCount > 0 ? `Past · ${pastCount}` : 'Past' },
  ];

  return (
    <View
      style={{
        flexDirection: 'row',
        gap: theme.spacing.xs,
        padding: theme.spacing.xs,
        borderRadius: theme.radii.pill,
        backgroundColor: theme.colors.surface,
      }}
    >
      {options.map((option) => {
        const active = option.key === tab;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={option.label}
            onPress={() => onSelect(option.key)}
            style={({ pressed }) => [{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 36,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radii.pill,
              // The active segment lifts onto the page colour, so it reads as being in FRONT of
              // the track rather than as a differently-tinted part of it.
              backgroundColor: active
                ? theme.colors.background
                : pressed
                  ? theme.colors.background
                  : 'transparent',
              opacity: pressed && !active ? 0.7 : 1,
            }]}
          >
            <Text variant="label" color={active ? 'accent' : 'secondary'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/**
 * The next booking, given the room it earns.
 *
 * The day in words above, the time as the display numeral, the class under it. This is the one
 * accent field on the screen and the one place the type scale is allowed to shout — everything
 * below is a list, and a list with a hero above it is legible in a way a list alone is not.
 */
/**
 * The cancel affordance on a booking row.
 *
 * Labelled, never a bare icon — the foolproof-by-default rule. Absent entirely when the row has no
 * transaction id to cancel against, because a button that cannot work is worse than no button.
 */
function CancelAction({
  booking,
  onCancel,
  compact,
}: {
  booking: BookingListItem;
  onCancel?: (booking: BookingListItem) => void;
  compact?: boolean;
}) {
  const theme = useTheme();
  if (!onCancel || booking.dibsTransactionId === null) return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Cancel ${booking.name}`}
      onPress={() => onCancel(booking)}
      hitSlop={8}
      style={({ pressed }) => [{
        alignSelf: 'flex-start',
        marginTop: compact ? theme.spacing.xs : theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        paddingRight: theme.spacing.sm,
        opacity: pressed ? 0.55 : 1,
      }]}
    >
      <Text variant="label" color="secondary">
        Cancel booking
      </Text>
    </Pressable>
  );
}

function NextUpCard({
  booking,
  onCancel,
}: {
  booking: BookingListItem;
  onCancel?: (booking: BookingListItem) => void;
}) {
  const theme = useTheme();

  // "6:00" and "PM", split so the meridiem can be set smaller. Split from ONE formatted string:
  // `{ hour: 'numeric' }` alone renders "6 PM", so formatting twice puts the meridiem in twice.
  const [clock, meridiem = ''] = formatStoredTime(booking.startsAt, {
    hour: 'numeric',
    minute: '2-digit',
  }).split(/\s/);

  const detail = [
    booking.instructor && `with ${booking.instructor}`,
    booking.locationLabel,
  ].filter(Boolean);

  return (
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
        Next up · {booking.whenLabel}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: theme.spacing.sm }}>
        {/* Stored wall-clock, printed verbatim — never device-converted. */}
        <Text variant="hero" color="accent" style={{ fontSize: 48, lineHeight: 52 }}>
          {clock}
        </Text>
        {meridiem ? (
          <Text
            variant="title"
            color="accent"
            style={{ marginLeft: theme.spacing.sm, marginBottom: theme.spacing.sm }}
          >
            {meridiem}
          </Text>
        ) : null}
      </View>

      <Text variant="title" style={{ marginTop: theme.spacing.xs }}>
        {booking.name}
      </Text>

      {detail.length > 0 ? (
        <Text variant="secondary" color="secondary" style={{ marginTop: theme.spacing.xs }}>
          {detail.join(' · ')}
        </Text>
      ) : null}

      {/* What it drew on. A client checking their calendar is often really checking whether this
          one came off their pack. */}
      {booking.paidWithLabel ? (
        <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.sm }}>
          {booking.paidWithLabel}
        </Text>
      ) : null}

      <CancelAction booking={booking} onCancel={onCancel} />
    </View>
  );
}

/**
 * The loading state, in this screen's own shape.
 *
 * The generic `SkeletonList` here read as BROKEN, not as loading (Alicia, 2026-08-16): four
 * near-empty outlined cards that look nothing like what the screen becomes — no segments, no
 * hero, no time rail. A skeleton earns its keep by matching the eventual layout, so this one
 * mirrors the real anatomy: the segmented pill, the accent-washed NEXT UP field, and two rows
 * with the schedule's 84pt time rail. The sentence at the bottom is the explicit "something is
 * happening" signal — a first-ever load against a slow connection can sit here a while, and a
 * wireframe alone does not say whether anything is in flight.
 */
function CalendarSkeleton() {
  const theme = useTheme();

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        gap: theme.spacing.lg,
      }}
    >
      <Skeleton height={44} radius={theme.radii.pill} />

      <View
        style={{
          borderRadius: theme.radii.card,
          borderWidth: 1,
          borderColor: theme.colors.accentBorder,
          backgroundColor: theme.colors.accentWash,
          padding: theme.spacing.lg,
          gap: theme.spacing.md,
        }}
      >
        {/* Bars go to the page colour here: the default warm-grey surface tone muddies against
            the accent wash, and white is what the card's own type sits on when it arrives. */}
        <Skeleton width="40%" height={12} style={{ backgroundColor: theme.colors.background }} />
        <Skeleton
          width="55%"
          height={44}
          radius={theme.radii.card}
          style={{ backgroundColor: theme.colors.background }}
        />
        <Skeleton width="75%" height={18} style={{ backgroundColor: theme.colors.background }} />
      </View>

      {[0, 1].map((row) => (
        <View key={row} style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <View style={{ width: TIME_RAIL }}>
            <Skeleton width={56} height={16} />
          </View>
          <View style={{ flex: 1, gap: theme.spacing.sm }}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="45%" height={12} />
          </View>
        </View>
      ))}

      <Text variant="caption" color="tertiary" align="center">
        Loading your classes…
      </Text>
    </View>
  );
}

/** A relative label on the left, the date on the right, over a rule. */
function DayHeader({ section }: { section: BookingDaySection }) {
  const theme = useTheme();

  // 'Aug 19' from the stored wall-clock date, so it agrees with the studio's calendar rather than
  // the device's. `whenLabel` is relative ("Tomorrow") and cannot carry the date on its own.
  const dateLabel = formatStoredTime(`${section.bookings[0].startsAt.slice(0, 10)}T12:00:00.000Z`, {
    month: 'short',
    day: 'numeric',
  });

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        paddingBottom: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        marginBottom: theme.spacing.xs,
      }}
    >
      <Text variant="label" color="secondary" uppercase>
        {section.label}
      </Text>
      {/* Suppressed when the relative label already IS the date — "Fri, Aug 15 · Aug 15" is the
          same fact printed twice. */}
      {section.label.includes(dateLabel) ? null : (
        <Text variant="label" color="tertiary">
          {dateLabel}
        </Text>
      )}
    </View>
  );
}

function UpcomingRow({
  booking,
  onCancel,
}: {
  booking: BookingListItem;
  onCancel?: (booking: BookingListItem) => void;
}) {
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

        <CancelAction booking={booking} onCancel={onCancel} compact />
      </View>
    </View>
  );
}

/**
 * A past booking.
 *
 * Deliberately a different, denser shape from an upcoming one — no time rail, no day header, the
 * outcome stated on the right. Upcoming answers "where do I have to be"; past answers "what have I
 * done", and a list you scan by date does not need the same furniture as a list you plan around.
 * Now that the two live under separate tabs, the shape only ever changes when the client asks it
 * to.
 */
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
  /** The very next booking, lifted out of the sections by `splitNextUp`. */
  nextUp: BookingListItem | null;
  /** Everything after `nextUp`, still grouped by the studio's day. */
  sections: BookingDaySection[];
  /** How many upcoming bookings there are IN TOTAL, `nextUp` included. Drives the tab count. */
  upcomingCount: number;
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
  tab: CalendarTab;
  onSelectTab: (tab: CalendarTab) => void;
  onBack: () => void;
  /** The way out of an empty calendar. Without it the empty state is a dead end. */
  onBrowseClasses?: () => void;
  onOpenMenu?: () => void;
  /** Opens the confirm sheet. Omitted → no cancel affordance renders anywhere. */
  onCancelBooking?: (booking: BookingListItem) => void;
}

export function MyCalendarScreen({
  nextUp,
  sections,
  upcomingCount,
  past,
  studioName,
  isSignedIn,
  isLoading,
  error,
  isRefreshing = false,
  onRefresh,
  tab,
  onSelectTab,
  onBack,
  onBrowseClasses,
  onOpenMenu,
  onCancelBooking,
}: MyCalendarScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const hasNothing = upcomingCount === 0 && past.length === 0;

  /**
   * The tab that is actually rendered.
   *
   * `tab` is what the client last chose; this is what the data can honour. Sitting on Past when a
   * refetch empties it — the client cancelled their only past booking, or the endpoint answered
   * differently — would render an empty list under a hidden segmented control: a blank screen
   * with no visible way off it, which is a dead end even though nothing threw.
   *
   * Derived rather than corrected with a `setState` in an effect: the effect would render the
   * blank frame once before fixing it, and a state write during render is worse than either.
   */
  const activeTab: CalendarTab = tab === 'past' && past.length === 0 ? 'upcoming' : tab;

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
        {/* The studio's name under the title, quietly. It is the answer to "whose classes am I
            looking at" in an app that otherwise never repeats it after Home. */}
        <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.xs }}>
          {studioName}
        </Text>
      </View>

      {/* The segments only appear once there is a choice to make. A single-option control is a
          label pretending to be a switch. */}
      {!isLoading && !hasNothing && past.length > 0 ? (
        <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
          <Segments
            tab={activeTab}
            upcomingCount={upcomingCount}
            pastCount={past.length}
            onSelect={onSelectTab}
          />
        </View>
      ) : null}

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
          <CalendarSkeleton />
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
        ) : activeTab === 'past' ? (
          <View style={{ paddingTop: theme.spacing.md }}>
            {past.map((booking) => (
              <PastRow key={`${booking.eventId}@${booking.startsAt}`} booking={booking} />
            ))}
          </View>
        ) : upcomingCount === 0 ? (
          // History but nothing ahead. Its own state, and its own way forward — this is the most
          // useful thing the screen can say to somebody who used to come and has stopped, and it
          // is invisible unless it is said.
          <View
            style={{
              paddingHorizontal: theme.spacing.lg,
              paddingTop: theme.spacing.xl,
              gap: theme.spacing.md,
              alignItems: 'flex-start',
            }}
          >
            <Text variant="title">Nothing coming up.</Text>
            <Text variant="secondary" color="secondary">
              Book your next class at {studioName} and it will appear here.
            </Text>
            {onBrowseClasses ? (
              <View style={{ marginTop: theme.spacing.sm }}>
                <Button label="Browse classes" fullWidth={false} onPress={onBrowseClasses} />
              </View>
            ) : null}
          </View>
        ) : (
          <>
            {nextUp ? (
              <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg }}>
                <NextUpCard booking={nextUp} onCancel={onCancelBooking} />
              </View>
            ) : null}

            {sections.map((section) => (
              <View key={`${section.label}-${section.bookings[0].startsAt}`}>
                <DayHeader section={section} />
                {section.bookings.map((booking) => (
                  <UpcomingRow
                    key={`${booking.eventId}@${booking.startsAt}`}
                    booking={booking}
                    onCancel={onCancelBooking}
                  />
                ))}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Home — Option A, "The Cover" (approved by Alicia, 2026-08-05).
 *
 * The studio's photograph occupies the top ~43% of the screen with the greeting set over it in
 * Fraunces; underneath, the client's next class, then today's schedule. Reference mock:
 * `design/mockups/home-options.html#option-a`.
 *
 * Motion on open — a SEQUENCE, not a simultaneous arrival (Alicia, 2026-08-06):
 *   1. the hero settles from 1.08 → 1.0 over 900ms as it fades in — the photo comes to rest
 *      rather than popping in, which is what makes the splash feel like it resolved into Home;
 *   2. the greeting fades in over it at 160ms — it belongs to the cover;
 *   3. at 380ms everything BELOW the hero rises 36px as one piece over 460ms. The photograph
 *      gets a beat to itself first, which is rather the point of a composition called "The
 *      Cover"; before this the content arrived with it and the cover never had a moment;
 *   4. the hero then drifts between 1.0 and 1.045 on a 14s cycle — low enough amplitude that it
 *      is felt rather than watched. A photograph that visibly zooms is a screensaver.
 *
 * The whole sequence runs ONCE PER LAUNCH, not per mount — see `useAppOpenEntrance`. It also
 * collapses to nothing when the OS reduce-motion setting is on.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BookingUnavailableNotice,
  Card,
  EmptyState,
  ErrorState,
  SkeletonList,
  StatusTag,
  Text,
} from '@/components';
import { ApiError, describeApiError } from '@/api/errors';
import { FadeRise, HERO_BEAT, HeroSettle, useAppOpenEntrance } from '@/components/motion';
import type { HomeData } from '@/domain/home/build-home-data';
import type { ScheduleEntry } from '@/domain/schedule/types';
import { formatStoredTime } from '@/domain/time/studio-now';
import { useTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';

const HERO_HEIGHT = 360;

/** Capacity only becomes news at three or fewer. Above that, silence is more honest. */
const SPOTS_LEFT_THRESHOLD = 3;

function capacityTag(entry: ScheduleEntry) {
  if (entry.isFull) {
    return <StatusTag label={entry.hasWaitlist ? 'Waitlist' : 'Full'} tone="danger" />;
  }
  if (entry.spotsLeft !== null && entry.spotsLeft <= SPOTS_LEFT_THRESHOLD) {
    return <StatusTag label={`${entry.spotsLeft} spot${entry.spotsLeft === 1 ? '' : 's'} left`} tone="accent" />;
  }
  return <StatusTag label="Open" />;
}

function ClassRow({ entry, onPress }: { entry: ScheduleEntry; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Card onPress={onPress} accessibilityLabel={`${formatStoredTime(entry.startsAt)} ${entry.name}`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xs, flexShrink: 1 }}>
          {/* Stored wall-clock, printed verbatim — never device-converted. */}
          <Text variant="numeral">{formatStoredTime(entry.startsAt)}</Text>
          <Text variant="heading">{entry.name}</Text>
          <Text variant="secondary" color="secondary">
            {[entry.instructor && `with ${entry.instructor}`, entry.durationMinutes && `${entry.durationMinutes} min`]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: theme.spacing.xs }}>
          {capacityTag(entry)}
          {/* The price answers "what will this cost me" before the row is ever tapped. */}
          {entry.price.kind === 'covered' ? (
            <Text variant="caption" color="tertiary">
              {entry.price.label}
            </Text>
          ) : entry.price.kind === 'amount' ? (
            <Text variant="caption" color="tertiary">
              {entry.price.amountLabel}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

export interface HomeScreenProps {
  data: HomeData | null;
  /**
   * The studio's name from the BUILD config.
   *
   * Used before — or instead of — the live one. A branded app whose first launch has no
   * connection should still say whose app it is; it shipped knowing.
   */
  studioName: string;
  isLoading?: boolean;
  /** Set when the screen has nothing to show BECAUSE something failed, not merely no data. */
  error?: unknown;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onOpenClass: (eventId: number) => void;
  onSeeFullSchedule: () => void;
  /**
   * The one persistent affordance over the photo. Labelled "Sign in" for a guest and with the
   * client's own name once there is a session — an unlabelled avatar circle would be a quiz, and
   * an entry point that only exists when signed out leaves a signed-in client no way to sign out.
   */
  accountAction?: { label: string; onPress: () => void };
}

export function HomeScreen({
  data,
  studioName,
  isLoading,
  error,
  isRefreshing = false,
  onRefresh,
  onOpenClass,
  onSeeFullSchedule,
  accountAction,
}: HomeScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  /**
   * No photograph means no photograph TREATMENT.
   *
   * The scrim and the inverse text exist to hold white type on an image. Applied to the empty
   * surface wash — which is what renders before the studio's config arrives, and permanently for
   * a studio with no hero — they produce a grey smear with invisible white text on it. The
   * fallback is not a dimmer version of the photo treatment; it is the absence of one.
   */
  const hasPhoto = Boolean(data?.heroUri);
  const overPhoto = hasPhoto ? ('inverse' as const) : ('secondary' as const);

  /**
   * False on every mount after the first of this launch.
   *
   * Home remounts each time you come back from another screen, and pull-to-refresh re-renders
   * it. An entrance that replays on return stops reading as the app arriving and starts reading
   * as the app being slow.
   */
  const playEntrance = useAppOpenEntrance();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Hero. Overflow hidden so the drift scale never bleeds past the header. */}
      <View
        style={{
          height: HERO_HEIGHT,
          overflow: 'hidden',
          justifyContent: 'flex-end',
          backgroundColor: theme.colors.surface,
        }}
      >
        {hasPhoto ? (
          <HeroSettle
            animate={playEntrance}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT }}
          >
            <Image
              source={data?.heroUri ?? undefined}
              style={{ flex: 1, backgroundColor: theme.colors.surface }}
              contentFit="cover"
              contentPosition="center"
              transition={motion.slow}
              // The wash keeps the block from flashing white while the photo decodes. The studio's
              // bundled hero already covered the splash, so this gap is short.
              accessible={false}
            />
          </HeroSettle>
        ) : null}

        {/* The legibility scrims sit ABOVE the drifting photo and do NOT move with it — a
            gradient that scales with the image makes its edge crawl across the frame.

            TWO of them. The bottom ramp holds the greeting; the top one holds whatever sits in
            the safe area, which the bottom ramp never reaches. Without it the account action is
            white text on unmodified photo — invisible over a bright sky, and over Everyday
            Ballet's high-key dancer.

            Note for the design review: the bottom ramp works on Carlsbad's mid-tone studio shot
            and fights EB's dancer, where darkening reads as a mistake. If EB looks wrong on
            device, the fix is to put the greeting below the photo for that studio rather than to
            deepen the scrim. */}
        {hasPhoto ? (
          <>
            <LinearGradient
              colors={[theme.heroScrim.topFrom, theme.heroScrim.topTo]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: insets.top + theme.spacing.xxl + theme.spacing.lg,
              }}
              pointerEvents="none"
            />
            <LinearGradient
              colors={[theme.heroScrim.from, theme.heroScrim.to]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: HERO_HEIGHT * 0.62,
              }}
              pointerEvents="none"
            />
          </>
        ) : null}

        {/* Sits in the safe area at the top right, over the photo — the only thing above the
            greeting, and quiet enough not to compete with it. */}
        {accountAction ? (
          <FadeRise
            animate={playEntrance}
            delay={160}
            style={{
              position: 'absolute',
              top: insets.top + theme.spacing.sm,
              right: theme.spacing.lg,
            }}
          >
            <Text
              variant="label"
              color={overPhoto}
              uppercase
              onPress={accountAction.onPress}
              accessibilityRole="button"
              // Padded well past the label's own box: 44pt of tappable area, per the template's
              // minimum, without a visible control fighting the photograph.
              style={{
                opacity: hasPhoto ? 0.9 : 1,
                paddingVertical: theme.spacing.md,
                paddingLeft: theme.spacing.base,
              }}
            >
              {accountAction.label}
            </Text>
          </FadeRise>
        ) : null}

        {/* The greeting belongs to the cover, so it arrives WITH the photograph — a touch behind
            it, not in the wave that brings the schedule up. */}
        <FadeRise
          animate={playEntrance}
          delay={160}
          style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg }}
        >
          <Text
            variant="label"
            color={hasPhoto ? 'inverse' : 'tertiary'}
            uppercase
            style={{ opacity: hasPhoto ? 0.85 : 1, marginBottom: theme.spacing.xs }}
          >
            {/* The build knows the studio's name even when the network does not, so a first
                launch with no connection is still recognisably their app rather than anonymous. */}
            {data ? `${data.studioName} · ${data.todayLabel}` : studioName}
          </Text>
          <Text variant="display" color={hasPhoto ? 'inverse' : 'primary'}>
            {data?.greeting ?? 'Welcome'}
          </Text>
        </FadeRise>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xxl,
          gap: theme.spacing.lg,
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
        {/* EVERYTHING below the hero rises as ONE piece, after the photograph has had the screen
            to itself. Whatever is in here at the time comes up together — skeleton, error or the
            real schedule — so the sequence runs to the same length regardless of the network.

            One unit rather than a per-block stagger: a stagger running inside a rising container
            is two motion systems arguing, and the eye reads that as jitter, not sequence. */}
        <FadeRise
          animate={playEntrance}
          delay={HERO_BEAT}
          distance={36}
          duration={460}
          style={{ gap: theme.spacing.lg }}
        >
          {isLoading ? (
            <SkeletonList count={3} />
          ) : !data ? (
            // No data AND not loading means the request failed. Distinguishing this from an empty
            // schedule matters: "the studio has no classes" and "we could not reach the studio"
            // call for different words and, crucially, a retry.
            <ErrorState
              message={describeApiError(error)}
              retriable={!(error instanceof ApiError) || error.retriable}
              onRetry={onRefresh}
            />
          ) : (
            <>
              {!data.acceptingBookings ? (
                <BookingUnavailableNotice studioName={data.studioName} />
              ) : null}

              {data.nextBooking ? (
                <View>
                  <Text variant="label" color="tertiary" uppercase style={{ marginBottom: theme.spacing.md }}>
                    Your next class
                  </Text>
                  <Card
                    emphasis="accent"
                    onPress={() => onOpenClass(data.nextBooking!.eventId)}
                    accessibilityLabel={`Your next class, ${data.nextBooking.name}`}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.md }}>
                      <View style={{ gap: theme.spacing.xs, flexShrink: 1 }}>
                        {/* The day comes from the data, not from an assumption that the next
                            booking is always today — it very often is not. */}
                        <Text variant="numeral">
                          {data.nextBooking.whenLabel} · {formatStoredTime(data.nextBooking.startsAt)}
                        </Text>
                        <Text variant="heading">{data.nextBooking.name}</Text>
                        <Text variant="secondary" color="secondary">
                          {[data.nextBooking.instructor && `with ${data.nextBooking.instructor}`, data.nextBooking.locationLabel]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                      <StatusTag label="Booked" tone="accent" />
                    </View>
                  </Card>
                </View>
              ) : null}

              <View>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: theme.spacing.md,
                  }}
                >
                  {/* The heading tells the truth about what the list IS. When today is over the
                      screen shows the next few sessions instead of an empty state whose only
                      action is a screen that does not exist yet. */}
                  <Text variant="label" color="tertiary" uppercase>
                    {data.classesLabel === 'today' ? 'Today at the studio' : 'Coming up'}
                  </Text>
                  <Text variant="caption" color="accent" onPress={onSeeFullSchedule}>
                    See all
                  </Text>
                </View>

                {data.classes.length === 0 ? (
                  <EmptyState
                    title="Nothing on the schedule."
                    body={`${data.studioName} has not posted its next sessions yet.`}
                  />
                ) : (
                  <View style={{ gap: theme.spacing.md }}>
                    {data.classes.map((entry) => (
                      <ClassRow key={entry.eventId} entry={entry} onPress={() => onOpenClass(entry.eventId)} />
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </FadeRise>
      </ScrollView>
    </View>
  );
}

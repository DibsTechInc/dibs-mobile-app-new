/**
 * Home — Option A, "The Cover" (approved by Alicia, 2026-08-05).
 *
 * The studio's photograph occupies the top ~43% of the screen with the greeting set over it in
 * Fraunces; underneath, the client's next class, then today's schedule. Reference mock:
 * `design/mockups/home-options.html#option-a`.
 *
 * ── The app-open sequence (Alicia, 2026-08-06) ───────────────────────────────────────────────
 * The photograph is FULL SCREEN first. Nothing else — no scrim, no greeting, no chrome. Then the
 * white panel carrying the schedule travels up from entirely below the bottom edge and comes to
 * rest at the hero band, and the composed screen assembles as it lands.
 *
 * The point is that the client sees the whole picture before the app arrives on top of it. This
 * is the splash resolving into Home rather than a screen fading in, and it is why the photo layer
 * is full-height and stationary while only the panel moves — resizing the photograph mid-flight
 * would make its crop crawl, which is the one thing that would give the trick away.
 *
 *   t=0     full-screen photograph, settling 1.08 → 1.0. Held.
 *   t=620   the panel begins its travel; scrim, greeting and account action begin to fade in
 *   t=1180  everything at rest; the hero drifts 1.0 ↔ 1.045 on a 14s cycle from here on
 *
 * Runs ONCE PER LAUNCH, not per mount (`useAppOpenEntrance`) — Home rebuilds every time you come
 * back to it, and an entrance that replays reads as lag rather than arrival. All of it collapses
 * to nothing under the OS reduce-motion setting.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { RefreshControl, ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, describeApiError } from '@/api/errors';
import {
  BookingUnavailableNotice,
  Card,
  EmptyState,
  ErrorState,
  SkeletonList,
  StatusTag,
  Text,
} from '@/components';
import {
  COVER_HOLD,
  FadeRise,
  HeroSettle,
  SlideUp,
  useAppOpenEntrance,
} from '@/components/motion';
import type { HomeData } from '@/domain/home/build-home-data';
import type { ScheduleEntry } from '@/domain/schedule/types';
import { formatStoredTime } from '@/domain/time/studio-now';
import { useTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';

const HERO_HEIGHT = 360;

/**
 * How much of the hero band the bottom scrim ramps across before reaching full strength.
 *
 * It reaches that strength exactly at the band's bottom edge and then HOLDS it to the foot of the
 * screen — see the note on the gradient itself.
 */
const SCRIM_RAMP = 0.62;

/**
 * The chrome over the photo appears slightly after the panel starts moving.
 *
 * It reads as the panel bringing the composition with it. Fading it in during the held
 * full-screen moment would put a scrim and a greeting in the middle of a picture that is not yet
 * a header, which looks like a mistake rather than a layout.
 */
const CHROME_DELAY = COVER_HOLD + 140;

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
  const { height: screenHeight } = useWindowDimensions();

  /**
   * No photograph means no photograph TREATMENT — and no full-screen hold either.
   *
   * The scrim and the inverse text exist to hold white type on an image. Applied to the empty
   * surface wash they produce a grey smear with invisible white text on it. And holding a blank
   * rectangle for 620ms before revealing the app is not a cover, it is a stall — so with no photo
   * the panel is simply already in place.
   */
  const hasPhoto = Boolean(data?.heroUri);
  const overPhoto = hasPhoto ? ('inverse' as const) : ('secondary' as const);

  /**
   * False on every mount after the first of this launch.
   *
   * Home remounts each time you come back from another screen, and pull-to-refresh re-renders it.
   * An entrance that replays on return stops reading as the app arriving and starts reading as
   * the app being slow.
   */
  const playEntrance = useAppOpenEntrance() && hasPhoto;

  /** How far the panel has to travel: from entirely below the bottom edge to its resting place. */
  const panelTravel = screenHeight - HERO_HEIGHT;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/*
        THE PHOTO LAYER — full screen, and it never resizes.

        Sized to the whole window rather than to the hero band so the held opening frame is the
        entire picture. It stays exactly where it is for the rest of the session; the panel slides
        up and covers everything below the band. Animating the photo's own height instead would
        make its crop crawl during the reveal, which is precisely what would make the whole thing
        look like an effect rather than like the app opening.

        Consequence worth knowing: what remains visible at rest is the TOP 43% of a full-screen
        crop. The hero photograph therefore has to be composed for the full frame, with its
        subject in the upper portion. Another reason the landscape web banners currently coming
        back from get-basic-config are the wrong asset.
      */}
      {hasPhoto ? (
        <View
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: screenHeight, overflow: 'hidden' }}
          pointerEvents="none"
        >
          <HeroSettle animate={playEntrance} style={{ flex: 1 }}>
            <Image
              source={data?.heroUri ?? undefined}
              style={{ flex: 1, backgroundColor: theme.colors.surface }}
              contentFit="cover"
              contentPosition="center"
              transition={motion.slow}
              accessible={false}
            />
          </HeroSettle>

          {/*
            THE SCRIMS LIVE HERE, NOT IN THE BAND — and they run the FULL height of the screen.

            They sit outside HeroSettle deliberately: a gradient that scales with the photograph
            makes its edge crawl across the frame as the hero drifts.

            The full height is what removes the line. Confined to the 360px band, the bottom ramp
            reached its darkest value at y=360 and then simply stopped — a hard horizontal edge
            where 55% black met untouched photograph. At rest that edge is hidden under the panel,
            which is why it was invisible until the panel started travelling from below it. Now
            the ramp holds its final value all the way to the bottom of the screen, so there is no
            edge anywhere for the rising panel to expose; it just slides up over an evenly
            darkened photo and covers it.

            The `locations` are computed rather than fixed so the ramp lands on the band's bottom
            edge whatever the device height.
          */}
          <FadeRise
            animate={playEntrance}
            delay={CHROME_DELAY}
            distance={0}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <LinearGradient
              colors={[theme.heroScrim.topFrom, theme.heroScrim.topTo]}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: insets.top + theme.spacing.xxl + theme.spacing.lg,
              }}
            />
            <LinearGradient
              colors={[theme.heroScrim.from, theme.heroScrim.to, theme.heroScrim.to]}
              locations={[
                (HERO_HEIGHT * (1 - SCRIM_RAMP)) / screenHeight,
                HERO_HEIGHT / screenHeight,
                1,
              ]}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
          </FadeRise>
        </View>
      ) : null}

      {/*
        THE HERO BAND — transparent. It holds the chrome at the right height and nothing else; the
        photograph behind it belongs to the layer above.
      */}
      <View
        style={{
          height: HERO_HEIGHT,
          justifyContent: 'flex-end',
          backgroundColor: hasPhoto ? 'transparent' : theme.colors.surface,
        }}
      >
        {/* Sits in the safe area at the top right, over the photo — the only thing above the
            greeting, and quiet enough not to compete with it. */}
        {accountAction ? (
          <FadeRise
            animate={playEntrance}
            delay={CHROME_DELAY}
            distance={0}
            style={{ position: 'absolute', top: insets.top + theme.spacing.sm, right: theme.spacing.lg }}
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

        {/* Pure fade, no rise: the greeting sits directly above the panel's landing edge, and
            anything moving there would fight the panel arriving. */}
        <FadeRise
          animate={playEntrance}
          delay={CHROME_DELAY}
          distance={0}
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

      {/*
        THE PANEL — opaque, and it starts entirely below the bottom edge of the screen.

        Opaque rather than fading, and square-edged rather than rounded: it comes to rest as the
        page itself, not as a sheet sitting on top of one. Rounded top corners would promise it
        can be dismissed.
      */}
      <SlideUp
        animate={playEntrance}
        distance={panelTravel}
        delay={COVER_HOLD}
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
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
              {!data.acceptingBookings ? <BookingUnavailableNotice studioName={data.studioName} /> : null}

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
        </ScrollView>
      </SlideUp>
    </View>
  );
}

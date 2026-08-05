/**
 * Home — Option A, "The Cover" (approved by Alicia, 2026-08-05).
 *
 * The studio's photograph occupies the top ~43% of the screen with the greeting set over it in
 * Fraunces; underneath, the client's next class, then today's schedule. Reference mock:
 * `design/mockups/home-options.html#option-a`.
 *
 * Motion on open (the "make it feel dynamic" ask):
 *   1. the hero settles from 1.08 → 1.0 over 900ms as it fades in — the photo comes to rest
 *      rather than popping in, which is what makes the splash feel like it resolved into Home;
 *   2. the content blocks fade and rise in a 70ms stagger, so the screen assembles;
 *   3. the hero then drifts between 1.0 and 1.045 on a 14s cycle — low enough amplitude that it
 *      is felt rather than watched. A photograph that visibly zooms is a screensaver.
 * All of it collapses to nothing when the OS reduce-motion setting is on.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BookingUnavailableNotice,
  Card,
  EmptyState,
  SkeletonList,
  StatusTag,
  Text,
} from '@/components';
import { FadeRise, HeroSettle } from '@/components/motion';
import { formatStoredTime } from '@/domain/time/studio-now';
import { useTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';

import type { HomeData, ScheduleEntry } from './types';

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
  isLoading?: boolean;
  onOpenClass: (eventId: number) => void;
  onSeeFullSchedule: () => void;
}

export function HomeScreen({ data, isLoading, onOpenClass, onSeeFullSchedule }: HomeScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const greeting = data?.firstName ? `Good morning,\n${data.firstName}` : 'Welcome';

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Hero. Overflow hidden so the drift scale never bleeds past the header. */}
      <View style={{ height: HERO_HEIGHT, overflow: 'hidden', justifyContent: 'flex-end' }}>
        <HeroSettle
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

        {/* The legibility scrim sits ABOVE the drifting photo and does NOT move with it —
            a gradient that scales with the image makes its edge crawl across the frame.

            Note for the design review: this ramp works on Carlsbad's mid-tone studio shot and
            fights Everyday Ballet's high-key dancer, where darkening reads as a mistake. If EB
            looks wrong on device, the fix is to put the greeting below the photo for that
            studio rather than to deepen the scrim. */}
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

        <FadeRise index={0} style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg }}>
          <Text variant="label" color="inverse" uppercase style={{ opacity: 0.85, marginBottom: theme.spacing.xs }}>
            {data ? `${data.studioName} · ${data.todayLabel}` : ' '}
          </Text>
          <Text variant="display" color="inverse">
            {greeting}
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
      >
        {isLoading || !data ? (
          <SkeletonList count={3} />
        ) : (
          <>
            {!data.acceptingBookings ? (
              <FadeRise index={1}>
                <BookingUnavailableNotice studioName={data.studioName} />
              </FadeRise>
            ) : null}

            {data.nextBooking ? (
              <FadeRise index={1}>
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
                      <Text variant="numeral">Today · {formatStoredTime(data.nextBooking.startsAt)}</Text>
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
              </FadeRise>
            ) : null}

            <FadeRise index={data.nextBooking ? 2 : 1}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: theme.spacing.md,
                }}
              >
                <Text variant="label" color="tertiary" uppercase>
                  Today at the studio
                </Text>
                <Text variant="caption" color="accent" onPress={onSeeFullSchedule}>
                  See all
                </Text>
              </View>

              {data.todaysClasses.length === 0 ? (
                <EmptyState
                  title="Nothing left today."
                  body="Tomorrow's schedule is open."
                  action={{ label: 'See tomorrow', onPress: onSeeFullSchedule }}
                />
              ) : (
                <View style={{ gap: theme.spacing.md }}>
                  {data.todaysClasses.map((entry) => (
                    <ClassRow key={entry.eventId} entry={entry} onPress={() => onOpenClass(entry.eventId)} />
                  ))}
                </View>
              )}
            </FadeRise>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/**
 * The loading / empty / error grammar (P0 item 6).
 *
 * Built once, used by every screen. The point is that "no classes on Thursday", "we could not
 * reach the studio", and "still loading" look and read like three deliberately different things
 * — because to the person holding the phone they ARE three different things, and collapsing
 * them is how an app starts feeling broken.
 *
 * Copy rule from the brief: editorial, specific, never a sad-face illustration.
 * "No classes Thursday. The 6am Flow has space Friday." — not "Nothing here!"
 */
import { useEffect, useState } from 'react';
import { Animated, Easing, View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Button } from './Button';
import { Text } from './Text';

/**
 * A shimmering placeholder shaped like the content that is coming.
 *
 * Deliberately not a spinner: a skeleton that matches the eventual layout makes the wait feel
 * shorter and stops the screen jumping when data lands.
 */
export interface SkeletonProps extends ViewProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
}

export function Skeleton({ width = '100%', height = 16, radius, style, ...rest }: SkeletonProps) {
  const theme = useTheme();
  // See the note in Sheet.tsx: read during render, so state rather than a ref.
  const [pulse] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Animated.View
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      style={[
        {
          width,
          height,
          borderRadius: radius ?? theme.radii.input,
          backgroundColor: theme.colors.surface,
          opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }),
        },
        style,
      ]}
      {...rest}
    />
  );
}

/** Several skeleton rows shaped like a list. */
export function SkeletonList({ count = 4 }: { count?: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.md }}>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{
            padding: theme.spacing.base,
            borderRadius: theme.radii.card,
            borderWidth: 1,
            borderColor: theme.colors.border,
            gap: theme.spacing.sm,
          }}
        >
          <Skeleton width="35%" height={20} />
          <Skeleton width="70%" height={14} />
        </View>
      ))}
    </View>
  );
}

export interface EmptyStateProps {
  /** The fact. "No classes Thursday." */
  title: string;
  /** The way forward. "The 6am Flow has space Friday." Optional but usually worth writing. */
  body?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingVertical: theme.spacing.xxl,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        gap: theme.spacing.sm,
      }}
    >
      <Text variant="title" align="center">
        {title}
      </Text>
      {body ? (
        <Text variant="secondary" color="secondary" align="center">
          {body}
        </Text>
      ) : null}
      {action ? (
        <View style={{ marginTop: theme.spacing.base }}>
          <Button label={action.label} variant="secondary" fullWidth={false} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

export interface ErrorStateProps {
  /** Client-safe copy. Pass `describeApiError(error)` — never a raw server message. */
  message: string;
  onRetry?: () => void;
  /** Set when the failure is not worth retrying, so no false hope is offered. */
  retriable?: boolean;
}

export function ErrorState({ message, onRetry, retriable = true }: ErrorStateProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        paddingVertical: theme.spacing.xl,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        gap: theme.spacing.sm,
      }}
    >
      <Text variant="heading" align="center">
        Something went wrong
      </Text>
      <Text variant="secondary" color="secondary" align="center">
        {message}
      </Text>
      {onRetry && retriable ? (
        <View style={{ marginTop: theme.spacing.base }}>
          <Button label="Try again" variant="secondary" fullWidth={false} onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * Studio not accepting bookings — offboarded, or in trial soft-lockout.
 *
 * Composed, never alarming, and never a dead end: read access stays, cancellations still work,
 * only the booking CTAs go. A branded app cannot simply stop working when the studio's Dibs
 * relationship changes (MOBILE_MASTER_PLAN §6.3, "Studio lifecycle states").
 */
export function BookingUnavailableNotice({ studioName }: { studioName: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: theme.spacing.base,
        borderRadius: theme.radii.card,
        backgroundColor: theme.colors.surface,
        gap: theme.spacing.xs,
      }}
    >
      <Text variant="bodyMedium">Booking is temporarily unavailable</Text>
      <Text variant="secondary" color="secondary">
        You can still see your schedule and cancel a booking. Contact {studioName} to book.
      </Text>
    </View>
  );
}

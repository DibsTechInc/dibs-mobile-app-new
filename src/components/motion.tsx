/**
 * Entrance motion primitives.
 *
 * The rule from `DESIGN_BRIEF.md`: motion communicates causality, never decorates. Content
 * rising into place as the screen settles reads as the app arriving. The same movement applied
 * to a list the user is already scrolling reads as jank. So these are **entrance** helpers —
 * they run once on mount and then get out of the way.
 *
 * Everything here honours the OS "reduce motion" setting. Someone who has asked their phone to
 * stop moving things has asked us too, and a vestibular trigger is not a design flourish.
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { motion } from '@/theme/tokens';

/**
 * Whether the OS asked us to keep still.
 *
 * Starts false and flips once the async query resolves; the first frame of an entrance is
 * indistinguishable either way, so there is nothing to guard against.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(value);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return reduced;
}

/** ease-out: leaves fast, settles slow. The curve that reads as "arriving", not "sliding". */
const EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

export interface FadeRiseProps {
  children: React.ReactNode;
  /** Stagger position. Each step adds ~70ms — enough to read as a sequence, not a queue. */
  index?: number;
  /** Distance travelled, in px. Keep it small; a long throw looks like a page transition. */
  distance?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fades and lifts its children into place on mount.
 *
 * Used to stagger a screen's blocks so Home assembles itself rather than appearing all at once.
 * With reduce-motion on, the content is simply there.
 */
export function FadeRise({ children, index = 0, distance = 16, style }: FadeRiseProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(
      index * 70,
      withTiming(1, { duration: 380, easing: EASE_OUT }),
    );
  }, [index, progress, reduced]);

  const animated = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

export interface HeroSettleProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * The slow ambient drift after the settle. Low amplitude on purpose — a photograph that
   * visibly zooms is a screensaver. This should be noticed only by its absence.
   */
  drift?: boolean;
}

/**
 * The app-open moment: the hero photograph settles from slightly-too-large into place, then
 * breathes almost imperceptibly.
 *
 * This is the motion equivalent of the splash resolving into Home — the photo appears to have
 * been there all along and is now coming to rest, rather than popping in.
 */
export function HeroSettle({ children, style, drift = true }: HeroSettleProps) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(reduced ? 1 : 1.08);
  const opacity = useSharedValue(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }

    opacity.value = withTiming(1, { duration: motion.slow, easing: EASE_OUT });

    if (!drift) {
      scale.value = withTiming(1, { duration: 900, easing: EASE_OUT });
      return;
    }

    // Settle to rest, then drift between 1.0 and 1.045 on a 14s cycle. The settle and the drift
    // are one sequence so there is no seam where the photo stops and restarts.
    scale.value = withSequence(
      withTiming(1, { duration: 900, easing: EASE_OUT }),
      withRepeat(
        withSequence(
          withTiming(1.045, { duration: 14000, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [drift, opacity, reduced, scale]);

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

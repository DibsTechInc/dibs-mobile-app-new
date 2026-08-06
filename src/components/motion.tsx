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

/**
 * How long the hero holds the screen alone before the content rises under it.
 *
 * The screen is fully assembled at roughly `HERO_BEAT + 460ms`. Much past this and the app feels
 * precious rather than composed — an entrance you wait through is one you resent by the fortieth
 * launch. Much under it and there is no sequence at all, which is where this started.
 */
export const HERO_BEAT = 380;

/**
 * Has the app-open entrance already played in this launch?
 *
 * Module scope on purpose. Home REMOUNTS every time you navigate back to it, so without this the
 * sequenced entrance replays on every return from sign-in — and motion that repeats on a screen
 * you are moving through stops reading as arrival and starts reading as lag. Pull-to-refresh has
 * the same problem.
 *
 * Reset on reload, which is correct: that IS a fresh launch.
 */
let appOpenConsumed = false;

/**
 * True for the first component that asks in a given app launch, false forever after.
 *
 * The initializer is deliberately pure — it only reads. React may invoke a lazy initializer
 * twice in development, so a version that consumed the flag inside it would hand `false` to the
 * one component that should have animated. The flag is set from an effect instead.
 */
export function useAppOpenEntrance(): boolean {
  const [play] = useState(() => !appOpenConsumed);

  useEffect(() => {
    appOpenConsumed = true;
  }, []);

  return play;
}

export interface FadeRiseProps {
  children: React.ReactNode;
  /** Stagger position. Each step adds ~70ms — enough to read as a sequence, not a queue. */
  index?: number;
  /** Distance travelled, in px. Keep it small; a long throw looks like a page transition. */
  distance?: number;
  /** Held back by this many ms on top of the stagger. Used for the hero beat on Home. */
  delay?: number;
  duration?: number;
  /**
   * False → render at rest, no animation.
   *
   * For a returning mount, where the entrance has already played once this launch. Not the same
   * as reduce-motion: this is "the moment has passed", that is "this person asked us to stop".
   */
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Fades and lifts its children into place on mount.
 *
 * Two ways to use it. A small `distance` with a stagger `index` makes a screen assemble itself
 * block by block. A larger `distance` with a `delay` makes one region arrive as a unit after
 * something else has had the screen — which is what Home does, so the photograph gets a beat
 * before the schedule rises under it.
 *
 * Don't do both at once on the same screen. A stagger running inside a rising container is two
 * motion systems arguing, and the eye reads it as jitter rather than sequence.
 *
 * With reduce-motion on, the content is simply there.
 */
export function FadeRise({
  children,
  index = 0,
  distance = 16,
  delay = 0,
  duration = 380,
  animate = true,
  style,
}: FadeRiseProps) {
  const reduced = useReducedMotion();
  const still = reduced || !animate;
  const progress = useSharedValue(still ? 1 : 0);

  useEffect(() => {
    if (still) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay + index * 70, withTiming(1, { duration, easing: EASE_OUT }));
  }, [delay, duration, index, progress, still]);

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
  /**
   * False → skip the settle and start already at rest, drifting.
   *
   * The settle is the splash resolving into Home; there is no splash to resolve on a return
   * visit, so replaying it makes the photograph twitch every time you come back.
   */
  animate?: boolean;
}

/**
 * The app-open moment: the hero photograph settles from slightly-too-large into place, then
 * breathes almost imperceptibly.
 *
 * This is the motion equivalent of the splash resolving into Home — the photo appears to have
 * been there all along and is now coming to rest, rather than popping in.
 */
export function HeroSettle({ children, style, drift = true, animate = true }: HeroSettleProps) {
  const reduced = useReducedMotion();
  const still = reduced || !animate;
  const scale = useSharedValue(still ? 1 : 1.08);
  const opacity = useSharedValue(still ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }

    // A returning visit skips the settle but keeps breathing — the drift is ambient, not an
    // entrance, so stopping it would make the screen feel deader than it was a moment ago.
    if (!animate) {
      opacity.value = 1;
      scale.value = 1;
    } else {
      opacity.value = withTiming(1, { duration: motion.slow, easing: EASE_OUT });
    }

    const breathe = () =>
      withRepeat(
        withSequence(
          withTiming(1.045, { duration: 14000, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      );

    if (!drift) {
      if (animate) scale.value = withTiming(1, { duration: 900, easing: EASE_OUT });
      return;
    }

    // Settle to rest, then drift between 1.0 and 1.045 on a 14s cycle. The settle and the drift
    // are one sequence so there is no seam where the photo stops and restarts.
    scale.value = animate
      ? withSequence(withTiming(1, { duration: 900, easing: EASE_OUT }), breathe())
      : breathe();
  }, [animate, drift, opacity, reduced, scale]);

  const animated = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[animated, style]}>{children}</Animated.View>;
}

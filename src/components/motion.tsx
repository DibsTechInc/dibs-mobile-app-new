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
 * A deeper ease-out for long travel.
 *
 * Something crossing most of the screen needs more deceleration than something moving 36px, or
 * it arrives looking like it hit a wall rather than came to rest.
 */
const EASE_OUT_DEEP = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * ⚠️ **UNUSED since the 2026-08-07 redesign. Kept, not deleted — pending a decision.**
 *
 * `COVER_HOLD`, `PANEL_RISE` and `SlideUp` below belonged to the old app-open sequence: the
 * photograph held the whole screen, then a white panel carrying the schedule travelled up from
 * below the bottom edge. Timing "B" was chosen by Alicia on 2026-08-06.
 *
 * The redesign removed the panel. Home is now the photograph with nothing over it but type, so
 * there is nothing to slide — the entrance is the greeting and menu fading in on a picture that
 * the splash already put on screen.
 *
 * They stay because removing them is a deletion, and because a future surface (a booking
 * confirmation, a sheet that owns its screen) may genuinely want a panel that arrives. If nothing
 * has claimed them by the time P3 lands, delete them then.
 *
 * How long the photograph holds the WHOLE screen before content slides up over it.
 */
export const COVER_HOLD = 620;

/** How long the panel takes to travel the height of the screen. Unused — see above. */
export const PANEL_RISE = 560;

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

export interface SlideUpProps {
  children: React.ReactNode;
  /** How far below its resting place it starts. Usually the height of what it has to clear. */
  distance: number;
  delay?: number;
  duration?: number;
  animate?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Travels up into place from off-screen. **No fade** — deliberately.
 *
 * Used for Home's content panel, which starts entirely below the bottom edge and rises over the
 * full-screen hero. Opacity is wrong here: a white panel fading in over a photograph reads as
 * haze settling on the picture, not as a surface arriving in front of it. An opaque edge moving
 * up is what makes the motion legible — you can see exactly what is happening, which is the
 * whole point of motion communicating causality.
 *
 * Uses a slightly deeper ease-out than `FadeRise`: a long travel needs a more pronounced
 * deceleration or it arrives looking like it hit a wall.
 */
export function SlideUp({
  children,
  distance,
  delay = 0,
  duration = PANEL_RISE,
  animate = true,
  style,
}: SlideUpProps) {
  const reduced = useReducedMotion();
  const still = reduced || !animate;
  const progress = useSharedValue(still ? 1 : 0);

  useEffect(() => {
    if (still) {
      progress.value = 1;
      return;
    }
    progress.value = withDelay(delay, withTiming(1, { duration, easing: EASE_OUT_DEEP }));
  }, [delay, duration, progress, still]);

  const animated = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * distance }],
  }));

  return <Animated.View style={[style, animated]}>{children}</Animated.View>;
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

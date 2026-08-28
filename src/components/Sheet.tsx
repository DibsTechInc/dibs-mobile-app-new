/**
 * The bottom sheet. Payment selection, cancel confirmation, flash-credit detail.
 *
 * Sheets exist so a decision resolves without leaving the screen — the platform's "it just
 * works" rule. If you find yourself pushing a route to ask one question, it belongs here.
 *
 * ── The Modal must outlive `visible`, or the sheet never closes — it VANISHES ─────────────────
 * `<Modal visible={visible}>` unmounts on the frame the prop flips, so an exit animation written
 * against it is started and then thrown away with the view that was playing it. Every sheet in
 * the app shut with a hard cut for exactly that reason (reported on device 2026-08-28, buying a
 * package with credit: "the transitions felt abrupt"). The enter looked fine, which is what hid
 * it — the Modal is already mounted by then.
 *
 * So mounting is its OWN state: `visible` starts the animation, and the animation's completion
 * ends the mount. Nothing here may go back to driving the Modal from `visible` directly.
 */
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  useWindowDimensions,
  View,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/ThemeProvider';

import { useReducedMotion } from './motion';
import { Text } from './Text';

export interface SheetProps extends ViewProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Set false for a decision the user must resolve explicitly. Use sparingly. */
  dismissOnBackdropPress?: boolean;
}

export function Sheet({
  visible,
  onClose,
  title,
  dismissOnBackdropPress = true,
  children,
  style,
  ...rest
}: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  // Lazily-initialised state, not a ref: the value is READ during render (interpolate below),
  // and the React Compiler forbids reading a ref there. useState's initialiser runs once, so the
  // Animated.Value is still created exactly one time and stays stable across renders.
  const [progress] = useState(() => new Animated.Value(0));
  const reduced = useReducedMotion();

  /**
   * Whether the Modal is on screen at all — deliberately NOT `visible`. See the header.
   * Opening sets it immediately; closing waits for the slide to finish.
   */
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  useEffect(() => {
    // Nothing to animate until the Modal exists — on open this runs again once it does.
    if (!mounted) return;

    const animation = Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      // Shortened under reduce-motion rather than removed: the sheet still has to read as
      // arriving from and leaving toward somewhere, or its origin stops being legible.
      duration: reduced ? theme.motion.instant : theme.motion.base,
      // Out on the way in (arrives fast, settles), in on the way out (leaves decisively).
      easing: visible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    });

    animation.start(({ finished }) => {
      // `finished` is false when a re-open interrupted the close, which is what keeps a fast
      // close-then-open from unmounting the sheet that just came back.
      if (finished && !visible) setMounted(false);
    });

    return () => animation.stop();
  }, [visible, mounted, progress, reduced, theme.motion.base, theme.motion.instant]);

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={{
            ...(StyleSheetAbsoluteFill as object),
            backgroundColor: theme.colors.scrim,
            opacity: progress,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{ flex: 1 }}
            onPress={dismissOnBackdropPress ? onClose : undefined}
          />
        </Animated.View>

        <Animated.View
          style={{
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  // Slides from below the fold rather than fading: the movement is what tells
                  // you where it came from and where it will go.
                  outputRange: [height * 0.5, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={[
              {
                backgroundColor: theme.colors.surfaceRaised,
                borderTopLeftRadius: theme.radii.sheet,
                borderTopRightRadius: theme.radii.sheet,
                borderTopWidth: 1,
                borderColor: theme.colors.border,
                paddingHorizontal: theme.spacing.lg,
                paddingTop: theme.spacing.base,
                // Respect the home indicator, with real breathing room beneath the CTA.
                paddingBottom: insets.bottom + theme.spacing.lg,
                gap: theme.spacing.base,
              },
              style,
            ]}
            {...rest}
          >
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                alignSelf: 'center',
                width: 36,
                height: 4,
                borderRadius: theme.radii.pill,
                backgroundColor: theme.colors.border,
              }}
            />
            {title ? <Text variant="title">{title}</Text> : null}
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Inlined rather than importing StyleSheet just for one constant. */
const StyleSheetAbsoluteFill = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

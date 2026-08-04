/**
 * The bottom sheet. Payment selection, cancel confirmation, flash-credit detail.
 *
 * Sheets exist so a decision resolves without leaving the screen — the platform's "it just
 * works" rule. If you find yourself pushing a route to ask one question, it belongs here.
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

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: theme.motion.base,
      // ease-out: fast to start, settling at the end. Motion communicates causality — the sheet
      // arrives because the finger asked for it.
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, progress, theme.motion.base]);

  return (
    <Modal
      visible={visible}
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

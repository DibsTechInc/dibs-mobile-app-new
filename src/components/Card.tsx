/**
 * A bordered container. Reach for it when content is interactive or genuinely needs a boundary
 * — NOT as the default wrapper for every block. Cards-for-everything is the fastest way to make
 * a screen look templated.
 *
 * Bordered, never shadowed (DESIGN_BRIEF § Layer 1).
 */
import { Pressable, View, type ViewProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

export interface CardProps extends ViewProps {
  /** Accent-wash field. Reserve it for the one thing on screen that matters most. */
  emphasis?: 'default' | 'accent' | 'flat';
  /** Makes the whole card the tap target, with a considered pressed state. */
  onPress?: () => void;
  accessibilityLabel?: string;
  padded?: boolean;
}

export function Card({
  emphasis = 'default',
  onPress,
  padded = true,
  style,
  children,
  accessibilityLabel,
  ...rest
}: CardProps) {
  const theme = useTheme();

  const surface = {
    default: { backgroundColor: theme.colors.surfaceRaised, borderColor: theme.colors.border },
    accent: { backgroundColor: theme.colors.accentWash, borderColor: theme.colors.accentBorder },
    // No border: for a card sitting on the tinted surface colour, where a border would be noise.
    flat: { backgroundColor: theme.colors.surface, borderColor: 'transparent' },
  }[emphasis];

  const base = {
    backgroundColor: surface.backgroundColor,
    borderColor: surface.borderColor,
    borderWidth: emphasis === 'flat' ? 0 : 1,
    borderRadius: theme.radii.card,
    padding: padded ? theme.spacing.base : 0,
  };

  if (!onPress) {
    return (
      <View style={[base, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [
        base,
        // The border warms to the accent on press — the brief's card-hover behaviour, adapted
        // to touch where there is no hover to rely on.
        pressed && { borderColor: theme.colors.accentBorder, backgroundColor: theme.colors.surface },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

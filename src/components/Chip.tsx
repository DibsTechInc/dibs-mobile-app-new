/**
 * A quiet filter chip, and its non-interactive sibling for status.
 *
 * Selected uses the accent wash rather than a filled accent: a row of chips is not the one
 * highlight a screen gets, and filling them all would spend the accent on navigation.
 */
import { Pressable, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function Chip({ label, selected = false, onPress, disabled }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      // Chips sit below the 44pt minimum visually, so the hit area is extended instead of the
      // pill being made ungainly. A missed filter tap on a moving bus is a real failure.
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
      style={({ pressed }) => ({
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radii.pill,
        borderWidth: 1,
        borderColor: selected ? theme.colors.accentBorder : theme.colors.border,
        backgroundColor: selected
          ? theme.colors.accentWash
          : pressed
            ? theme.colors.surface
            : theme.colors.background,
        opacity: disabled ? 0.45 : 1,
      })}
    >
      <Text variant="label" color={selected ? 'accent' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent';

/**
 * Non-interactive status. "3 spots left", "Waitlist", "Cancelled".
 *
 * Separate from Chip on purpose — an element that looks tappable and is not is the exact
 * mis-tap the platform's "foolproof by default" rule exists to prevent.
 */
export function StatusTag({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  const theme = useTheme();

  const tones = {
    neutral: { background: theme.colors.surface, color: 'secondary' as const },
    success: { background: theme.colors.surface, color: 'success' as const },
    warning: { background: theme.colors.surface, color: 'secondary' as const },
    danger: { background: theme.colors.surface, color: 'danger' as const },
    accent: { background: theme.colors.accentWash, color: 'accent' as const },
  }[tone];

  return (
    <View
      style={{
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
        borderRadius: theme.radii.input,
        backgroundColor: tones.background,
        alignSelf: 'flex-start',
      }}
    >
      <Text variant="label" color={tones.color}>
        {label}
      </Text>
    </View>
  );
}

/**
 * The button. Four variants, and the accent appears on exactly one of them.
 *
 * `primary` is the studio's colour, so a screen with two primaries has spent the scarcity that
 * makes the accent mean something. One per screen, at most.
 */
import { ActivityIndicator, Pressable, type PressableProps, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  variant?: ButtonVariant;
  /** Full-width by default: a CTA at the bottom of a sheet should not look bolted on. */
  fullWidth?: boolean;
  loading?: boolean;
  /** Rendered before the label. Icons clarify; if the label says it, leave this out. */
  icon?: React.ReactNode;
  size?: 'default' | 'compact';
}

export function Button({
  label,
  variant = 'primary',
  fullWidth = true,
  loading = false,
  disabled,
  icon,
  size = 'default',
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const surfaces = {
    primary: {
      background: theme.colors.accentFill,
      pressed: theme.colors.accentPressed,
      border: 'transparent',
      textColor: 'onAccent' as const,
    },
    secondary: {
      background: theme.colors.background,
      pressed: theme.colors.surface,
      border: theme.colors.border,
      textColor: 'primary' as const,
    },
    ghost: {
      background: 'transparent',
      pressed: theme.colors.surface,
      border: 'transparent',
      textColor: 'accent' as const,
    },
    // Destructive is danger, never the accent — a studio's brand colour must not mean
    // "you are about to lose something".
    destructive: {
      background: theme.colors.background,
      pressed: theme.colors.surface,
      border: theme.colors.danger,
      textColor: 'danger' as const,
    },
  }[variant];

  const verticalPadding = size === 'compact' ? theme.spacing.md - 2 : theme.spacing.base - 2;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(isDisabled), busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          minHeight: theme.minTapTarget,
          paddingVertical: verticalPadding,
          paddingHorizontal: theme.spacing.lg,
          borderRadius: theme.radii.button,
          borderWidth: surfaces.border === 'transparent' ? 0 : 1,
          borderColor: surfaces.border,
          backgroundColor: pressed ? surfaces.pressed : surfaces.background,
          alignItems: 'center',
          justifyContent: 'center',
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          // Dimming beats hiding: a disabled control the user can still see teaches them what
          // to fix. Removing it entirely leaves them guessing.
          opacity: isDisabled ? 0.45 : 1,
        },
      ]}
      {...rest}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? theme.colors.onAccent : theme.colors.textSecondary}
          />
        ) : (
          icon
        )}
        <Text variant="button" color={surfaces.textColor}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

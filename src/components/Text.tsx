/**
 * The only text primitive. Every string in the app renders through it.
 *
 * There is no `fontSize` prop by design: a screen that needs a size not in the scale is a
 * screen that has drifted from the template. Pick a role from `typography` instead.
 */
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';
import type { TypographyKey } from '@/theme/tokens';

type ColorRole =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'accent'
  | 'danger'
  | 'success'
  | 'onAccent';

export interface TextProps extends RNTextProps {
  /** Role from the type scale. Defaults to body. */
  variant?: TypographyKey;
  color?: ColorRole;
  /** Uppercase + tracking, for eyebrow labels. Applied here so `label` stays reusable. */
  uppercase?: boolean;
  align?: 'left' | 'center' | 'right';
}

export function Text({
  variant = 'body',
  color = 'primary',
  uppercase,
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();

  const colorValue = {
    primary: theme.colors.text,
    secondary: theme.colors.textSecondary,
    tertiary: theme.colors.textTertiary,
    inverse: theme.colors.textInverse,
    // accentInk, never the raw accent: the raw colour is not guaranteed legible as text.
    accent: theme.colors.accentInk,
    danger: theme.colors.danger,
    success: theme.colors.success,
    onAccent: theme.colors.onAccent,
  }[color];

  return (
    <RNText
      style={[
        theme.typography[variant],
        { color: colorValue },
        uppercase && { textTransform: 'uppercase' as const },
        align && { textAlign: align },
        style,
      ]}
      {...rest}
    />
  );
}

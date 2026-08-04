/**
 * A labelled text field.
 *
 * The label is always visible — placeholder-as-label disappears the moment someone types, which
 * is exactly when they most need to know what they are filling in.
 */
import { useState } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { useTheme } from '@/theme/ThemeProvider';

import { Text } from './Text';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label: string;
  /** Shown in danger colour under the field, and announced to screen readers. */
  error?: string | null;
  /** Persistent guidance. Hidden while an error is showing so the two never stack. */
  hint?: string;
}

export function Input({ label, error, hint, onFocus, onBlur, ...rest }: InputProps) {
  const theme = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? theme.colors.danger
    : focused
      ? theme.colors.accentBorder
      : theme.colors.border;

  return (
    <View style={{ gap: theme.spacing.xs }}>
      <Text variant="label" color="secondary" uppercase>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={theme.colors.textTertiary}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          theme.typography.body,
          {
            color: theme.colors.text,
            borderWidth: 1,
            borderColor,
            borderRadius: theme.radii.input,
            paddingHorizontal: theme.spacing.md,
            // Comfortably above the 44pt minimum: text entry wants room, not the bare minimum.
            paddingVertical: theme.spacing.md,
            minHeight: theme.minTapTarget,
            backgroundColor: theme.colors.background,
          },
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="tertiary">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

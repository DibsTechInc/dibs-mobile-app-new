/**
 * The appointment flow's shared anatomy: the accent block every step opens with, and the summary
 * band steps 2+ carry under it.
 *
 * One implementation, because the flow reads as ONE journey precisely to the degree these are
 * identical from screen to screen — same chevron, same optically-centred title, same band.
 */
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export function FlowHeader({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  /** Extra rows inside the accent block — the slots screen's day strip lives here. */
  children?: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: theme.colors.accentFill,
        paddingTop: insets.top + theme.spacing.sm,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.base,
          paddingBottom: theme.spacing.sm,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [{ padding: theme.spacing.xs, opacity: pressed ? 0.55 : 1 }]}
        >
          <Icon name="back" size={20} color={theme.colors.onAccent} />
        </Pressable>

        <Text variant="title" style={{ fontSize: 17, color: theme.colors.onAccent }}>
          {title}
        </Text>

        {/* Same width as the chevron, so the title stays optically centred. */}
        <View style={{ width: 20 + theme.spacing.xs * 2 }} />
      </View>
      {children}
    </View>
  );
}

/**
 * What has been chosen so far, with one way back to change it. Lives directly under the accent
 * block on the provider and slots steps.
 */
export function SummaryBand({
  label,
  primary,
  secondary,
  onEdit,
}: {
  /** The eyebrow — 'YOUR SESSION'. Omitted on the slots step to save the line. */
  label?: string;
  primary: string;
  secondary?: string | null;
  onEdit: () => void;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.md,
        backgroundColor: theme.colors.surface,
        paddingVertical: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        {label ? (
          <Text variant="label" color="tertiary" uppercase style={{ marginBottom: 2 }}>
            {label}
          </Text>
        ) : null}
        <Text variant="heading" numberOfLines={1}>
          {primary}
        </Text>
        {secondary ? (
          <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
            {secondary}
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Edit: ${primary}`}
        onPress={onEdit}
        hitSlop={8}
        style={({ pressed }) => [{ paddingVertical: theme.spacing.xs, opacity: pressed ? 0.55 : 1 }]}
      >
        <Text variant="secondary" color="accent">
          Edit
        </Text>
      </Pressable>
    </View>
  );
}

/** The sticky decision footer: a fact line over the one filled button per screen. */
export function FlowFooter({
  leftLabel,
  rightLabel,
  children,
}: {
  leftLabel?: string | null;
  rightLabel?: string | null;
  children: ReactNode;
}) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        paddingTop: theme.spacing.md,
        paddingHorizontal: theme.spacing.base + 4,
        paddingBottom: insets.bottom + theme.spacing.md,
        gap: theme.spacing.md,
      }}
    >
      {leftLabel || rightLabel ? (
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          {leftLabel ? (
            <Text variant="caption" color="secondary" style={{ flex: 1, minWidth: 0 }}>
              {leftLabel}
            </Text>
          ) : (
            <View />
          )}
          {rightLabel ? (
            <Text variant="numeral" style={{ fontSize: 17, lineHeight: 22 }}>
              {rightLabel}
            </Text>
          ) : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

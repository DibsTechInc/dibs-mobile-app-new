/**
 * The drawer. Everything Home's three choices leave out.
 *
 * There is no tab bar in this app (settled 2026-08-07). Home offers three ways in; this is how you
 * move sideways from anywhere else. One navigation model, so nothing appears or disappears as you
 * move between screens.
 *
 * ── Money at the top ────────────────────────────────────────────────────────────────────────
 * Credit balance and passes sit above the navigation, the way the old app had them. It is what
 * people open this for, and it answers "can I book?" before they go looking. The balances are
 * PASSED IN rather than fetched here — a drawer that fires three requests every time it opens is
 * a drawer that feels slow, and the wallet query is already warm from the account screen.
 */
import { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Skeleton, Text, type IconName } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export interface DrawerItem {
  label: string;
  icon: IconName;
  onPress: () => void;
}

export interface DrawerBalance {
  label: string;
  /** Already formatted. This component never does money arithmetic. */
  value: string;
}

export interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
  /** The client's name, or null for a guest — which is a real state, not a loading one. */
  name: string | null;
  studioName: string;
  /** Null while the wallet is still resolving; `[]` when there is genuinely nothing to show. */
  balances: DrawerBalance[] | null;
  items: DrawerItem[];
  /** Sits apart from `items`, at the foot. Absent for a guest. */
  footerItem?: DrawerItem;
}

/** How far in from the right edge the panel stops, so the page behind stays visible. */
const PANEL_INSET = 56;

export function DrawerMenu({
  visible,
  onClose,
  name,
  studioName,
  balances,
  items,
  footerItem,
}: DrawerMenuProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // Lazily-initialised state rather than a ref: the value is READ during render (the interpolate
  // below), and the React Compiler forbids reading a ref there. Same pattern as `Sheet`.
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: theme.motion.base,
      // ease-out: the panel arrives because a finger asked for it.
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, progress, theme.motion.base]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* The scrim is the way out, and it is the whole screen — a drawer with no obvious dismiss
          is a trap, and the back gesture is not discoverable enough to be the only exit. */}
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(22,20,19,0.44)',
          opacity: progress,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={onClose}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: PANEL_INSET,
          backgroundColor: theme.colors.background,
          paddingTop: insets.top + theme.spacing.base,
          transform: [
            { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-400, 0] }) },
          ],
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            paddingHorizontal: theme.spacing.lg,
            marginBottom: theme.spacing.base,
          }}
        >
          <View style={{ flexShrink: 1, paddingRight: theme.spacing.sm }}>
            <Text variant="title">{name ?? studioName}</Text>
            {name ? (
              <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
                {studioName}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => ({ padding: theme.spacing.xs, opacity: pressed ? 0.55 : 1 })}
          >
            <Icon name="close" size={20} color={theme.colors.textTertiary} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: theme.spacing.lg,
            paddingBottom: insets.bottom + theme.spacing.xl,
          }}
        >
          {/* Null is "still asking", `[]` is "nothing to show" — and a guest has no balances at
              all, which is why the whole block disappears rather than reading "$0.00". */}
          {balances === null ? (
            <View style={{ gap: theme.spacing.sm, marginBottom: theme.spacing.lg }}>
              <Skeleton height={18} width="60%" />
              <Skeleton height={18} width="40%" />
            </View>
          ) : balances.length > 0 ? (
            <View
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radii.card,
                marginBottom: theme.spacing.lg,
                overflow: 'hidden',
              }}
            >
              {balances.map((balance, index) => (
                <View
                  key={balance.label}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: theme.spacing.sm,
                    padding: theme.spacing.md,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: theme.colors.divider,
                  }}
                >
                  <Text variant="caption" color="secondary" style={{ flexShrink: 1 }}>
                    {balance.label}
                  </Text>
                  {/* The accent lands on the money. In an app whose personality is one colour,
                      this is the right place to spend it. */}
                  <Text variant="numeral" color="accent">
                    {balance.value}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {items.map((item) => (
            <Row key={item.label} item={item} />
          ))}

          {footerItem ? (
            <View style={{ marginTop: theme.spacing.lg }}>
              <Row item={footerItem} />
            </View>
          ) : null}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function Row({ item }: { item: DrawerItem }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.label}
      onPress={item.onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.base,
        minHeight: theme.minTapTarget,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        opacity: pressed ? 0.55 : 1,
      })}
    >
      <Icon name={item.icon} size={19} color={theme.colors.textTertiary} />
      <Text variant="body">{item.label}</Text>
      <View style={{ marginLeft: 'auto' }}>
        <Icon name="forward" size={17} color={theme.colors.border} />
      </View>
    </Pressable>
  );
}

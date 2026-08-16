/**
 * The account. Approved 2026-08-07; reference mock: `design/mockups/rework.html`.
 *
 * ── Money first ─────────────────────────────────────────────────────────────────────────────
 * Credit balance and passes sit ABOVE the navigation, the way the old app had them. It is what
 * people open the account for, and it answers "can I book?" before they go looking for it. The
 * accent lands on the numerals: in an app whose whole personality is one colour, the money is the
 * right place to spend it.
 *
 * Passes moved up here from the wallet. Two taps to see whether you have a class left is one too
 * many; the wallet keeps cards and history.
 *
 * A row that leads nowhere is worse than a row that is absent, so the caller passes only the rows
 * whose destinations exist. There is no tab bar — a back chevron returns, the drawer moves
 * sideways.
 */
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Skeleton, Text, type IconName } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export interface AccountRow {
  label: string;
  icon: IconName;
  /** Rendered under the label. Says what the row holds, never what the label already says. */
  detail?: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}

export interface AccountBalance {
  /**
   * Stable render key — the pass id, never the label. Two purchases of the same package are two
   * rows with identical labels, and keying on the label made React drop one (2026-08-16).
   */
  key: string;
  label: string;
  /** A second, quieter line under the label — an expiry date, never a restatement. */
  detail?: string;
  /** Already formatted — this screen never does money arithmetic. */
  value: string;
}

function Row({ row }: { row: AccountRow }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={row.detail ? `${row.label}. ${row.detail}` : row.label}
      onPress={row.onPress}
      style={({ pressed }) => [{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing.base,
        minHeight: theme.minTapTarget,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
        opacity: pressed ? 0.55 : 1,
      }]}
    >
      <Icon
        name={row.icon}
        size={19}
        color={row.tone === 'danger' ? theme.colors.danger : theme.colors.textTertiary}
      />
      <View style={{ flexShrink: 1, gap: 2 }}>
        <Text variant="body" color={row.tone === 'danger' ? 'danger' : 'primary'}>
          {row.label}
        </Text>
        {row.detail ? (
          <Text variant="caption" color="tertiary">
            {row.detail}
          </Text>
        ) : null}
      </View>
      <View style={{ marginLeft: 'auto' }}>
        <Icon name="forward" size={17} color={theme.colors.border} />
      </View>
    </Pressable>
  );
}

export interface AccountScreenProps {
  name: string | null;
  email: string | null;
  studioName: string;
  /** Null while the wallet resolves; `[]` when there is genuinely nothing to show. */
  balances: AccountBalance[] | null;
  rows: AccountRow[];
  onSignOut: () => void;
  /** Opens the delete-account flow (Apple 5.1.1(v)). Absent → the row does not render. */
  onDeleteAccount?: () => void;
  onBack: () => void;
  onOpenMenu?: () => void;
  /** Pull-to-refresh, spinner answering only to the pull — see `usePullRefresh`. */
  isRefreshing?: boolean;
  onRefresh?: () => void;
}

export function AccountScreen({
  name,
  email,
  studioName,
  balances,
  rows,
  onSignOut,
  onDeleteAccount,
  onBack,
  onOpenMenu,
  isRefreshing,
  onRefresh,
}: AccountScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.spacing.base,
          paddingTop: theme.spacing.sm,
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Back to ${studioName}`}
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [{ padding: theme.spacing.xs, opacity: pressed ? 0.55 : 1 }]}
        >
          <Icon name="back" size={20} color={theme.colors.textSecondary} />
        </Pressable>

        {onOpenMenu ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            onPress={onOpenMenu}
            hitSlop={12}
            style={({ pressed }) => [{ padding: theme.spacing.xs, opacity: pressed ? 0.55 : 1 }]}
          >
            <Icon name="menu" size={20} color={theme.colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.sm,
          paddingBottom: insets.bottom + theme.spacing.xxl,
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing ?? false}
              onRefresh={onRefresh}
              tintColor={theme.colors.textSecondary}
            />
          ) : undefined
        }
      >
        <Text variant="display">{name ?? 'Your account'}</Text>
        {email ? (
          <Text variant="secondary" color="tertiary" style={{ marginTop: theme.spacing.xs }}>
            {email}
          </Text>
        ) : null}

        {/* Null is "still asking", `[]` is "you have none" — and rendering "$0.00" for a client
            whose balance simply has not loaded is the failure this keeps apart. */}
        {balances === null ? (
          <View style={{ gap: theme.spacing.sm, marginTop: theme.spacing.lg }}>
            <Skeleton height={20} width="55%" />
            <Skeleton height={20} width="40%" />
          </View>
        ) : balances.length > 0 ? (
          <View
            style={{
              marginTop: theme.spacing.lg,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radii.card,
              overflow: 'hidden',
            }}
          >
            {balances.map((balance, index) => (
              <View
                key={balance.key}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: theme.spacing.md,
                  padding: theme.spacing.md,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: theme.colors.divider,
                }}
              >
                <View style={{ flexShrink: 1, gap: 2 }}>
                  <Text variant="caption" color="secondary">
                    {balance.label}
                  </Text>
                  {balance.detail ? (
                    <Text variant="caption" color="tertiary">
                      {balance.detail}
                    </Text>
                  ) : null}
                </View>
                {/* `numberOfLines` because "9 classes left" beside a long pass name is what made
                    these rows wrap into each other on device. */}
                <Text variant="numeral" color="accent" numberOfLines={1}>
                  {balance.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ marginTop: theme.spacing.xl }}>
          {rows.map((row) => (
            <Row key={row.label} row={row} />
          ))}
        </View>

        <View style={{ marginTop: theme.spacing.lg }}>
          {/* Sign out is a row, not a button: it is one navigation action among others, and a
              full-width control would carry more weight than the thing it undoes. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            onPress={onSignOut}
            style={({ pressed }) => [{
              minHeight: theme.minTapTarget,
              justifyContent: 'center',
              paddingVertical: theme.spacing.md,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.divider,
              opacity: pressed ? 0.55 : 1,
            }]}
          >
            <Text variant="body">Sign out</Text>
          </Pressable>

          {/* Quiet and last, below Sign out: present because Apple requires it in-app
              (5.1.1(v)) and because it is honest — but styled at the weight of a footnote,
              never competing with anything above it. Danger ink is what says "this one is
              different"; the typed confirmation in the sheet is what makes it deliberate. */}
          {onDeleteAccount ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Delete account"
              onPress={onDeleteAccount}
              style={({ pressed }) => [{
                minHeight: theme.minTapTarget,
                justifyContent: 'center',
                paddingVertical: theme.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.divider,
                opacity: pressed ? 0.55 : 1,
              }]}
            >
              <Text variant="body" color="danger">
                Delete account
              </Text>
            </Pressable>
          ) : null}

          {/* The only Dibs mark anywhere in a studio's app. */}
          <Text variant="caption" color="tertiary" style={{ paddingTop: theme.spacing.base }}>
            Powered by Dibs
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

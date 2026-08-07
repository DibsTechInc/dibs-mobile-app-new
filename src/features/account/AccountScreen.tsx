/**
 * The account hub. Reference mock: `design/mockups/booking-and-account.html` § "The client's
 * account", left-hand frame.
 *
 * Where a client goes to find something — so what it must never do is offer a way to somewhere
 * that does not exist. Every row here goes somewhere real; rows whose destination has not been
 * built are absent, not disabled, for the same reason the tab bar waited for its fourth tab.
 *
 * ── What the mock has that this does not, and why ───────────────────────────────────────────
 *  • **The "Your journey" card** (23 classes, 2 to go, member since March 2024) is the emotional
 *    object on the screen and it is deliberately missing. Nothing in P2 returns a lifetime class
 *    count or a milestone, the milestones backend is unverified (§7.6 carries a STATUS UNVERIFIED
 *    banner in the shared CLAUDE.md), and a proud number that is wrong is worse than no number.
 *    It arrives with P6.
 *  • **"Give $10, get $10"** needs the referral endpoints — also later.
 *  • **"Your classes"** needs a bookings list screen; Home shows the next one today.
 *  • **"Delete account"** is REQUIRED by Apple for any app with sign-up and is backend item 7.7.
 *    It is a release gate, recorded in EXECUTION_STATE.md. It is not stubbed here because a
 *    delete-account row that does not delete the account is the worst possible version of it.
 *
 * Presentational: every action is a prop.
 */
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export interface AccountRow {
  label: string;
  /** Rendered under the label. Use it to say what the row holds, not to explain the obvious. */
  detail?: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
}

function Row({ row, isLast }: { row: AccountRow; isLast: boolean }) {
  const theme = useTheme();
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={row.detail ? `${row.label}. ${row.detail}` : row.label}
        onPress={row.onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.md,
          minHeight: theme.minTapTarget,
          paddingVertical: theme.spacing.md,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <View style={{ gap: 2, flexShrink: 1 }}>
          <Text variant="body" color={row.tone === 'danger' ? 'danger' : 'primary'}>
            {row.label}
          </Text>
          {row.detail ? (
            <Text variant="caption" color="tertiary">
              {row.detail}
            </Text>
          ) : null}
        </View>
        <Text variant="secondary" color="tertiary">
          ›
        </Text>
      </Pressable>
      {/* Hairlines between rows, not a card around each one. A settings list is neither
          interactive-as-a-block nor in need of a boundary. */}
      {isLast ? null : <View style={{ height: 1, backgroundColor: theme.colors.border }} />}
    </>
  );
}

function RowGroup({ title, rows }: { title: string; rows: AccountRow[] }) {
  const theme = useTheme();
  if (rows.length === 0) return null;
  return (
    <View>
      <Text variant="label" color="tertiary" uppercase style={{ marginBottom: theme.spacing.sm }}>
        {title}
      </Text>
      <View>
        {rows.map((row, index) => (
          <Row key={row.label} row={row} isLast={index === rows.length - 1} />
        ))}
      </View>
    </View>
  );
}

export interface AccountScreenProps {
  /** The client's own name. Null while the Dibs identity is still resolving. */
  name: string | null;
  email: string | null;
  studioName: string;
  accountRows: AccountRow[];
  supportRows: AccountRow[];
  onSignOut: () => void;
  onBack: () => void;
  /** Shown while the session is real but the Dibs identity has not landed. */
  isResolving?: boolean;
}

export function AccountScreen({
  name,
  email,
  studioName,
  accountRows,
  supportRows,
  onSignOut,
  onBack,
  isResolving = false,
}: AccountScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
        <Text
          variant="caption"
          color="accent"
          onPress={onBack}
          accessibilityRole="button"
          style={{ paddingVertical: theme.spacing.md }}
        >
          ← {studioName}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xxl,
          gap: theme.spacing.xl,
        }}
      >
        {/* The client's own name, set as the screen title. It is the one thing on an
            administrative screen that belongs to them. */}
        <View style={{ gap: theme.spacing.xs }}>
          <Text variant="display">{name ?? (isResolving ? ' ' : 'Your account')}</Text>
          {email ? (
            <Text variant="secondary" color="secondary">
              {email}
            </Text>
          ) : null}
        </View>

        <RowGroup title="Account" rows={accountRows} />
        <RowGroup title="Support" rows={supportRows} />

        <View>
          {/* Sign out is a row, not a button: it is a navigation action among others, and a
              full-width control here would carry more weight than the thing it undoes. */}
          <Row row={{ label: 'Sign out', onPress: onSignOut }} isLast />
          <View style={{ height: 1, backgroundColor: theme.colors.border }} />
          <Text variant="caption" color="tertiary" style={{ paddingTop: theme.spacing.base }}>
            {/* The only Dibs mark anywhere in a studio's app. */}
            Powered by Dibs
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Payments — what is about to leave the account, and what already has.
 *
 * Upcoming sits ABOVE past: a charge that has not happened yet is the one a client can still act
 * on. Presentational; the data arrives shaped.
 */
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, EmptyState, Icon, Skeleton, Text } from '@/components';
import type {
  BillingData,
  BillingHistoryItem,
  UpcomingPaymentItem,
} from '@/domain/billing/build-billing';
import { useTheme } from '@/theme/ThemeProvider';

function SectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="label" color="tertiary" uppercase style={{ marginBottom: theme.spacing.md }}>
      {children}
    </Text>
  );
}

/**
 * A section that could not be loaded.
 *
 * Deliberately NOT an empty state. "We could not ask" and "you have nothing" are different facts,
 * and on a money surface the difference is the whole message — telling a paying member they have
 * no upcoming charges is the worst thing this screen can say.
 */
function SectionError({ label, onRetry }: { label: string; onRetry?: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <Text variant="secondary" color="secondary">
        {label}
      </Text>
      {onRetry ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Try again"
          onPress={onRetry}
          hitSlop={8}
          style={({ pressed }) => [{ alignSelf: 'flex-start', opacity: pressed ? 0.55 : 1 }]}
        >
          <Text variant="label" color="accent">
            Try again
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function UpcomingRow({ item }: { item: UpcomingPaymentItem }) {
  const theme = useTheme();
  return (
    <Card>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: theme.spacing.md,
        }}
      >
        <View style={{ gap: theme.spacing.xs, flexShrink: 1 }}>
          <Text variant="heading">{item.title}</Text>
          <Text variant="secondary" color="secondary">
            {item.whenLabel}
          </Text>
        </View>
        {item.amountLabel ? (
          <Text variant="heading" color="accent">
            {item.amountLabel}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

function HistoryRow({ item }: { item: BillingHistoryItem }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: theme.spacing.md,
        paddingVertical: theme.spacing.base,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.divider,
      }}
    >
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text variant="body">{item.title}</Text>
        {item.dateLabel ? (
          <Text variant="caption" color="tertiary">
            {item.dateLabel}
          </Text>
        ) : null}
      </View>
      {/* Only rendered when the row moved money. A "$0.00" beside a pass redemption reads as a
          charge that happened. */}
      {item.amountLabel || item.refundLabel ? (
        <View style={{ alignItems: 'flex-end' }}>
          {item.amountLabel ? (
            <Text variant="body" color={item.isCredit ? 'success' : 'primary'}>
              {item.amountLabel}
            </Text>
          ) : null}
          {/* Stated under the amount, not folded into it — a netted figure appears on no
              statement the client can reconcile against. */}
          {item.refundLabel ? (
            <Text variant="caption" color="tertiary">
              {item.refundLabel}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export interface BillingScreenProps {
  data: BillingData;
  studioName: string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onBack: () => void;
}

export function BillingScreen({
  data,
  studioName,
  isLoading,
  isRefreshing = false,
  onRefresh,
  onBack,
}: BillingScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: theme.spacing.base, paddingTop: theme.spacing.sm }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Back to ${studioName}`}
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [{ padding: theme.spacing.xs, opacity: pressed ? 0.55 : 1 }]}
        >
          <Icon name="back" size={20} color={theme.colors.text} />
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
        <Text variant="display">Payments</Text>
        <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.xs }}>
          {studioName}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xxl,
          gap: theme.spacing.xl,
        }}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.textSecondary}
            />
          ) : undefined
        }
      >
        <View>
          <SectionLabel>Coming up</SectionLabel>
          {isLoading || data.upcoming.status === 'loading' ? (
            <Skeleton height={22} width="60%" />
          ) : data.upcoming.status === 'error' ? (
            <SectionError
              label="We could not load your upcoming payments."
              onRetry={onRefresh}
            />
          ) : data.upcoming.items.length === 0 ? (
            <Text variant="secondary" color="secondary">
              {/* Only reachable from a 'ready' or 'partial' status — never from a failed read. */}
              No scheduled payments.
            </Text>
          ) : (
            <View style={{ gap: theme.spacing.md }}>
              {data.upcoming.items.map((item) => (
                <UpcomingRow key={item.key} item={item} />
              ))}
              {/* Stripe answered partially: what is shown is real, it just is not provably
                  complete. Saying so is the honest option. */}
              {data.upcoming.mayBeIncomplete ? (
                <Text variant="caption" color="tertiary">
                  Some payments could not be checked just now, so this list may be incomplete.
                </Text>
              ) : null}
            </View>
          )}
        </View>

        <View>
          <SectionLabel>Past payments</SectionLabel>
          {isLoading || data.past.status === 'loading' ? (
            <Skeleton height={22} width="45%" />
          ) : data.past.status === 'error' ? (
            <SectionError label="We could not load your payment history." onRetry={onRefresh} />
          ) : data.past.items.length === 0 ? (
            <EmptyState
              title="Nothing yet."
              body={`Payments you make at ${studioName} will appear here.`}
            />
          ) : (
            <View>
              {data.past.items.map((item) => (
                <HistoryRow key={item.key} item={item} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

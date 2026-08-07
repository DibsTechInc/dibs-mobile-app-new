/**
 * The wallet — passes, credit, saved cards. Reference mock:
 * `design/mockups/booking-and-account.html` § "The client's account", right-hand frame.
 *
 * Presentational: the data arrives already shaped, every action is a prop.
 *
 * ── Three sections that fail independently ──────────────────────────────────────────────────
 * Each section renders from its own `status` rather than from the length of its own list, which
 * is what keeps "you have none" apart from "we could not ask". A failed section shows a retry and
 * leaves the other two alone; the screen is never blank because Stripe was slow.
 *
 * ── What the mock has that this does not, and why ───────────────────────────────────────────
 *  • **Upcoming payment** ("Your next invoice will be charged on the 25th") needs subscription
 *    data — P5. A date and an amount are the two things a client must never be wrong about, so
 *    this section arrives when the data behind it does.
 *  • **Recent** (transaction history) is P5 for the same reason.
 * Neither is stubbed. A money surface with placeholder numbers on it is worse than one section
 * short.
 */
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, EmptyState, ErrorState, Skeleton, StatusTag, Text } from '@/components';
import type { SavedCard } from '@/domain/payments/cards';
import type { SectionStatus, WalletData, WalletPass } from '@/domain/wallet/build-wallet';
import { useTheme } from '@/theme/ThemeProvider';

function SectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text variant="label" color="tertiary" uppercase style={{ marginBottom: theme.spacing.md }}>
      {children}
    </Text>
  );
}

/** Two lines the width of the content that is coming — never a spinner. */
function SectionSkeleton({ lines = 2 }: { lines?: number }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} height={index === 0 ? 22 : 16} width={index === 0 ? '55%' : '35%'} />
      ))}
    </View>
  );
}

function PassCard({ pass }: { pass: WalletPass }) {
  const theme = useTheme();
  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xs, flexShrink: 1 }}>
          <Text variant="heading">{pass.name}</Text>
          {pass.expiresLabel ? (
            <Text variant="secondary" color="secondary">
              {pass.expiresLabel}
            </Text>
          ) : null}
        </View>

        {/*
          The number leads, large — it is the fact a client opens the wallet to check.

          An unlimited membership has no number, and inventing one is the single most-repeated bug
          in this platform (`domain/passes/uses.ts`). It gets the word instead, set as a tag so it
          reads as a state rather than as a missing figure.
        */}
        <View style={{ alignItems: 'flex-end' }}>
          {pass.isUnlimited ? (
            <StatusTag label="Unlimited" tone="accent" />
          ) : (
            <>
              <Text variant="hero" color="accent" style={{ fontSize: 38, lineHeight: 40 }}>
                {pass.remainingCount}
              </Text>
              <Text variant="caption" color="tertiary">
                left
              </Text>
            </>
          )}
        </View>
      </View>
    </Card>
  );
}

function CardRow({
  card,
  onManage,
}: {
  card: SavedCard;
  onManage?: (card: SavedCard) => void;
}) {
  const theme = useTheme();
  return (
    <Card
      onPress={onManage ? () => onManage(card) : undefined}
      accessibilityLabel={`${card.label}. ${card.expiryLabel}.${card.isDefault ? ' Default card.' : ''} Manage`}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.md }}>
        <View style={{ gap: theme.spacing.xs, flexShrink: 1 }}>
          <Text variant="heading">{card.label}</Text>
          <Text variant="secondary" color="secondary">
            {card.expiryLabel}
            {card.isDefault ? ' · Default' : ''}
          </Text>
        </View>
        {/* Labelled, not a bare glyph. An unlabelled "···" is a quiz — see the platform's
            foolproof-by-default principle. */}
        {onManage ? (
          <Text variant="caption" color="accent">
            Manage
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

export interface WalletScreenProps {
  data: WalletData;
  studioName: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onBack: () => void;
  onAddCard?: () => void;
  onManageCard?: (card: SavedCard) => void;
  /** Where a client with no passes goes. Absent until the packages storefront lands (P4). */
  onBrowsePackages?: () => void;
}

export function WalletScreen({
  data,
  studioName,
  isRefreshing = false,
  onRefresh,
  onBack,
  onAddCard,
  onManageCard,
  onBrowsePackages,
}: WalletScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  /** One place that decides what a section shows, so no two sections disagree about it. */
  const renderSection = (
    status: SectionStatus,
    isEmpty: boolean,
    {
      loading,
      empty,
      content,
    }: { loading: React.ReactNode; empty: React.ReactNode; content: React.ReactNode },
  ) => {
    if (status === 'loading') return loading;
    if (status === 'error') {
      return (
        <ErrorState
          message={`We could not load this just now. ${studioName} still has it — try again in a moment.`}
          onRetry={onRefresh}
        />
      );
    }
    return isEmpty ? empty : content;
  };

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
          ← Account
        </Text>
        <Text variant="display">Wallet</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xxl,
          // Deliberately wider than the gaps inside a section: the sections are separate
          // subjects, and even spacing everywhere is what makes a screen read as a form.
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
          <SectionLabel>Passes</SectionLabel>
          {renderSection(data.passes.status, data.passes.items.length === 0, {
            loading: <SectionSkeleton />,
            empty: (
              <EmptyState
                title="No passes yet."
                body={`Buy a class pack or a membership from ${studioName} and it will live here.`}
                action={onBrowsePackages ? { label: 'See packages', onPress: onBrowsePackages } : undefined}
              />
            ),
            content: (
              <View style={{ gap: theme.spacing.md }}>
                {data.passes.items.map((pass) => (
                  <PassCard key={pass.id} pass={pass} />
                ))}
              </View>
            ),
          })}
        </View>

        {/*
          Credit sits under the passes as a flat row rather than a card of its own.

          It is one number. Giving it a bordered container the same weight as a pass would say the
          two are the same kind of thing, and cards-for-everything is the fastest way to make a
          screen look templated.
        */}
        <View>
          <SectionLabel>Studio credit</SectionLabel>
          {renderSection(data.credit.status, false, {
            loading: <SectionSkeleton lines={1} />,
            empty: null,
            content: (
              <Card emphasis="flat">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="secondary" color="secondary">
                    {data.credit.amount === 0
                      ? `No credit at ${studioName}`
                      : `Your balance at ${studioName}`}
                  </Text>
                  <Text variant="numeral">{data.credit.label}</Text>
                </View>
              </Card>
            ),
          })}
        </View>

        <View>
          <SectionLabel>Payment methods</SectionLabel>

          {/*
            The partial state, stated plainly.

            `lookupFailed` means one of the two Stripe accounts did not answer. The cards below are
            real and chargeable — they are just not provably all of them. Saying so is the honest
            option; presenting an incomplete list as complete is what tells a client with a saved
            card to go and add one.
          */}
          {data.cards.status === 'partial' ? (
            <View style={{ marginBottom: theme.spacing.md }}>
              <Text variant="secondary" color="secondary">
                Some of your cards could not be loaded. Pull down to try again.
              </Text>
            </View>
          ) : null}

          {data.cards.hadExpiredCards ? (
            <View style={{ marginBottom: theme.spacing.md }}>
              <Text variant="caption" color="tertiary">
                An expired card was hidden.
              </Text>
            </View>
          ) : null}

          {renderSection(data.cards.status, data.cards.items.length === 0, {
            loading: <SectionSkeleton />,
            empty: (
              <View style={{ gap: theme.spacing.md }}>
                <Text variant="secondary" color="secondary">
                  No card saved yet. You can add one now or when you book.
                </Text>
                {onAddCard ? <Button label="Add a payment method" variant="secondary" onPress={onAddCard} /> : null}
              </View>
            ),
            content: (
              <View style={{ gap: theme.spacing.md }}>
                {data.cards.items.map((card) => (
                  <CardRow key={card.id} card={card} onManage={onManageCard} />
                ))}
                {onAddCard ? <Button label="Add a payment method" variant="secondary" onPress={onAddCard} /> : null}
              </View>
            ),
          })}
        </View>
      </ScrollView>
    </View>
  );
}

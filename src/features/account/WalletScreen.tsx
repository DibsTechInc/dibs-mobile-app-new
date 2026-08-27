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
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, EmptyState, ErrorState, Skeleton, StatusTag, Text } from '@/components';
import type { SavedCard } from '@/domain/payments/cards';
import { formatIsoDate } from '@/domain/time/studio-now';
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

/**
 * The commitment line, or the Cancel action — never both, and never neither.
 *
 * Inside the commitment the Cancel button is ABSENT (Alicia, 2026-08-14): not disabled, not one
 * that opens an explanation. But "no button" and "no information" are different things, and a
 * member who sees neither phones the studio — which is the support load this app exists to
 * reduce. So the commitment states itself in the button's place.
 *
 * Both branches read the SAME server-computed field. The app never does the arithmetic: that is
 * the "a value feeding both a sentence and a gate must be resolved once" rule, and the widget's
 * version of this bug came from a date resolved one way for the copy and another for the gate.
 */
function MembershipCancelRow({
  pass,
  onCancel,
}: {
  pass: WalletPass;
  onCancel?: (pass: WalletPass) => void;
}) {
  const theme = useTheme();
  if (!pass.isMembership || !onCancel) return null;

  const commitment = pass.cancellation;

  // Server says the commitment is unserved → state it, offer nothing.
  if (commitment && commitment.canCancel === false) {
    // `eligibleOn` is a YYYY-MM-DD from the server, rendered part-by-part. NEVER `new Date()`.
    const until = formatIsoDate(commitment.eligibleOn);
    return (
      <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.md }}>
        {until
          ? `Minimum commitment through ${until}.`
          : 'This membership is inside its minimum commitment period.'}
      </Text>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Cancel ${pass.name}`}
      onPress={() => onCancel(pass)}
      hitSlop={8}
      style={({ pressed }) => [{
        alignSelf: 'flex-start',
        marginTop: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
        paddingRight: theme.spacing.sm,
        opacity: pressed ? 0.55 : 1,
      }]}
    >
      <Text variant="label" color="secondary">
        Cancel membership
      </Text>
    </Pressable>
  );
}

function PassCard({
  pass,
  onCancelMembership,
}: {
  pass: WalletPass;
  onCancelMembership?: (pass: WalletPass) => void;
}) {
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

      <MembershipCancelRow pass={pass} onCancel={onCancelMembership} />
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
  /**
   * Opens the cancel-membership sheet. Omitted → no membership shows a Cancel action, but a
   * commitment line still renders where one applies.
   */
  onCancelMembership?: (pass: WalletPass) => void;
  data: WalletData;
  studioName: string;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onBack: () => void;
  /**
   * Absent — not disabled — when a card cannot be added right now.
   *
   * A card form that cannot open is worse than one that has not appeared yet, and the two states
   * that cause it (Stripe's key still in flight, identity not resolved) both resolve on their own
   * within a moment.
   */
  onAddCard?: () => void;
  isAddingCard?: boolean;
  addCardError?: string | null;
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
  isAddingCard = false,
  addCardError,
  onManageCard,
  onBrowsePackages,
  onCancelMembership,
}: WalletScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  // Defined once and rendered in both the empty and populated branches, so the two can never
  // drift into offering different affordances for the same action.
  const addCardButton = onAddCard ? (
    <Button
      label="Add a payment method"
      variant="secondary"
      loading={isAddingCard}
      onPress={onAddCard}
    />
  ) : null;

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
                  <PassCard
                    key={pass.id}
                    pass={pass}
                    onCancelMembership={onCancelMembership}
                  />
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
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: theme.spacing.md,
                  }}
                >
                  {/* The label yields and wraps; the FIGURE never does. Without flexShrink a
                      long studio name pushes the amount clean off the screen — reported on
                      device at Carlsbad Village Yoga, 2026-08-27. */}
                  <Text variant="secondary" color="secondary" style={{ flexShrink: 1 }}>
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

          {/* A failed card-add belongs beside the button that raised it, not in a system alert
              that has to be dismissed before the client can see what they were doing. */}
          {addCardError ? (
            <View style={{ marginBottom: theme.spacing.md }}>
              <Text variant="secondary" color="danger">
                {addCardError}
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
                {addCardButton}
              </View>
            ),
            content: (
              <View style={{ gap: theme.spacing.md }}>
                {data.cards.items.map((card) => (
                  <CardRow key={card.id} card={card} onManage={onManageCard} />
                ))}
                {addCardButton}
              </View>
            ),
          })}
        </View>
      </ScrollView>
    </View>
  );
}

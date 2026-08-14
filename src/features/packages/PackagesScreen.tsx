/**
 * Packages — what the client already holds, and what the studio sells.
 *
 * ── What you have comes FIRST ─────────────────────────────────────────────────────────────────
 * Somebody opening this screen is answering one of two questions: "have I got a class left?" or
 * "what would it cost me to get more?". The first is cheaper to answer and more often the real
 * one, so their own passes sit at the top and the storefront sits below. Leading with the price
 * list would be a shop that makes you walk past the tills to find out what you already own.
 *
 * The two sections load independently and fail independently — a client's own passes must not
 * disappear because the studio's price list did not answer, and vice versa.
 *
 * ── Two products, never confused ──────────────────────────────────────────────────────────────
 * A pack and a membership are different commitments, and `domain/packages` decides which is which
 * once. A membership card says "per month" beside its price and states any minimum commitment on
 * its face — the terms somebody is agreeing to belong on the card, not behind a tap.
 *
 * ── Buying happens here, and only where it can succeed ───────────────────────────────────────
 * A pack carries a **Buy · $216.50** button — the tax-inclusive total, because that is the figure
 * being agreed to, and it is the same number sent as `displayedTotalCents` for the server to
 * verify. A MEMBERSHIP does not: enrolling means creating a Stripe subscription, which the app
 * cannot do yet and which the server refuses (`membership_not_supported`), so its card states
 * where to go instead. A button that leads to a refusal is the "Use this card" dead end.
 *
 * The button is `accentOutline`, not filled: a price list is a list, and twelve filled accent
 * buttons spend the studio's colour twelve times over.
 */
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, describeApiError } from '@/api/errors';
import { Button, Card, EmptyState, ErrorState, Icon, Skeleton, StatusTag, Text } from '@/components';
import type { PackageView } from '@/domain/packages/build-packages';
import type { SectionStatus, WalletPass } from '@/domain/wallet/build-wallet';
import type { PurchaseStatus } from '@/features/packages/usePurchasePackage';
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
 * A pass the client already holds.
 *
 * The count leads, large — it is the fact somebody opens this screen to check. An unlimited
 * membership has no number, and inventing one is the single most-repeated bug on this platform, so
 * it gets the word instead, set as a tag so it reads as a STATE rather than as a missing figure.
 */
function OwnedPassRow({ pass }: { pass: WalletPass }) {
  const theme = useTheme();
  return (
    <Card>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: theme.spacing.md,
        }}
      >
        <View style={{ gap: theme.spacing.xs, flexShrink: 1 }}>
          <Text variant="heading">{pass.name}</Text>
          <Text variant="secondary" color="secondary">
            {[pass.isMembership ? 'Membership' : 'Class pack', pass.expiresLabel]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>

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

/**
 * One thing the studio sells.
 *
 * The price is the numeral and everything else is set quietly around it, because a price list is
 * scanned by price. The terms — how many classes, how long it lasts, any minimum commitment — are
 * on the face of the card rather than behind a tap: they are what somebody is agreeing to.
 */
function PackageCard({
  pkg,
  purchase,
  onBuy,
  isSignedIn,
  onSignIn,
}: {
  pkg: PackageView;
  /** This package's slice of the purchase state machine. `null` when it is not the active one. */
  purchase: PurchaseStatus | null;
  onBuy?: (pkg: PackageView, totalCents: number) => void;
  isSignedIn: boolean;
  onSignIn?: () => void;
}) {
  const theme = useTheme();

  const terms = [pkg.allowanceLabel, pkg.validityLabel, pkg.commitmentLabel].filter(Boolean);

  // A price change replaces what the storefront implied for the rest of this card — the client is
  // being asked to confirm the server's number, so the server's number is what shows and what the
  // button sends.
  const priceChanged = purchase?.kind === 'priceChanged';
  const chargeCents = priceChanged ? purchase.totalCents : pkg.totalCents;
  const chargeLabel = priceChanged ? purchase.totalLabel : pkg.totalLabel;
  const isWorking = purchase?.kind === 'working';
  const bought = purchase?.kind === 'bought';

  return (
    <Card>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: theme.spacing.base,
        }}
      >
        <View style={{ flexShrink: 1, gap: theme.spacing.xs }}>
          {pkg.isIntroOffer ? (
            <View style={{ marginBottom: theme.spacing.xs }}>
              <StatusTag label="First purchase only" tone="accent" />
            </View>
          ) : null}

          <Text variant="heading">{pkg.name}</Text>

          {terms.length > 0 ? (
            <Text variant="secondary" color="secondary">
              {terms.join(' · ')}
            </Text>
          ) : null}

          {pkg.description ? (
            <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.xs }}>
              {pkg.description}
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          {pkg.priceLabel ? (
            <>
              <Text variant="numeral" numberOfLines={1}>
                {pkg.priceLabel}
              </Text>
              {pkg.priceSuffix ? (
                <Text variant="caption" color="tertiary" numberOfLines={1}>
                  {pkg.priceSuffix}
                </Text>
              ) : null}
              {pkg.perClassLabel ? (
                <Text variant="caption" color="tertiary" numberOfLines={1}>
                  {pkg.perClassLabel}
                </Text>
              ) : null}
            </>
          ) : (
            // A package with no usable price is not free — it is priced elsewhere, the same rule
            // the class schedule follows for `price_dibs` of 0 or null.
            <Text variant="caption" color="tertiary">
              Ask the studio
            </Text>
          )}
        </View>
      </View>

      {/* ── The action ──────────────────────────────────────────────────────────────────── */}
      <View style={{ marginTop: theme.spacing.base }}>
        {bought ? (
          // The end of the flow for this card. Confirmation copy, not another button — a Buy
          // button still sitting there after a successful purchase invites a second one.
          <Text variant="secondary" color="success">
            Added to your account. It is in Your passes above.
          </Text>
        ) : !pkg.isPurchasable ? (
          // Stated, not disabled-and-unexplained. A membership needs a subscription the app cannot
          // create yet, so the card says where to go rather than offering a button that refuses.
          <Text variant="caption" color="tertiary">
            {pkg.notPurchasableReason}
          </Text>
        ) : !isSignedIn ? (
          <Button
            label="Sign in to buy"
            variant="secondary"
            size="compact"
            fullWidth={false}
            onPress={onSignIn}
          />
        ) : onBuy && chargeCents ? (
          <>
            {purchase?.kind === 'error' ? (
              <Text variant="secondary" color="danger" style={{ marginBottom: theme.spacing.md }}>
                {purchase.message}
                {/* Only ever said when the SERVER confirmed it. Claiming it on an unknown failure
                    would be a guess about somebody's money. */}
                {purchase.nothingCharged ? ' Your card was not charged.' : ''}
              </Text>
            ) : null}

            {priceChanged ? (
              // Deliberately worded as news, not as a failure. Nothing was charged — no
              // PaymentIntent was even created.
              <Text variant="secondary" color="secondary" style={{ marginBottom: theme.spacing.md }}>
                The price updated to {chargeLabel}. Tap to buy at the new price.
              </Text>
            ) : null}

            <Button
              // The total rides ON the button, tax included, because that is the thing being
              // pressed to agree to it. The card list quotes the pre-tax price because a list is
              // scanned; this is where somebody commits.
              label={`${priceChanged ? 'Confirm' : 'Buy'} · ${chargeLabel}`}
              variant="accentOutline"
              size="compact"
              fullWidth={false}
              loading={isWorking}
              onPress={() => onBuy(pkg, chargeCents)}
            />

            {pkg.taxNote && !priceChanged ? (
              <Text variant="caption" color="tertiary" style={{ marginTop: theme.spacing.sm }}>
                {pkg.taxNote}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </Card>
  );
}

export interface PackagesScreenProps {
  packages: PackageView[];
  isLoadingPackages: boolean;
  packagesError?: unknown;

  /** The client's own passes. `null` for a guest — not "you have none", which would be a claim. */
  ownedPasses: WalletPass[] | null;
  ownedStatus: SectionStatus;

  studioName: string;
  /** Whether the client can buy at all — a guest is offered sign-in per card instead. */
  isSignedIn: boolean;
  /** Where the purchase flow currently is. One package at a time; see `usePurchasePackage`. */
  purchase: PurchaseStatus;
  onBuy?: (pkg: PackageView, totalCents: number) => void;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onBack: () => void;
  onOpenMenu?: () => void;
  /** For a guest: the way to see their own passes. */
  onSignIn?: () => void;
}

export function PackagesScreen({
  packages,
  isLoadingPackages,
  packagesError,
  ownedPasses,
  ownedStatus,
  studioName,
  isSignedIn,
  purchase,
  onBuy,
  isRefreshing = false,
  onRefresh,
  onBack,
  onOpenMenu,
  onSignIn,
}: PackagesScreenProps) {
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
          <Icon name="back" size={20} color={theme.colors.text} />
        </Pressable>

        {/* A spacer of the same width when there is no drawer, so the header stays balanced
            rather than letting the chevron drift into the middle. */}
        {onOpenMenu ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            onPress={onOpenMenu}
            hitSlop={12}
            style={({ pressed }) => [{ padding: theme.spacing.xs, opacity: pressed ? 0.55 : 1 }]}
          >
            <Icon name="menu" size={20} color={theme.colors.text} />
          </Pressable>
        ) : (
          <View style={{ width: 20 + theme.spacing.xs * 2 }} />
        )}
      </View>

      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
        <Text variant="display">Packages</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xxl,
          // Deliberately wider than the gaps inside a section: the two are separate subjects, and
          // even spacing everywhere is what makes a screen read as a form.
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
        {/* ── What you already have ──────────────────────────────────────────────────────── */}
        {ownedPasses === null ? (
          // A guest. One line and the way to fix it — never "you have no passes", which is a
          // statement about an account we have not looked at.
          <View>
            <SectionLabel>Your passes</SectionLabel>
            <Card emphasis="flat">
              <Text variant="secondary" color="secondary">
                Sign in to see the passes and memberships on your account.
              </Text>
              {onSignIn ? (
                <Text
                  variant="secondary"
                  color="accent"
                  onPress={onSignIn}
                  accessibilityRole="button"
                  style={{ marginTop: theme.spacing.md }}
                >
                  Sign in
                </Text>
              ) : null}
            </Card>
          </View>
        ) : ownedStatus === 'loading' ? (
          <View>
            <SectionLabel>Your passes</SectionLabel>
            <View style={{ gap: theme.spacing.sm }}>
              <Skeleton height={22} width="55%" />
              <Skeleton height={16} width="35%" />
            </View>
          </View>
        ) : ownedStatus === 'error' ? (
          <View>
            <SectionLabel>Your passes</SectionLabel>
            <ErrorState
              message={`We could not load your passes just now. ${studioName} still has them — pull down to try again.`}
              onRetry={onRefresh}
            />
          </View>
        ) : ownedPasses.length > 0 ? (
          <View>
            <SectionLabel>Your passes</SectionLabel>
            <View style={{ gap: theme.spacing.md }}>
              {ownedPasses.map((pass) => (
                <OwnedPassRow key={pass.id} pass={pass} />
              ))}
            </View>
          </View>
        ) : null}
        {/* Signed in with genuinely no passes: the storefront below IS the answer, so nothing is
            said here. An empty "Your passes — none" section above a price list is a section whose
            only content is the absence of content. */}

        {/* ── What the studio sells ──────────────────────────────────────────────────────── */}
        <View>
          <SectionLabel>{ownedPasses && ownedPasses.length > 0 ? 'Buy more' : 'Available'}</SectionLabel>

          {isLoadingPackages ? (
            <View style={{ gap: theme.spacing.md }}>
              {[0, 1, 2].map((index) => (
                <View
                  key={index}
                  style={{
                    padding: theme.spacing.base,
                    borderRadius: theme.radii.card,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    gap: theme.spacing.sm,
                  }}
                >
                  <Skeleton width="45%" height={20} />
                  <Skeleton width="70%" height={14} />
                </View>
              ))}
            </View>
          ) : packagesError && packages.length === 0 ? (
            <ErrorState
              message={describeApiError(packagesError)}
              retriable={!(packagesError instanceof ApiError) || packagesError.retriable}
              onRetry={onRefresh}
            />
          ) : packages.length === 0 ? (
            <EmptyState
              title="No packages just now."
              body={`${studioName} isn’t selling class packs or memberships in the app at the moment. You can still book classes one at a time.`}
            />
          ) : (
            <View style={{ gap: theme.spacing.md }}>
              {packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  // Only the ACTIVE package's status reaches its card. Passing the whole machine to
                  // every card would put one package's error under all of them.
                  purchase={
                    purchase.kind !== 'idle' && purchase.packageId === pkg.id ? purchase : null
                  }
                  onBuy={onBuy}
                  isSignedIn={isSignedIn}
                  onSignIn={onSignIn}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

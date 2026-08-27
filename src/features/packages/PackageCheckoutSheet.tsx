/**
 * The package checkout — the step between "Buy" and any money moving.
 *
 * It exists because tapping Buy used to open the Stripe sheet directly, which left a client
 * holding $900 of studio credit with no way to spend it on a $180 pack (Alicia, 2026-08-27).
 * A checkout is where funding decisions live, so this is one: the total, the credit switch the
 * class checkout already carries, and one button whose label states what is about to pay.
 *
 * ── What it never does ─────────────────────────────────────────────────────────────────────────
 * It never decides how much credit is spent. The split is `domain/credit/split.ts`'s mirror of
 * the server's own resolver, rendered for the client to agree to; the server re-resolves from the
 * LIVE balance and refuses `credit_changed` on any disagreement. What is displayed here is what
 * is sent, and what is sent is what the server verifies.
 *
 * Presentational: the split arrives computed, every action is a prop. Memberships never reach
 * this sheet — their first cycle funds the card the subscription renews on, so the route sends
 * them straight down the card path exactly as before.
 */
import { Pressable, Switch, View } from 'react-native';

import { Button, Sheet, Text } from '@/components';
import type { CreditSplit } from '@/domain/credit/split';
import type { PackageView } from '@/domain/packages/build-packages';
import type { PurchaseStatus } from '@/features/packages/usePurchasePackage';
import { useTheme } from '@/theme/ThemeProvider';

export interface PackageCheckoutSheetProps {
  /** The package being bought. Null closes the sheet. */
  pkg: PackageView | null;
  /**
   * The figure being agreed to, in cents — the package total, or the server's fresh number after
   * a `price_changed`. One source: the route resolves it, the button label and the confirm both
   * read it.
   */
  totalCents: number;
  totalLabel: string;
  /** The split the client is agreeing to, resolved by the route from the live balance query. */
  split: CreditSplit;
  applyCredit: boolean;
  onApplyCreditChange: (next: boolean) => void;
  /** True when the client has any balance — the switch is absent entirely otherwise. */
  hasCredit: boolean;
  /** This package's slice of the purchase state machine. */
  purchase: PurchaseStatus | null;
  formatCents: (cents: number) => string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Label left, figure right — the shape every price line shares. */
const priceRow = {
  flexDirection: 'row' as const,
  justifyContent: 'space-between' as const,
  alignItems: 'center' as const,
  gap: 12,
};

export function PackageCheckoutSheet({
  pkg,
  totalCents,
  totalLabel,
  split,
  applyCredit,
  onApplyCreditChange,
  hasCredit,
  purchase,
  formatCents,
  onConfirm,
  onClose,
}: PackageCheckoutSheetProps) {
  const theme = useTheme();

  const isWorking = purchase?.kind === 'working';
  const creditOnly = applyCredit && split.kind === 'credit-only';

  const terms = pkg
    ? [pkg.allowanceLabel, pkg.validityLabel].filter(Boolean).join(' · ')
    : '';

  /*
   * WHAT is about to pay, immediately above the button that agrees to it — the same rule the
   * class checkout follows. The card itself is chosen inside Stripe's sheet on the next step, so
   * this names the SPLIT, never a specific card.
   */
  const paymentLine = creditOnly
    ? 'Covered by your studio credit — nothing goes on a card.'
    : applyCredit && split.kind === 'partial'
      ? `${formatCents(split.creditAppliedCents)} credit · ${formatCents(split.cardCents)} on your card`
      : "You'll choose a card on the next step.";

  return (
    <Sheet
      visible={pkg !== null}
      onClose={onClose}
      title="Checkout"
      // Mid-purchase the sheet must not be swiped away under the payment flow — the button shows
      // loading, and a vanished checkout with money in flight reads as something having gone
      // wrong.
      dismissOnBackdropPress={!isWorking}
    >
      {pkg ? (
        <>
          <View style={{ gap: 2 }}>
            <Text variant="heading">{pkg.name}</Text>
            {terms ? (
              <Text variant="secondary" color="secondary">
                {terms}
              </Text>
            ) : null}
          </View>

          <View
            style={{
              paddingTop: theme.spacing.md,
              borderTopWidth: 1,
              borderTopColor: theme.colors.divider,
              gap: theme.spacing.xs,
            }}
          >
            <View style={priceRow}>
              <Text variant="bodyMedium">Total</Text>
              <Text variant="numeral">{totalLabel}</Text>
            </View>
            {pkg.taxNote ? (
              <Text variant="caption" color="tertiary">
                {pkg.taxNote}
              </Text>
            ) : null}
          </View>

          {/*
            The credit switch — the same affordance, same copy shape, as the class checkout.
            Absent entirely at zero balance: an off switch for money the client does not have is
            noise. Default ON, because the credit is theirs and applying it is what people expect;
            the switch is the affordance for the real other intention, keeping it back.
          */}
          {hasCredit ? (
            <Pressable
              onPress={() => onApplyCreditChange(!applyCredit)}
              accessibilityRole="switch"
              accessibilityState={{ checked: applyCredit }}
              accessibilityLabel="Use studio credit"
              disabled={isWorking}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: theme.spacing.md,
                paddingVertical: theme.spacing.xs,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text variant="secondary">Use studio credit</Text>
                <Text variant="caption" color="tertiary">
                  {/* The BALANCE, always — so turning it off still says what is being kept back. */}
                  {formatCents(split.balanceCents)} available
                  {applyCredit && split.creditAppliedCents > 0
                    ? ` · ${formatCents(split.creditAppliedCents)} to this purchase`
                    : ''}
                </Text>
              </View>
              <Switch
                value={applyCredit}
                onValueChange={onApplyCreditChange}
                disabled={isWorking}
                trackColor={{ true: theme.colors.accentFill, false: theme.colors.border }}
              />
            </Pressable>
          ) : null}

          {/* News and failures, right where the decision is being made. */}
          {purchase?.kind === 'error' ? (
            <Text variant="secondary" color="danger">
              {purchase.message}
              {/* Only ever said when the SERVER confirmed it. */}
              {purchase.nothingCharged ? ' Your card was not charged.' : ''}
            </Text>
          ) : null}
          {purchase?.kind === 'priceChanged' ? (
            // Worded as news, not failure — nothing was charged, and the Total above already
            // shows the server's new figure.
            <Text variant="secondary" color="secondary">
              The price updated to {purchase.totalLabel}. Confirm below to buy at the new price.
            </Text>
          ) : null}
          {purchase?.kind === 'creditChanged' ? (
            <Text variant="secondary" color="secondary">
              {purchase.message}
            </Text>
          ) : null}

          <View style={{ gap: theme.spacing.sm }}>
            <Text variant="caption" color="tertiary">
              {paymentLine}
            </Text>
            <Button
              // The total rides ON the button when a card is involved, because that is the thing
              // being pressed to agree to it. A fully-covered purchase names its funding instead —
              // "Buy · $180.00" over a purchase that charges no card puts a price on the wrong
              // instrument.
              label={creditOnly ? 'Buy with studio credit' : `Buy · ${totalLabel}`}
              loading={isWorking}
              disabled={isWorking}
              onPress={onConfirm}
            />
          </View>
        </>
      ) : null}
    </Sheet>
  );
}

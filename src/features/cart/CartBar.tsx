/**
 * The sticky bar that appears once something is in the cart — the booking widget's own move,
 * brought across so a client meets the same flow on the web and in the app.
 *
 * ── Why a bar rather than a badge ──────────────────────────────────────────────────────────────
 * Tapping Book has to visibly DO something, and it has to leave the way forward on screen. A count
 * badge in a header says "something happened" and then asks the client to go and find it; a bar
 * that rises out of the bottom of the screen carrying the total and the word "Checkout" has already
 * answered both questions. It is also the one filled accent button on the schedule, which is why
 * the row buttons are outlined (see `Button`'s `accentOutline`).
 *
 * ── It never appears empty, and it never appears un-actionable ────────────────────────────────
 * Rendered only when there is something to summarise. When every line in the cart is blocked —
 * they all filled up, say — the CTA becomes "Review" rather than "Checkout" and still leads
 * somewhere that explains itself. A bar whose only button cannot proceed is the "Use this card"
 * dead end the widget shipped, and this is the same shape.
 */
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components';
import { useTheme } from '@/theme/ThemeProvider';

export interface CartBarProps {
  /** How many lines will be charged to a card. */
  chargeableCount: number;
  /** How many a pass already covers. Bookable, and they cost nothing. */
  coveredCount: number;
  /** Lines that cannot be booked — full, cancelled, or not card-payable. Never a surprise. */
  blockedCount: number;
  totalLabel: string;
  onPress: () => void;
}

export function CartBar({
  chargeableCount,
  coveredCount,
  blockedCount,
  totalLabel,
  onPress,
}: CartBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const total = chargeableCount + coveredCount + blockedCount;
  if (total === 0) return null;

  // A cart of nothing but pass-covered classes is perfectly checkoutable — it just costs $0.
  // Gating this on `chargeableCount` alone would tell a member with an unlimited membership that
  // their cart could not be booked, which is the exact inversion of the truth.
  const canCheckout = chargeableCount + coveredCount > 0;
  const countLabel = `${total} ${total === 1 ? 'class' : 'classes'}`;
  // No figure when nothing is being charged. "$0.00" beside Checkout reads as a price, and a
  // member seeing a money amount for a class their membership covers will hesitate over it.
  const showAmount = chargeableCount > 0;

  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        // A hairline rather than a shadow, per the template. The bar reads as attached to the
        // bottom of the screen, not as floating over it.
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        paddingHorizontal: theme.spacing.lg,
        paddingTop: theme.spacing.md,
        paddingBottom: insets.bottom + theme.spacing.md,
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          canCheckout
            ? `Check out. ${countLabel}, ${showAmount ? totalLabel : 'covered by your pass'}`
            : `Review your cart. ${countLabel}, none can be booked right now`
        }
        onPress={onPress}
        style={({ pressed }) => [{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.md,
          minHeight: theme.minTapTarget,
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.base,
          borderRadius: theme.radii.button,
          backgroundColor: canCheckout
            ? pressed
              ? theme.colors.accentPressed
              : theme.colors.accentFill
            : pressed
              ? theme.colors.surface
              : theme.colors.background,
          borderWidth: canCheckout ? 0 : 1,
          borderColor: theme.colors.border,
        }]}
      >
        <View style={{ flexShrink: 1, gap: 2 }}>
          <Text variant="button" color={canCheckout ? 'onAccent' : 'primary'} numberOfLines={1}>
            {canCheckout ? 'Checkout' : 'Review your cart'}
          </Text>
          {/* The count and the money together, quietly, under the verb — so the button says what
              it does and the line under it says what it is about. */}
          <Text
            variant="caption"
            color={canCheckout ? 'onAccent' : 'tertiary'}
            numberOfLines={1}
            style={canCheckout ? { opacity: 0.85 } : undefined}
          >
            {canCheckout
              ? blockedCount > 0
                ? `${countLabel} · ${blockedCount} needs attention`
                : // Good news, said in the one place a client is looking before they commit.
                  chargeableCount === 0
                  ? `${countLabel} · covered by your pass`
                  : countLabel
              : `${countLabel} · nothing bookable right now`}
          </Text>
        </View>

        {canCheckout && showAmount ? (
          <Text variant="numeral" color="onAccent" numberOfLines={1}>
            {totalLabel}
          </Text>
        ) : null}
      </Pressable>
    </View>
  );
}

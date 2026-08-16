/**
 * The billing screen's view model. PURE TypeScript.
 *
 * Rows are ALREADY BUNDLED by the server — this only labels and formats them. The two sections
 * fail independently, so each carries its own status: a Stripe outage must not make the past
 * section disappear, and it must never render as "no upcoming charges".
 */
import type { AccountActivityRow, UpcomingPayment } from '@/api/schemas/billing';
import { formatBalance } from '@/domain/money/format';
import { formatInstantInStudioZone } from '@/domain/time/studio-now';

export type BillingSectionStatus = 'loading' | 'ready' | 'partial' | 'error';

export interface BillingHistoryItem {
  key: string;
  title: string;
  dateLabel: string | null;
  /** "$45.98", "+$100.00" for credit added, or null when the row moved no money. */
  amountLabel: string | null;
  /** "$10.00 refunded", or null. Stated alongside the amount, never folded into it. */
  refundLabel: string | null;
  isRefund: boolean;
  /** Money IN (a comp credit), from `amountSign`. */
  isCredit: boolean;
  /**
   * How the row was paid — "Credit applied", "Paid by card", "$9.50 credit · $12.50 card" — or
   * null when the method is unknown or already the row's whole story (a credit-ledger row).
   */
  paymentLabel: string | null;
}

export interface UpcomingPaymentItem {
  key: string;
  title: string;
  /** "Renews Sept 7, 2026" — or "Renews automatically" when no date resolved. */
  whenLabel: string;
  /** "$234.00", "$234.00 plus tax", or null when the amount is unknowable. */
  amountLabel: string | null;
}

export interface BillingData {
  upcoming: {
    status: BillingSectionStatus;
    items: UpcomingPaymentItem[];
    /** Stripe answered partially. The section says so rather than implying completeness. */
    mayBeIncomplete: boolean;
  };
  past: { status: BillingSectionStatus; items: BillingHistoryItem[] };
}

function statusFor(hasData: boolean, isPending: boolean, error: unknown): BillingSectionStatus {
  if (hasData) return 'ready';
  if (error) return 'error';
  if (isPending) return 'loading';
  return 'ready';
}

/**
 * A readable label. Each `activityType` titles from a DIFFERENT field of `primary` — verified
 * against a real staging response, not guessed.
 *
 * The chain is ordered rather than switched on the type so an activityType we have never seen
 * still finds whichever of the four naming fields it carries. Only a row with none of them falls
 * through to the humanised type, and only a row without even that reads "Activity".
 */
function titleFor(row: AccountActivityRow): string {
  const p = row.primary ?? {};
  const named =
    p.eventName?.trim() || p.packageName?.trim() || p.itemName?.trim() || p.passUsed?.name?.trim();
  if (named) return named;
  if (row.activityType) return row.activityType.replace(/[_-]+/g, ' ');
  return 'Activity';
}

export interface BuildBillingInput {
  history: { data: { rows: AccountActivityRow[] } | undefined; isPending: boolean; error: unknown };
  upcoming: {
    data: { renewals: UpcomingPayment[]; lookupFailed: boolean } | undefined;
    isPending: boolean;
    error: unknown;
  };
  timeZone: string;
  currency?: string;
}

/**
 * Does this activity row belong on a screen called PAYMENTS?
 *
 * The endpoint is the full event timeline, and most of a pass-holder's rows are bookings that
 * moved no money — the redemption row of a class covered by their pack carries $0 by design. On
 * the Payments screen those rendered as bare name-and-date rows that looked like payments with
 * their amounts missing (Alicia, 2026-08-16: "Not showing the dollar amount of payments"). They
 * are not payments; they live in My Calendar. Kept here: anything that moved money in either
 * direction, and anything carrying a refund — a refund-only row's amount can be 0 while the
 * refund line is the whole point of showing it.
 */
/**
 * "Gentle Flow · $22.00" with no method line looked identical whether the $22 hit a card or came
 * off the client's balance (Alicia, 2026-08-16). The server already classifies the method —
 * bundle-aware, from the PURCHASE transaction's own money — so this only words it. A mixed
 * payment states both figures; a split whose amounts did not survive the wire still says
 * "Credit + card" rather than pretending to be one or the other.
 */
function paymentLabelFor(row: AccountActivityRow, currency: string): string | null {
  switch (row.paymentMethod) {
    case 'credit':
      return 'Credit applied';
    case 'card':
      return 'Paid by card';
    case 'mixed': {
      const p = row.primary ?? {};
      const s = row.secondary ?? {};
      const credit =
        typeof p.creditApplied === 'number' && p.creditApplied > 0
          ? p.creditApplied
          : typeof p.creditSpent === 'number' && p.creditSpent > 0
            ? p.creditSpent
            : typeof s.refundTargetStudioCreditsSpent === 'number'
              ? s.refundTargetStudioCreditsSpent
              : null;
      const card =
        typeof s.refundTargetAmountCharged === 'number' ? s.refundTargetAmountCharged : null;
      if (credit && card && credit > 0 && card > 0) {
        return `${formatBalance(credit, currency)} credit · ${formatBalance(card, currency)} card`;
      }
      return 'Credit + card';
    }
    default:
      return null;
  }
}

function movedMoney(row: AccountActivityRow): boolean {
  const amount = typeof row.amount === 'number' ? row.amount : null;
  const refunded = typeof row.refundedAmount === 'number' ? row.refundedAmount : 0;
  const sign = row.amountSign ?? 'debit';
  return (amount !== null && amount !== 0 && sign !== 'neutral') || refunded > 0;
}

export function buildBillingData({
  history,
  upcoming,
  timeZone,
  currency = 'USD',
}: BuildBillingInput): BillingData {
  const pastItems = (history.data?.rows ?? [])
    .filter(movedMoney)
    .map<BillingHistoryItem>((row, index) => {
      const amount = typeof row.amount === 'number' ? row.amount : null;
      const refunded = typeof row.refundedAmount === 'number' ? row.refundedAmount : 0;
      // A partially-refunded purchase stays a PURCHASE with a refund note — the server hydrates
      // refunds onto the row rather than emitting a separate one, and flipping it would
      // double-count the same money.
      const isFullyRefunded = refunded > 0 && amount !== null && refunded >= amount;

      // Direction comes from `amountSign`, not the sign of `amount` — every amount is positive and
      // a comp credit ADDED is 'credit'. 'neutral' rows (a $0 comped session) moved no money.
      const sign = row.amountSign ?? 'debit';
      const hasMoney = amount !== null && amount !== 0 && sign !== 'neutral';

      return {
        key: `${row.id ?? `row-${index}`}`,
        title: titleFor(row),
        // A real instant, read back in the studio's zone — not printed verbatim.
        dateLabel: row.occurredAt ? formatInstantInStudioZone(row.occurredAt, timeZone) : null,
        amountLabel: !hasMoney
          ? null
          : sign === 'credit'
            ? `+${formatBalance(amount as number, currency)}`
            : formatBalance(amount as number, currency),
        // Stated separately rather than by negating the amount: "$45.98" with "$10.00 refunded"
        // under it is the truth; "−$35.98" is a number that appears on no statement.
        refundLabel: refunded > 0 ? `${formatBalance(refunded, currency)} refunded` : null,
        isRefund: isFullyRefunded,
        isCredit: sign === 'credit',
        paymentLabel: paymentLabelFor(row, currency),
      };
    });

  const upcomingItems = (upcoming.data?.renewals ?? []).map<UpcomingPaymentItem>((renewal) => {
    // Epoch SECONDS from Stripe. Null is a real answer and gets its own sentence — never a
    // stranded "Renews on ." built around a hole.
    const when =
      typeof renewal.renewsAtEpochSeconds === 'number'
        ? formatInstantInStudioZone(new Date(renewal.renewsAtEpochSeconds * 1000), timeZone)
        : null;

    const amount = typeof renewal.chargeAmount === 'number' ? renewal.chargeAmount : null;

    return {
      key: `renewal-${renewal.passId}`,
      title: renewal.name?.trim() || 'Membership',
      whenLabel: when ? `Renews ${when}` : 'Renews automatically',
      amountLabel:
        amount === null
          ? // Tax applies but is unresolvable → say so rather than quote a figure the card is
            // never charged. No amount at all → say nothing.
            renewal.hasUnresolvedTax === true
              ? 'Amount includes tax'
              : null
          : renewal.hasUnresolvedTax === true
            ? `${formatBalance(amount, currency)} plus tax`
            : formatBalance(amount, currency),
    };
  });

  return {
    upcoming: {
      // `partial` is the lookupFailed case: what we have is real, it just is not provably
      // complete. Never 'ready', because that licenses "you have no upcoming charges".
      status: upcoming.data?.lookupFailed
        ? 'partial'
        : statusFor(Boolean(upcoming.data), upcoming.isPending, upcoming.error),
      items: upcomingItems,
      mayBeIncomplete: upcoming.data?.lookupFailed === true,
    },
    past: {
      status: statusFor(Boolean(history.data), history.isPending, history.error),
      items: pastItems,
    },
  };
}

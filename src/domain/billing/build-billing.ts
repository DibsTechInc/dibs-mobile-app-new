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
  /** "$45.98", "−$45.98" for a refund, or null when the row moved no money. */
  amountLabel: string | null;
  isRefund: boolean;
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

/** A readable label from whichever field the row carries. Never "undefined". */
function titleFor(row: AccountActivityRow): string {
  const candidate = row.itemName?.trim() || row.description?.trim();
  if (candidate) return candidate;
  // Fall back to the row type with its underscores removed — "subscription_started" reads badly
  // but is still true, and is better than a blank line on a money surface.
  if (row.type) return row.type.replace(/[_-]+/g, ' ');
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

export function buildBillingData({
  history,
  upcoming,
  timeZone,
  currency = 'USD',
}: BuildBillingInput): BillingData {
  const pastItems = (history.data?.rows ?? []).map<BillingHistoryItem>((row, index) => {
    const amount = typeof row.amount === 'number' ? row.amount : null;
    const refunded = typeof row.amountRefunded === 'number' ? row.amountRefunded : 0;
    // A partially-refunded purchase stays a PURCHASE with a refund annotation — the server
    // hydrates refunds onto the row rather than emitting a separate one, and flipping it here
    // would double-count it against the same money.
    const isRefund = refunded > 0 && amount !== null && refunded >= amount;
    const stamp = row.date || row.createdAt || null;

    return {
      key: `${row.id ?? 'row'}-${index}`,
      title: titleFor(row),
      // A real instant, read back in the studio's zone — not printed verbatim.
      dateLabel: stamp ? formatInstantInStudioZone(stamp, timeZone) : null,
      amountLabel:
        amount === null || amount === 0
          ? null
          : isRefund
            ? `−${formatBalance(amount, currency)}`
            : formatBalance(amount, currency),
      isRefund,
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

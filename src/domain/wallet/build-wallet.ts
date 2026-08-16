/**
 * The wallet, as a client reads it: passes, credit, cards.
 *
 * PURE TypeScript. The screen renders this and decides nothing.
 *
 * ── The one idea worth holding onto ─────────────────────────────────────────────────────────
 * Three independent reads back this screen, and each can be in a different state at the same
 * moment. An empty list therefore means one of two entirely different things — "you have none" or
 * "we could not ask" — and the whole file exists to keep those apart. Collapsing them is what
 * showed widget clients an empty wallet and an invitation to add the card they already had.
 *
 * So every section carries a `status`, and no section is allowed to infer its status from the
 * length of its own data.
 */
import type { Pass } from '@/api/schemas/passes';
import { formatBalance } from '@/domain/money/format';
import { isUnlimitedPass, remainingPassUses, remainingPassUsesLabel } from '@/domain/passes/uses';
import { passName, usablePasses } from '@/domain/passes/select';
import type { SavedCard } from '@/domain/payments/cards';
import { formatInstantInStudioZone } from '@/domain/time/studio-now';

/**
 * `loading` — the request is out; say nothing yet.
 * `ready`   — we asked and got an answer. An empty list here genuinely means "you have none".
 * `partial` — we got SOME of the answer. Show it, and say it may be incomplete.
 * `error`   — we could not ask. Offer a retry; never render this as emptiness.
 */
export type SectionStatus = 'loading' | 'ready' | 'partial' | 'error';

export interface WalletPass {
  id: number;
  /** `studio_packages.id` — the cancel endpoint keys on it alongside the pass id. */
  packageId: number | null;
  name: string;
  /** "Unlimited" or "6 classes left". */
  remainingLabel: string;
  /** The big numeral in the mock: the count, or null for an unlimited pass. */
  remainingCount: number | null;
  isUnlimited: boolean;
  /** "Expires Nov 30", or null when the pass has no expiry. */
  expiresLabel: string | null;
  /** A membership renews; a pack runs out. The distinction changes the words used. */
  isMembership: boolean;
  /**
   * Server-computed. Null for a non-membership, and for a membership on an older API build.
   * `eligibleOn` is a `YYYY-MM-DD` in the studio's zone — render with `formatIsoDate`, never
   * through `new Date()`.
   */
  cancellation: {
    canCancel: boolean;
    eligibleOn?: string | null;
    remainingCount?: number | null;
    remainingUnit?: string | null;
  } | null;
}

export interface WalletData {
  passes: { status: SectionStatus; items: WalletPass[] };
  credit: { status: SectionStatus; amount: number | null; label: string | null };
  cards: {
    status: SectionStatus;
    items: SavedCard[];
    /** Set when a card was dropped for being expired — worth saying, not worth alarming about. */
    hadExpiredCards: boolean;
  };
}

export interface BuildWalletInput {
  passes: { data: Pass[] | undefined; isPending: boolean; error: unknown };
  credit: { data: number | undefined; isPending: boolean; error: unknown };
  cards: {
    data: { items: SavedCard[]; hadExpiredCards: boolean; lookupFailed: boolean } | undefined;
    isPending: boolean;
    error: unknown;
  };
  /** The studio's IANA zone. Pass expiries are real instants and must be read back in it. */
  timeZone: string;
  currency?: string;
  now?: Date;
}

/**
 * `isPending` alone is not "loading".
 *
 * TanStack keeps the last good data through a refetch, so a section holding data is `ready` even
 * while a background request is in flight — the alternative is a wallet that blinks to skeletons
 * every time the screen regains focus. And an error with data behind it is still showable data.
 */
function statusFor(hasData: boolean, isPending: boolean, error: unknown): SectionStatus {
  if (hasData) return 'ready';
  if (error) return 'error';
  if (isPending) return 'loading';
  // Not pending, no error, no data: the request resolved with nothing. That is a real "none".
  return 'ready';
}

export function buildWalletData({
  passes,
  credit,
  cards,
  timeZone,
  currency = 'USD',
  now = new Date(),
}: BuildWalletInput): WalletData {
  /**
   * Filtered again on our side even though the endpoint filters now.
   *
   * `is_placeholder` was written inconsistently across the three hold-creation paths for years,
   * and pre-backfill rows exist. A placeholder pass is a marker for an outstanding CHARGE, not an
   * entitlement (platform invariant #4), and a defence that costs one function call does not get
   * removed on the strength of one endpoint being fixed.
   */
  const items = usablePasses(passes.data ?? [], now).map<WalletPass>((pass) => ({
    id: pass.id,
    name: passName(pass),
    remainingLabel: remainingPassUsesLabel(pass),
    remainingCount: isUnlimitedPass(pass) ? null : remainingPassUses(pass),
    packageId: typeof pass.studio_package_id === 'number' ? pass.studio_package_id : null,
    isUnlimited: isUnlimitedPass(pass),
    // `expiresAt` is a REAL INSTANT — end of day in the studio's zone, stored as true UTC — so it
    // is read back in that zone rather than printed verbatim. Verbatim would say "Dec 1" for a
    // pass the studio considers good through Nov 30. See `formatInstantInStudioZone`.
    expiresLabel: pass.expiresAt
      ? `Expires ${formatInstantInStudioZone(pass.expiresAt, timeZone)}`
      : null,
    /**
     * The ROW's `autopay` boolean, and only that.
     *
     * The package's `autopayStatus` is an ENUM — `'NONE' | 'ALLOW' | 'FORCE'` — describing what
     * the package permits, not what this pass is. They disagree in both directions in live data
     * (24 live passes are `autopay = true` on a `NONE` package; 5 are `false` on a `FORCE` one),
     * so reading the package would call a one-off purchase a membership and miss real ones.
     */
    isMembership: pass.autopay === true,
    /**
     * The server's answer on whether this membership may be cancelled yet, passed through
     * UNTOUCHED. The same value backs the endpoint's own refusal, so the button and the answer
     * cannot disagree — do not recompute `canCancel` from `eligibleOn` here.
     *
     * Undefined on an API build that predates the field, which reads as "no commitment line" —
     * the button still appears and the server still refuses if it must.
     */
    cancellation: pass.cancellation ?? null,
  }));

  const creditAmount = credit.data;
  const hasCredit = typeof creditAmount === 'number';

  return {
    passes: {
      status: statusFor(Boolean(passes.data), passes.isPending, passes.error),
      items,
    },
    credit: {
      status: statusFor(hasCredit, credit.isPending, credit.error),
      amount: hasCredit ? creditAmount : null,
      label: hasCredit ? formatBalance(creditAmount, currency) : null,
    },
    cards: {
      // `partial` is the case the backend's `lookupFailed` flag exists for: one Stripe account
      // answered and the other did not. The cards we have are real and chargeable; the list is
      // just not provably complete, and saying so is the honest option.
      status: cards.data?.lookupFailed
        ? 'partial'
        : statusFor(Boolean(cards.data), cards.isPending, cards.error),
      items: cards.data?.items ?? [],
      hadExpiredCards: cards.data?.hadExpiredCards ?? false,
    },
  };
}

/**
 * "What is about to pay for this?" — the sentence above the Confirm button. Pure TypeScript.
 * Only `'ready'` licenses "you have no card on file"; an empty list otherwise means "not asked".
 */
import type { SavedCard } from './cards';

/** Where the card list has got to. Mirrors the wallet's own status — see `useWallet`. */
export type CardLookupStatus = 'idle' | 'loading' | 'ready' | 'error' | 'guest';

export interface CheckoutPaymentInput {
  /** Outstanding lines a CARD will pay for. */
  chargeableCount: number;
  /** Outstanding lines a PASS covers. They cost nothing and open no sheet. */
  coveredCount: number;
  /**
   * The distinct pass names about to be spent, in cart order.
   *
   * Names rather than ids because this is copy. Two lines covered by one pass is one name, which
   * is why the caller de-duplicates before this sees it.
   */
  passNames: string[];
  /** The card the sheet will open on, when we know it. */
  card: SavedCard | null;
  status: CardLookupStatus;
}

export interface CheckoutPaymentSummary {
  /**
   * The line above the button. Null when there is nothing TRUE to say — which is a real outcome,
   * not a failure: before Stripe answers, silence is the only honest option.
   */
  label: string | null;
  /** The qualifier beneath it. Null when the label needs none. */
  caption: string | null;
  /**
   * True when the client has no card and the cart needs one.
   *
   * Only ever set from `status === 'ready'`. The caller uses it to make "Add a payment method" the
   * primary action rather than offering a Confirm that cannot succeed — the widget's packages-page
   * rule (shared CLAUDE.md, 2026-08-06).
   */
  needsCard: boolean;
}

/** "your 10-class Package" / "your 10-class Package and Month Unlimited" / "your passes". */
function passPhrase(names: string[]): string {
  const named = names.filter((name) => name.trim().length > 0);
  if (named.length === 0) return 'your pass';
  if (named.length === 1) return `your ${named[0]}`;
  if (named.length === 2) return `your ${named[0]} and ${named[1]}`;
  // Past two, naming them all turns a reassurance into a list. The lines above already name each.
  return 'your passes';
}

export function describeCheckoutPayment({
  chargeableCount,
  coveredCount,
  passNames,
  card,
  status,
}: CheckoutPaymentInput): CheckoutPaymentSummary {
  const passes = passPhrase(passNames);

  // ── Nothing but passes. No card is involved, so no card is mentioned. ──────────────────────
  if (chargeableCount === 0) {
    if (coveredCount === 0) return { label: null, caption: null, needsCard: false };
    return {
      label: `Paying with ${passes}`,
      caption: coveredCount === 1 ? null : `Covers all ${coveredCount} classes.`,
      needsCard: false,
    };
  }

  // ── A card is involved. What we can honestly say depends on whether we have asked. ─────────
  const mixedPrefix = coveredCount > 0 ? `${passes}, then ` : '';

  if (card) {
    return {
      label: `Paying with ${mixedPrefix}${card.label}`,
      // The whole reason this is a caption and not a promise. The sheet is where the card is
      // chosen; this row says which one it will open on.
      caption: 'You can pick a different card when you confirm.',
      needsCard: false,
    };
  }

  if (status === 'ready') {
    // Asked, and there genuinely is none. This is the only branch allowed to say so.
    return {
      label: coveredCount > 0 ? `Paying with ${passes}, then a card` : 'No card saved yet',
      caption: 'You can add one when you confirm.',
      needsCard: true,
    };
  }

  // Not asked, still asking, or the lookup failed. Say what we know — which, for a mixed cart, is
  // still the pass half — and claim nothing about cards.
  return {
    label: coveredCount > 0 ? `Paying with ${passes}, then a card` : null,
    caption: null,
    needsCard: false,
  };
}

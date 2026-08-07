/**
 * The client's saved cards: one merged, de-duplicated, ordered list.
 *
 * PURE TypeScript.
 *
 * ── Why merging is a domain rule and not a screen's job ─────────────────────────────────────
 * `stripe/get-all-payments` returns TWO arrays, because every saved card can exist twice: once on
 * the Dibs PLATFORM customer and once on the STUDIO's connected-account customer. The client has
 * one card and must see one row.
 *
 * This file is a deliberate port of `dibs-widget-new/src/hooks/usePaymentMethodsOwner.js`, down to
 * the de-duplication key and the ordering. Invariant #6 of the master plan: *numbers must match
 * the web*. If the app collapsed two rows the widget shows separately, a client would remove "the
 * card" here and find it still charging them there.
 *
 * The widget arrived at these rules the expensive way, and three of them are load-bearing:
 *
 *  1. **The key is `brand + last4 + exp_month + exp_year + fingerprint`, not the fingerprint
 *     alone.** A fingerprint identifies a card NUMBER, so re-saving the same card after an expiry
 *     update produces two entries with one fingerprint and different dates — genuinely two stored
 *     payment methods, either of which can be charged. Collapsing them would show one expiry date
 *     for a card that has two. (The local sandbox has exactly this: five copies of 4242 sharing
 *     one fingerprint across five expiry dates.) The appointment path in the widget dedupes on
 *     `last4` alone; that is a known bug there, not a pattern to copy.
 *
 *  2. **Connected-account cards are added FIRST, so a studio-side copy wins the de-duplication.**
 *     `platform` is not a label — it is part of the charge contract. The backend clones a `'Dibs'`
 *     card onto the connected account before charging it and skips that step for `'Studio'`.
 *     Keeping the copy that already lives where the money moves means one less step that can fail.
 *
 *  3. **The exact strings `'Dibs'` and `'Studio'`.** Lower-casing them silently stops the clone
 *     and sends a platform card to Stripe unchanged.
 */
import type { StripePaymentMethod } from '@/api/schemas/payments';

/**
 * Where a saved card physically lives, and therefore what must happen before it can be charged.
 * The casing is a wire contract — see rule 3 above.
 */
export type CardPlatform = 'Studio' | 'Dibs';

export interface SavedCard {
  /** The Stripe PaymentMethod id. `pm_…` or `card_…` — both are chargeable. */
  id: string;
  platform: CardPlatform;
  /** Title-cased for display: "Visa", "American Express". */
  brand: string;
  last4: string;
  expMonth: number;
  /** Always four digits, normalized. Use this for comparisons and display. */
  expYear: number;
  fingerprint: string | null;
  /** The connected customer's invoice default, as flagged by the backend. */
  isDefault: boolean;
  /** "Visa ending 4242" */
  label: string;
  /** "Expires 04/28" */
  expiryLabel: string;
  /**
   * Exactly what Stripe sent, untouched.
   *
   * `POST /stripe/remove-card` matches a card by comparing these fields with `===` against the
   * live `pm.card` on BOTH Stripe accounts. Sending our prettified values instead would compare
   * `"American Express"` against `"american_express"` and quietly remove nothing while answering
   * that it could not find the card. Display values and wire values are not the same values.
   */
  raw: { brand: string; exp_month: number; exp_year: number; last4: string };
}

/**
 * TWO id prefixes are chargeable. **Never narrow this to `pm_`.**
 *
 * `card_…` is a PaymentMethod that represents a legacy Card object — cards attached through the
 * pre-2021 Sources API keep their original id when surfaced through the PaymentMethods API, and
 * they charge normally. A `pm_`-only predicate shipped in the widget on 2026-07-28 and caused a
 * two-day production outage: every legacy-card client saw their card selected in the picker while
 * every other surface resolved "no chargeable card" — a loop with no exit. It affected 91% of
 * studio 210's active roster and 76% of studio 88's, and went unreported because subscriptions
 * charge server-side and never consult this predicate.
 *
 * The set is closed (the stack that minted those ids was decommissioned 2026-07-22) and slowly
 * shrinking, but it will not be empty for years. Must stay in lockstep with
 * `dibs-widget-new/src/utils/paymentMethod.js` and
 * `dibs-api/services/shared/stripe/payment-method-id.js`.
 */
const CHARGEABLE_ID_PREFIXES = ['pm_', 'card_'] as const;

export function isChargeablePaymentMethodId(id: unknown): id is string {
  return typeof id === 'string' && CHARGEABLE_ID_PREFIXES.some((prefix) => id.startsWith(prefix));
}

/**
 * Stripe returns two-digit years on some legacy card objects. `29 > 2026` is false, which would
 * mark a perfectly good card expired and hide it.
 */
function fullYear(expYear: number): number {
  return expYear < 100 ? 2000 + expYear : expYear;
}

/** Title-case a Stripe brand slug: `visa` → `Visa`, `american_express` → `American Express`. */
function brandLabel(brand: string): string {
  return brand
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function toSavedCard(method: StripePaymentMethod, platform: CardPlatform): SavedCard | null {
  const card = method.card;
  // The id prefix is NOT what makes a row safe to render — the presence of card details is. A
  // half-formed object with a valid-looking id would otherwise render as "undefined ending null",
  // which is precisely what a client saw on the widget's packages page (shared CLAUDE.md,
  // 2026-08-06).
  if (!isChargeablePaymentMethodId(method.id) || !card) return null;

  const brand = card.brand?.trim() || card.display_brand?.trim();
  const last4 = card.last4?.trim();
  if (!brand || !last4 || typeof card.exp_month !== 'number' || typeof card.exp_year !== 'number') {
    return null;
  }

  const fingerprint = card.fingerprint ?? null;
  // Assigned once, over the whole list, by `markDefault` — never per-card. See the note there.
  const isDefault = false;

  const year = fullYear(card.exp_year);

  return {
    id: method.id,
    platform,
    brand: brandLabel(brand),
    last4,
    expMonth: card.exp_month,
    expYear: year,
    fingerprint,
    isDefault,
    label: `${brandLabel(brand)} ending ${last4}`,
    expiryLabel: `Expires ${String(card.exp_month).padStart(2, '0')}/${String(year).slice(-2)}`,
    // `card.brand` verbatim — NOT the title-cased one, and not `display_brand`, which Stripe
    // sometimes renders differently from the field the backend compares against.
    raw: {
      brand: card.brand ?? brand,
      exp_month: card.exp_month,
      exp_year: card.exp_year,
      last4,
    },
  };
}

export interface MergeCardsInput {
  platformCards: StripePaymentMethod[];
  connectedCards: StripePaymentMethod[];
  defaultPaymentMethodId?: string | null;
  defaultFingerprint?: string | null;
  /**
   * Used only to decide what has expired. A card expires on a real calendar date, not at a
   * studio's wall-clock time, so this is one of the few places the device clock is the right one.
   */
  now?: Date;
}

export interface MergedCards {
  cards: SavedCard[];
  /**
   * True when a card was dropped for being expired. Worth telling the client — "we removed a card
   * you can no longer use" is information; a silently shorter list is a mystery.
   */
  hadExpiredCards: boolean;
}

/**
 * Exactly ONE card is the default. Flag it, and only it.
 *
 * The backend flags `is_default` by FINGERPRINT, which is right for its purpose — the platform
 * copy and the connected copy of one card are the same card, and either might survive the merge,
 * so both need the flag for the merged row to carry it. It is wrong as a per-row answer, because
 * a fingerprint identifies a card NUMBER: any client who re-saved the same card after an expiry
 * update has several rows sharing one, and every one of them comes back flagged.
 *
 * Observed live on staging 2026-08-06 — five saved cards, one fingerprint, and the wallet
 * rendered "Default" on all five. Which is worse than useless: the badge exists to answer "which
 * card gets charged", and five answers is no answer.
 *
 * So: an exact id match wins, because `invoice_settings.default_payment_method` names one
 * PaymentMethod. The fingerprint is the fallback for the case it exists to serve — the named
 * method is not in this list, but its twin on the other account is — and even then only the first
 * match, in merge order, so the connected-account copy wins.
 */
function markDefault(
  cards: SavedCard[],
  defaultPaymentMethodId: string | null,
  defaultFingerprint: string | null,
  backendFlagged: Set<string>,
): void {
  const exact = defaultPaymentMethodId
    ? cards.find((card) => card.id === defaultPaymentMethodId)
    : undefined;

  const byFingerprint = defaultFingerprint
    ? cards.find((card) => card.fingerprint === defaultFingerprint)
    : undefined;

  // The backend's own flag, but only when it named exactly one card — otherwise it is the
  // fingerprint over-match above wearing a different hat.
  const flagged =
    backendFlagged.size === 1 ? cards.find((card) => backendFlagged.has(card.id)) : undefined;

  const chosen = exact ?? flagged ?? byFingerprint;
  if (chosen) chosen.isDefault = true;
}

export function mergeSavedCards({
  platformCards,
  connectedCards,
  defaultPaymentMethodId = null,
  defaultFingerprint = null,
  now = new Date(),
}: MergeCardsInput): MergedCards {
  const seen = new Set<string>();
  const merged: SavedCard[] = [];
  const backendFlagged = new Set<string>();

  const add = (methods: StripePaymentMethod[], platform: CardPlatform) => {
    for (const method of methods) {
      const card = toSavedCard(method, platform);
      if (!card) continue;
      if (method.is_default === true) backendFlagged.add(card.id);
      const key = `${card.brand}|${card.last4}|${card.expMonth}|${card.expYear}|${card.fingerprint ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(card);
    }
  };

  // Connected first, so the studio-side copy is the one that survives de-duplication.
  add(connectedCards, 'Studio');
  add(platformCards, 'Dibs');

  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  // A card is good through the LAST day of its expiry month, so `>=` on the month is right.
  const valid = merged.filter(
    (card) => card.expYear > currentYear || (card.expYear === currentYear && card.expMonth >= currentMonth),
  );

  // Only the surviving cards are candidates: flagging one that was then dropped for being expired
  // would leave a list with no default at all.
  markDefault(valid, defaultPaymentMethodId, defaultFingerprint, backendFlagged);

  // Ordering — the one place this deliberately differs from the widget, which sorts on platform
  // alone. The default card goes first because it is the one that will actually be charged, and
  // therefore the one a client opening the wallet is looking for. This changes the ORDER only:
  // the same cards are present, so nothing about parity with the web is affected.
  valid.sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    if (a.platform !== b.platform) return a.platform === 'Studio' ? -1 : 1;
    return 0;
  });

  return { cards: valid, hadExpiredCards: merged.length > valid.length };
}

/**
 * The card that would be charged, or null.
 *
 * Null is a real answer and callers must treat it as one. Falling back to the first card is how
 * the widget's summary row came to name a card the charge would never touch.
 */
export function selectDefaultCard(cards: SavedCard[]): SavedCard | null {
  return cards.find((card) => card.isDefault) ?? cards[0] ?? null;
}

/**
 * What `POST /stripe/remove-card` needs.
 *
 * The endpoint does NOT take a PaymentMethod id — it matches by card ATTRIBUTES across both Stripe
 * accounts, which is what lets it detach both copies of a card that exists twice. Sending the id
 * alone would silently remove nothing.
 */
export interface RemoveCardPayload {
  platform: CardPlatform;
  card: SavedCard['raw'];
}

export function toRemoveCardPayload(card: SavedCard): RemoveCardPayload {
  // `card.raw`, never the display fields. See the note on `SavedCard.raw`.
  return { platform: card.platform, card: { ...card.raw } };
}

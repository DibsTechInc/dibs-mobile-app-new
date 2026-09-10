/**
 * Which cart line carries the FIRST-CLASS PRICE — decided in exactly one place (2026-09-10).
 *
 * The rule (PLAN D6/D7): the client must be eligible; a line must not be pass-covered (the pass
 * wins unless the client explicitly chooses otherwise, which the caller expresses as an
 * override); the line's row must carry `first_class_offer`; among the candidates the HIGHEST
 * saving wins; a tie goes to the EARLIEST start. Exactly one line, ever — the server refuses a
 * second with `first_class_multiple_items`, and the audit is one row per client per studio.
 *
 * PURE TypeScript. The cart builder, the checkout request and the screen all read this one
 * answer, so the switch on the line, the flag on the request and the total on the button cannot
 * disagree about which class the offer is on.
 */
import type { FirstClassOffer } from '@/api/schemas/schedule';
import { parseStoredTime } from '@/domain/time/studio-now';

/** What the chooser knows about the client. Derived from the offer endpoint; never from a feed. */
export interface FirstClassEligibility {
  /** True ONLY when the endpoint resolved and said so. A failed read is `false` here AND unknown to the UI. */
  eligible: boolean;
}

export interface FirstClassCandidate {
  eventId: number;
  /** Stored wall-clock ISO string, for the tie-break. */
  startsAt: string;
  /** The row's own offer, from the feed. Null = the studio's price does not beat this class. */
  offer: FirstClassOffer | null;
  /** A pass the client holds covers this line. The offer never displaces a pass on its own. */
  coveredByPass: boolean;
  /** The line can take a card/credit price at all (not full, not free, not unpriced). */
  chargeable: boolean;
}

export interface ChooseFirstClassLineOptions {
  /**
   * The line the client chose to price with the first-class price INSTEAD of their pass. Only
   * honoured when that line is otherwise a candidate; it then wins outright.
   */
  overPassEventId?: number | null;
  /** Lines the server has refused the offer on this session. Never chosen again until the cart changes. */
  excludedEventIds?: ReadonlySet<number>;
}

const startMs = (startsAt: string): number => {
  try {
    return parseStoredTime(startsAt).getTime();
  } catch {
    return Number.POSITIVE_INFINITY;
  }
};

/**
 * @returns the event id that carries the offer, or null when nothing does.
 */
export function chooseFirstClassLine(
  candidates: readonly FirstClassCandidate[],
  eligibility: FirstClassEligibility | null | undefined,
  { overPassEventId = null, excludedEventIds }: ChooseFirstClassLineOptions = {},
): number | null {
  if (!eligibility || eligibility.eligible !== true) return null;

  const usable = candidates.filter(
    (c) =>
      c.offer !== null &&
      c.offer.priceCents > 0 &&
      !(excludedEventIds && excludedEventIds.has(c.eventId)) &&
      // A covered line qualifies ONLY as the explicit override; a chargeable one always does.
      (c.coveredByPass ? c.eventId === overPassEventId : c.chargeable),
  );
  if (usable.length === 0) return null;

  const override = usable.find((c) => c.eventId === overPassEventId);
  if (override) return override.eventId;

  const best = usable.reduce((winner, c) => {
    const winnerSavings = winner.offer?.savingsCents ?? 0;
    const savings = c.offer?.savingsCents ?? 0;
    if (savings > winnerSavings) return c;
    if (savings < winnerSavings) return winner;
    return startMs(c.startsAt) < startMs(winner.startsAt) ? c : winner;
  });
  return best.eventId;
}

/**
 * The one sentence the checkout screen shows when the server refuses `first_class_not_eligible`.
 * Handled exactly like `price_changed`: the line re-renders from the server's breakdown and the
 * offer is dropped from that line.
 */
export const FIRST_CLASS_NOT_ELIGIBLE_COPY =
  'The first-class price no longer applies — the regular price is shown.';

/** "First class price — $15 instead of $22". Mirrors the server's `describeFirstClassOffer`. */
export function describeFirstClassOffer(priceCents: number, insteadOfCents: number): string {
  const fmt = (cents: number) => {
    const dollars = cents / 100;
    return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
  };
  return `First class price — ${fmt(priceCents)} instead of ${fmt(insteadOfCents)}`;
}

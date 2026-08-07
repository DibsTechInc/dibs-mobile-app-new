import type { StripePaymentMethod } from '@/api/schemas/payments';

import {
  isChargeablePaymentMethodId,
  mergeSavedCards,
  selectDefaultCard,
  toRemoveCardPayload,
} from '../cards';

const NOW = new Date('2026-08-06T12:00:00Z');

function pm(overrides: {
  id?: string;
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  fingerprint?: string | null;
  is_default?: boolean;
}): StripePaymentMethod {
  return {
    id: overrides.id ?? 'pm_test',
    card: {
      brand: overrides.brand ?? 'visa',
      last4: overrides.last4 ?? '4242',
      exp_month: overrides.exp_month ?? 4,
      exp_year: overrides.exp_year ?? 2028,
      fingerprint: overrides.fingerprint === undefined ? 'fp_abc' : overrides.fingerprint,
    },
    ...(overrides.is_default === undefined ? {} : { is_default: overrides.is_default }),
  } as StripePaymentMethod;
}

describe('isChargeablePaymentMethodId', () => {
  // The July 2026 outage in one test. Narrowing this to `pm_` broke checkout for 91% of studio
  // 210's active roster; if this assertion ever fails, that outage is back.
  it('accepts legacy card_ ids as well as pm_', () => {
    expect(isChargeablePaymentMethodId('pm_1TYZ3p3fZx2YZEAVKA9JJbr4')).toBe(true);
    expect(isChargeablePaymentMethodId('card_1H7abcDEF')).toBe(true);
  });

  it('rejects every other shape', () => {
    for (const id of ['src_123', 'seti_123', 'tok_123', '', 'pm', null, undefined, 42, {}]) {
      expect(isChargeablePaymentMethodId(id)).toBe(false);
    }
  });
});

describe('mergeSavedCards', () => {
  it('collapses the platform and connected copies of one card into a single row', () => {
    const { cards } = mergeSavedCards({
      connectedCards: [pm({ id: 'pm_connected' })],
      platformCards: [pm({ id: 'pm_platform' })],
      now: NOW,
    });

    expect(cards).toHaveLength(1);
    // The connected copy wins: it already lives where the charge happens, so choosing it removes
    // the clone step from the charge path.
    expect(cards[0]).toMatchObject({ id: 'pm_connected', platform: 'Studio' });
  });

  it('keeps same-number cards that differ by expiry as separate rows', () => {
    // The local sandbox holds five copies of 4242 sharing one fingerprint across five expiry
    // dates. Each is a distinct stored PaymentMethod and each can be charged, so collapsing them
    // on fingerprint alone would show one expiry for a card that has several.
    const { cards } = mergeSavedCards({
      connectedCards: [],
      platformCards: [
        pm({ id: 'pm_a', exp_month: 2, exp_year: 2029 }),
        pm({ id: 'pm_b', exp_month: 5, exp_year: 2039 }),
        pm({ id: 'pm_c', exp_month: 7, exp_year: 2029 }),
      ],
      now: NOW,
    });

    expect(cards.map((card) => card.id)).toEqual(['pm_a', 'pm_b', 'pm_c']);
  });

  it('drops expired cards and says that it did', () => {
    const { cards, hadExpiredCards } = mergeSavedCards({
      connectedCards: [],
      platformCards: [
        pm({ id: 'pm_dead', exp_month: 7, exp_year: 2026, fingerprint: 'fp_dead' }),
        pm({ id: 'pm_live', exp_month: 9, exp_year: 2026, fingerprint: 'fp_live' }),
      ],
      now: NOW,
    });

    expect(cards.map((card) => card.id)).toEqual(['pm_live']);
    expect(hadExpiredCards).toBe(true);
  });

  it('treats a card as good through the last day of its expiry month', () => {
    const { cards } = mergeSavedCards({
      connectedCards: [],
      // Expires this month. Still chargeable until the month ends.
      platformCards: [pm({ id: 'pm_thismonth', exp_month: 8, exp_year: 2026 })],
      now: NOW,
    });

    expect(cards).toHaveLength(1);
  });

  it('normalizes a two-digit expiry year instead of reading it as expired', () => {
    const { cards, hadExpiredCards } = mergeSavedCards({
      connectedCards: [],
      platformCards: [pm({ id: 'pm_legacy', exp_month: 4, exp_year: 29 })],
      now: NOW,
    });

    expect(hadExpiredCards).toBe(false);
    expect(cards[0]).toMatchObject({ expYear: 2029, expiryLabel: 'Expires 04/29' });
  });

  it('flags the default by fingerprint, so either copy of the card carries it', () => {
    const { cards } = mergeSavedCards({
      connectedCards: [],
      platformCards: [
        pm({ id: 'pm_other', fingerprint: 'fp_other', last4: '1111' }),
        pm({ id: 'pm_default', fingerprint: 'fp_default', last4: '2222' }),
      ],
      defaultFingerprint: 'fp_default',
      now: NOW,
    });

    // Default first — it is the card that will be charged, so it is the one being looked for.
    expect(cards[0]).toMatchObject({ id: 'pm_default', isDefault: true });
    expect(cards[1]).toMatchObject({ id: 'pm_other', isDefault: false });
  });

  it('refuses a method with no card details, whatever its id looks like', () => {
    const halfFormed = { id: 'pm_looks_fine' } as StripePaymentMethod;
    const { cards } = mergeSavedCards({
      connectedCards: [],
      platformCards: [halfFormed],
      now: NOW,
    });

    // "Undefined ending null" is what this prevents. The id prefix is not the shape check.
    expect(cards).toHaveLength(0);
  });

  it('writes a human label and a padded expiry', () => {
    const { cards } = mergeSavedCards({
      connectedCards: [],
      platformCards: [pm({ brand: 'american_express', last4: '0005', exp_month: 4, exp_year: 2028 })],
      now: NOW,
    });

    expect(cards[0]).toMatchObject({
      brand: 'American Express',
      label: 'American Express ending 0005',
      expiryLabel: 'Expires 04/28',
    });
  });
});

describe('selectDefaultCard', () => {
  it('returns null for an empty list rather than inventing one', () => {
    expect(selectDefaultCard([])).toBeNull();
  });

  it('prefers the flagged default over the first card', () => {
    const { cards } = mergeSavedCards({
      connectedCards: [],
      platformCards: [
        pm({ id: 'pm_first', fingerprint: 'fp_1', last4: '1111' }),
        pm({ id: 'pm_default', fingerprint: 'fp_2', last4: '2222', is_default: true }),
      ],
      now: NOW,
    });

    expect(selectDefaultCard(cards)?.id).toBe('pm_default');
  });
});

describe('toRemoveCardPayload', () => {
  it('sends Stripe’s own values, not the ones we display', () => {
    // The endpoint matches by attribute equality against the live `pm.card`. "American Express"
    // never equals "american_express", so a prettified payload removes nothing and reports that
    // it could not find the card.
    const { cards } = mergeSavedCards({
      connectedCards: [pm({ id: 'pm_x', brand: 'american_express', last4: '0005', exp_month: 4, exp_year: 2028 })],
      platformCards: [],
      now: NOW,
    });

    expect(toRemoveCardPayload(cards[0])).toEqual({
      platform: 'Studio',
      card: { brand: 'american_express', last4: '0005', exp_month: 4, exp_year: 2028 },
    });
  });
});

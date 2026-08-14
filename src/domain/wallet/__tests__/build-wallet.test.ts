import type { Pass } from '@/api/schemas/passes';

import { buildWalletData, type BuildWalletInput } from '../build-wallet';

const NOW = new Date('2026-08-06T12:00:00Z');
const TZ = 'America/Los_Angeles';

function pass(overrides: Partial<Pass> = {}): Pass {
  return {
    id: 1,
    totalUses: 10,
    usesCount: 4,
    expiresAt: '2026-11-30T00:00:00.000Z',
    studioPackage: { packageName: '10-Class Pass' },
    ...overrides,
  } as Pass;
}

function input(overrides: Partial<BuildWalletInput> = {}): BuildWalletInput {
  return {
    passes: { data: [], isPending: false, error: null },
    credit: { data: 0, isPending: false, error: null },
    cards: { data: { items: [], hadExpiredCards: false, lookupFailed: false }, isPending: false, error: null },
    timeZone: TZ,
    now: NOW,
    ...overrides,
  };
}

describe('section status', () => {
  // The whole point of the file: an empty list and a failed request must never look alike.
  it('reports error, not emptiness, when a read failed', () => {
    const wallet = buildWalletData(
      input({
        passes: { data: undefined, isPending: false, error: new Error('boom') },
        credit: { data: undefined, isPending: false, error: new Error('boom') },
        cards: { data: undefined, isPending: false, error: new Error('boom') },
      }),
    );

    expect(wallet.passes.status).toBe('error');
    expect(wallet.credit.status).toBe('error');
    expect(wallet.cards.status).toBe('error');
    // And nothing pretends to be a number. `$0.00` beside "you have no credit" for someone
    // holding $900 is the failure this guards.
    expect(wallet.credit.amount).toBeNull();
    expect(wallet.credit.label).toBeNull();
  });

  it('reports ready for a genuinely empty answer', () => {
    const wallet = buildWalletData(input());
    expect(wallet.passes.status).toBe('ready');
    expect(wallet.credit.status).toBe('ready');
    expect(wallet.credit.label).toBe('$0.00');
  });

  it('stays ready while a refetch is in flight over existing data', () => {
    const wallet = buildWalletData(
      input({ passes: { data: [pass()], isPending: true, error: null } }),
    );
    // Otherwise the wallet blinks to skeletons every time the screen regains focus.
    expect(wallet.passes.status).toBe('ready');
    expect(wallet.passes.items).toHaveLength(1);
  });

  it('reports partial when Stripe answered for one account and not the other', () => {
    const wallet = buildWalletData(
      input({
        cards: {
          data: { items: [], hadExpiredCards: false, lookupFailed: true },
          isPending: false,
          error: null,
        },
      }),
    );

    // Not `ready` — an incomplete list presented as complete is how a client with a saved card
    // gets told to add one.
    expect(wallet.cards.status).toBe('partial');
  });
});

describe('passes', () => {
  it('never shows a placeholder pass', () => {
    // Platform invariant #4. Filtered on our side as well as the endpoint's, because the flag was
    // written inconsistently for years and pre-backfill rows exist.
    const wallet = buildWalletData(
      input({
        passes: {
          data: [pass({ id: 7, is_placeholder: true }), pass({ id: 8 })],
          isPending: false,
          error: null,
        },
      }),
    );

    expect(wallet.passes.items.map((item) => item.id)).toEqual([8]);
  });

  it('renders an unlimited pass as Unlimited, never as a number', () => {
    const wallet = buildWalletData(
      input({
        passes: {
          data: [pass({ totalUses: null, usesCount: 12, autopay: true })],
          isPending: false,
          error: null,
        },
      }),
    );

    // `null - 12` is -12. A membership must never read as over-spent.
    expect(wallet.passes.items[0]).toMatchObject({
      remainingLabel: 'Unlimited',
      remainingCount: null,
      isUnlimited: true,
      isMembership: true,
    });
  });

  it('reads membership off the pass row, never off the package enum', () => {
    // `studioPackage.autopayStatus` is 'NONE' | 'ALLOW' | 'FORCE' — what the PACKAGE permits, not
    // what this pass is. Live data disagrees in both directions, so reading it would call a
    // one-off purchase a membership and miss real ones. Shape captured from staging 2026-08-06.
    const wallet = buildWalletData(
      input({
        passes: {
          data: [
            pass({ id: 1, autopay: true, studioPackage: { packageName: 'A', autopayStatus: 'NONE' } }),
            pass({ id: 2, autopay: false, studioPackage: { packageName: 'B', autopayStatus: 'FORCE' } }),
          ],
          isPending: false,
          error: null,
        },
      }),
    );

    expect(wallet.passes.items.map((item) => item.isMembership)).toEqual([true, false]);
  });

  it('treats the 999 sentinel as unlimited too', () => {
    const wallet = buildWalletData(
      input({ passes: { data: [pass({ totalUses: 999 })], isPending: false, error: null } }),
    );
    expect(wallet.passes.items[0].isUnlimited).toBe(true);
  });

  it('drops a pass that has expired', () => {
    const wallet = buildWalletData(
      input({
        passes: {
          data: [pass({ id: 3, expiresAt: '2026-01-01T00:00:00.000Z' })],
          isPending: false,
          error: null,
        },
      }),
    );
    expect(wallet.passes.items).toHaveLength(0);
  });

  it('prints the expiry date the studio would print, not the one UTC would', () => {
    // `expiresAt` is end-of-day in the studio's zone stored as true UTC, so Nov 30 in Los Angeles
    // is `2026-12-01T07:59:59Z`. Printed verbatim that reads "Dec 1" — a day the client's pass
    // does not have.
    const wallet = buildWalletData(
      input({
        passes: {
          data: [pass({ expiresAt: '2026-12-01T07:59:59.999Z' })],
          isPending: false,
          error: null,
        },
      }),
    );

    expect(wallet.passes.items[0].expiresLabel).toBe('Expires Nov 30');
  });

  it('says nothing rather than "undefined" when a pass has no package name', () => {
    const wallet = buildWalletData(
      input({ passes: { data: [pass({ studioPackage: null })], isPending: false, error: null } }),
    );
    expect(wallet.passes.items[0].name).toBe('Your pass');
  });
});

describe('credit', () => {
  it('always shows cents, because a balance is not an approximation', () => {
    const wallet = buildWalletData(
      input({ credit: { data: 40, isPending: false, error: null } }),
    );
    expect(wallet.credit.label).toBe('$40.00');
  });

  it('honours the studio currency', () => {
    const wallet = buildWalletData(
      input({ credit: { data: 40, isPending: false, error: null }, currency: 'CAD' }),
    );
    expect(wallet.credit.label).toBe('CA$40.00');
  });
});

describe('membership cancellation is the SERVER\'s answer, passed through', () => {
  const membership = (cancellation: unknown) =>
    buildWalletData(
      input({
        passes: {
          data: [pass({ autopay: true, studio_package_id: 557, cancellation } as Partial<Pass>)],
          isPending: false,
          error: null,
        },
      }),
    ).passes.items[0];

  it('carries canCancel and the date through untouched', () => {
    const item = membership({
      canCancel: false,
      eligibleOn: '2026-11-02',
      remainingCount: 2,
      remainingUnit: 'month',
    });

    expect(item.cancellation).toEqual({
      canCancel: false,
      eligibleOn: '2026-11-02',
      remainingCount: 2,
      remainingUnit: 'month',
    });
  });

  it('does NOT re-derive canCancel from the date', () => {
    // Two answers to one question is the bug this shape exists to prevent. Even a server answer
    // that looks internally odd is passed through: the server is the one that refuses.
    const item = membership({ canCancel: true, eligibleOn: '2099-01-01' });
    expect(item.cancellation?.canCancel).toBe(true);
  });

  it('is null on an API build that predates the field', () => {
    // Reads as "no commitment line" — the button still appears, and the server still refuses if
    // it must. A missing field must never render as "cancellation blocked".
    expect(membership(undefined)?.cancellation).toBeNull();
  });

  it('carries the package id the cancel endpoint keys on', () => {
    const item = membership({ canCancel: true });
    expect(item.packageId).toBe(557);
  });

  it('reports a missing package id as null rather than undefined', () => {
    const item = buildWalletData(
      input({ passes: { data: [pass({ autopay: true })], isPending: false, error: null } }),
    ).passes.items[0];
    expect(item.packageId).toBeNull();
  });
});

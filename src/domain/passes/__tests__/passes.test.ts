/**
 * The pass rules. Most of this file is one trap, tested from several directions.
 *
 * `totalUses === null` means UNLIMITED, and in JavaScript `null - usesCount` is a NEGATIVE
 * NUMBER — so a naive implementation does not merely lose an unlimited pass, it reports it as
 * over-spent. That has shipped six times across this platform. These tests are the seventh
 * surface refusing to repeat it.
 */
import type { Pass } from '@/api/schemas/passes';

import {
  choosePassForClass,
  isUsablePass,
  passName,
  sortPassesByPriority,
  usablePasses,
} from '../select';
import { isUnlimitedPass, remainingPassUses, remainingPassUsesLabel, UNLIMITED_SENTINEL } from '../uses';

const NOW = new Date('2026-08-06T12:00:00.000Z');

function pass(overrides: Partial<Pass> = {}): Pass {
  return {
    id: 1,
    totalUses: 10,
    usesCount: 3,
    expiresAt: '2026-12-31T00:00:00.000Z',
    is_placeholder: false,
    private_pass: false,
    studioPackage: { packageName: '10-Class Pass' },
    ...overrides,
  } as Pass;
}

describe('the unlimited rule', () => {
  it('treats null as unlimited, not as zero or missing', () => {
    expect(isUnlimitedPass(pass({ totalUses: null }))).toBe(true);
    expect(remainingPassUses(pass({ totalUses: null, usesCount: 400 }))).toBe(Number.POSITIVE_INFINITY);
  });

  it('treats the legacy 999 sentinel the same way', () => {
    expect(isUnlimitedPass(pass({ totalUses: UNLIMITED_SENTINEL }))).toBe(true);
    expect(remainingPassUses(pass({ totalUses: 999, usesCount: 50 }))).toBe(Number.POSITIVE_INFINITY);
  });

  it('NEVER reports an unlimited pass as over-spent', () => {
    // The exact failure: `null - 3` is -3 in JS, so the pass reads as spent and vanishes from
    // every surface — which is how a member was charged $22 for a class their membership covered.
    const membership = pass({ totalUses: null, usesCount: 3 });
    expect(remainingPassUses(membership)).toBeGreaterThan(0);
    expect(isUsablePass(membership, NOW)).toBe(true);
  });

  it('never returns a negative remainder for a genuinely spent pack', () => {
    expect(remainingPassUses(pass({ totalUses: 10, usesCount: 12 }))).toBe(0);
  });

  it('labels unlimited in words rather than rendering a number', () => {
    expect(remainingPassUsesLabel(pass({ totalUses: null }))).toBe('Unlimited');
    expect(remainingPassUsesLabel(pass({ totalUses: 10, usesCount: 3 }))).toBe('7 classes left');
    expect(remainingPassUsesLabel(pass({ totalUses: 10, usesCount: 9 }))).toBe('1 class left');
  });

  it('copes with a missing usesCount', () => {
    expect(remainingPassUses(pass({ totalUses: 10, usesCount: null }))).toBe(10);
  });
});

describe('isUsablePass', () => {
  it('NEVER shows a placeholder pass', () => {
    // A placeholder tracks an unpaid reservation. It is a marker for an outstanding charge, not
    // an entitlement — surfacing it would offer a client a slot they have not paid for.
    expect(isUsablePass(pass({ is_placeholder: true }), NOW)).toBe(false);
    // Even an unlimited one.
    expect(isUsablePass(pass({ is_placeholder: true, totalUses: null }), NOW)).toBe(false);
  });

  it('drops an expired pass', () => {
    expect(isUsablePass(pass({ expiresAt: '2026-08-05T00:00:00.000Z' }), NOW)).toBe(false);
    expect(isUsablePass(pass({ expiresAt: '2026-08-07T00:00:00.000Z' }), NOW)).toBe(true);
  });

  it('keeps a pass with no expiry at all', () => {
    expect(isUsablePass(pass({ expiresAt: null }), NOW)).toBe(true);
  });

  it('drops a fully spent pack but keeps an unlimited one', () => {
    expect(isUsablePass(pass({ totalUses: 10, usesCount: 10 }), NOW)).toBe(false);
    expect(isUsablePass(pass({ totalUses: null, usesCount: 999 }), NOW)).toBe(true);
  });

  it('filters a list', () => {
    const list = [
      pass({ id: 1 }),
      pass({ id: 2, is_placeholder: true }),
      pass({ id: 3, totalUses: 5, usesCount: 5 }),
    ];
    expect(usablePasses(list, NOW).map((p) => p.id)).toEqual([1]);
  });
});

describe('sortPassesByPriority', () => {
  it('spends an unlimited membership before a finite pack', () => {
    // While the membership is live it covers every class anyway, so drawing on the pack underneath
    // it is pure loss — those classes could have been kept for after the membership ends.
    //
    // This must match the server's `comparePasses`, which chooses the pass that is actually spent.
    // If the two drift, the app names one package and the account loses a use off another.
    const order = sortPassesByPriority([
      pass({ id: 1, totalUses: 10, usesCount: 3 }),
      pass({ id: 2, totalUses: null }),
    ]);
    expect(order.map((p) => p.id)).toEqual([2, 1]);
  });

  it('treats the legacy 999 sentinel as unlimited too', () => {
    const order = sortPassesByPriority([
      pass({ id: 1, totalUses: 10, usesCount: 3 }),
      pass({ id: 2, totalUses: 999 }),
    ]);
    expect(order.map((p) => p.id)).toEqual([2, 1]);
  });

  it('spends the pass expiring soonest first', () => {
    const order = sortPassesByPriority([
      pass({ id: 1, expiresAt: '2026-12-31T00:00:00.000Z' }),
      pass({ id: 2, expiresAt: '2026-09-01T00:00:00.000Z' }),
    ]);
    expect(order.map((p) => p.id)).toEqual([2, 1]);
  });

  it('finishes off a nearly-spent pack rather than stranding one use', () => {
    const order = sortPassesByPriority([
      pass({ id: 1, totalUses: 10, usesCount: 2, expiresAt: null }),
      pass({ id: 2, totalUses: 10, usesCount: 9, expiresAt: null }),
    ]);
    expect(order.map((p) => p.id)).toEqual([2, 1]);
  });

  it('breaks a tie by id, so two surfaces cannot disagree', () => {
    const order = sortPassesByPriority([pass({ id: 7 }), pass({ id: 3 })]);
    expect(order.map((p) => p.id)).toEqual([3, 7]);
  });

  it('does not mutate its input', () => {
    const list = [pass({ id: 9 }), pass({ id: 1 })];
    sortPassesByPriority(list);
    expect(list.map((p) => p.id)).toEqual([9, 1]);
  });
});

describe('choosePassForClass', () => {
  const publicClass = { can_apply_pass: true, private: false };

  it('picks the highest-priority usable pass — the membership, not the pack', () => {
    const chosen = choosePassForClass(
      [pass({ id: 1, totalUses: null }), pass({ id: 2, totalUses: 10, usesCount: 3 })],
      publicClass,
      NOW,
    );
    expect(chosen?.id).toBe(1);
  });

  it('refuses when the studio has turned passes off for this class', () => {
    // Promising coverage that checkout will refuse is the bug this whole module exists to stop.
    expect(choosePassForClass([pass()], { can_apply_pass: false, private: false }, NOW)).toBeNull();
  });

  it('treats a null can_apply_pass as allowed', () => {
    // Only an explicit false is a refusal — null means the studio never set the flag.
    expect(
      choosePassForClass([pass()], { can_apply_pass: null, private: false }, NOW),
    ).not.toBeNull();
  });

  it('does not spend a private pass on a public class, or vice versa', () => {
    expect(choosePassForClass([pass({ private_pass: true })], publicClass, NOW)).toBeNull();
    expect(
      choosePassForClass([pass({ private_pass: false })], { can_apply_pass: true, private: true }, NOW),
    ).toBeNull();
  });

  it('coerces a null private flag rather than comparing it to false', () => {
    // `null === false` is false, which silently dropped every public pass whose flag was null.
    const chosen = choosePassForClass([pass({ private_pass: null })], publicClass, NOW);
    expect(chosen).not.toBeNull();
  });

  it('never picks a placeholder, even when it is the only pass', () => {
    expect(choosePassForClass([pass({ is_placeholder: true })], publicClass, NOW)).toBeNull();
  });

  it('is null when the client holds nothing', () => {
    expect(choosePassForClass([], publicClass, NOW)).toBeNull();
  });
});

describe('passName', () => {
  it('uses the package name', () => {
    expect(passName(pass())).toBe('10-Class Pass');
  });

  it('falls back rather than rendering undefined', () => {
    expect(passName(pass({ studioPackage: null }))).toBe('Your pass');
    expect(passName(pass({ studioPackage: { packageName: '  ' } }))).toBe('Your pass');
  });
});

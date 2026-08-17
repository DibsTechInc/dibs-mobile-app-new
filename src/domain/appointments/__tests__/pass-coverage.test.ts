/**
 * Which passes cover an appointment. The server verifies nothing on this path — whatever passId
 * we send gets redeemed — so this predicate is the entire defence, and every branch is a case
 * where sending the wrong id spends money that is not ours to spend.
 */
import type { Pass } from '@/api/schemas/passes';

import { selectAppointmentPass } from '../pass-coverage';

const NOW = new Date('2026-08-16T12:00:00.000Z');

function pass(overrides: Partial<Pass> = {}): Pass {
  return {
    id: 1,
    totalUses: 5,
    usesCount: 0,
    private_pass: true,
    is_placeholder: false,
    expiresAt: '2026-12-31T00:00:00.000Z',
    studioPackage: { packageName: '5-Session Pack' },
    ...overrides,
  } as Pass;
}

describe('selectAppointmentPass', () => {
  it('finds a valid private pass and names it', () => {
    const coverage = selectAppointmentPass([pass()], NOW);
    expect(coverage?.pass.id).toBe(1);
    expect(coverage?.passName).toBe('5-Session Pack');
    expect(coverage?.remainingUses).toBe(5);
  });

  it('refuses public (class) passes — appointments are private sessions', () => {
    expect(selectAppointmentPass([pass({ private_pass: false })], NOW)).toBeNull();
    expect(selectAppointmentPass([pass({ private_pass: null })], NOW)).toBeNull();
  });

  it('refuses placeholders on the ROW and on the PACKAGE — pre-backfill rows carry it only on the join', () => {
    expect(selectAppointmentPass([pass({ is_placeholder: true })], NOW)).toBeNull();
    expect(
      selectAppointmentPass(
        [pass({ studioPackage: { packageName: 'Hold', is_placeholder: true } as never })],
        NOW,
      ),
    ).toBeNull();
  });

  it('refuses an expired pass', () => {
    expect(
      selectAppointmentPass([pass({ expiresAt: '2026-08-15T00:00:00.000Z' })], NOW),
    ).toBeNull();
  });

  it('refuses a spent pass, and null totalUses means UNLIMITED (the seventh-surface trap)', () => {
    expect(selectAppointmentPass([pass({ totalUses: 3, usesCount: 3 })], NOW)).toBeNull();
    const unlimited = selectAppointmentPass([pass({ totalUses: null, usesCount: 400 })], NOW);
    expect(unlimited?.remainingUses).toBe(Infinity);
  });

  it('chooses the soonest-expiring pass — spend it before it dies (widget parity, NOT the class flow’s unlimited-first order)', () => {
    const coverage = selectAppointmentPass(
      [
        pass({ id: 1, expiresAt: '2026-12-31T00:00:00.000Z' }),
        pass({ id: 2, expiresAt: '2026-09-01T00:00:00.000Z' }),
        pass({ id: 3, expiresAt: null }),
      ],
      NOW,
    );
    expect(coverage?.pass.id).toBe(2);
  });

  it('answers null for undefined and empty alike — "have not asked" cannot pick a pass', () => {
    expect(selectAppointmentPass(undefined, NOW)).toBeNull();
    expect(selectAppointmentPass([], NOW)).toBeNull();
  });
});

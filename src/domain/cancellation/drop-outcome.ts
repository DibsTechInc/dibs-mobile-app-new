/**
 * What to tell a client after a cancel went through. Pure TypeScript.
 *
 * Built from the SERVER's `returned`, never from the app's own early/late prediction — the two
 * disagree across a clock skew or a boundary crossed mid-session, and the wallet will side with
 * the server.
 */
import { formatBalance } from '@/domain/money/format';

export interface DropOutcome {
  title: string;
  body: string;
}

/**
 * @param returned what the server actually put back
 * @param creditAmountCents only read when `returned === 'credit'`
 * @param wasEarly the server's timing verdict, used only to explain a 'none'
 */
export function describeDropOutcome(
  returned: 'pass' | 'credit' | 'none',
  creditAmountCents: number | null | undefined,
  wasEarly: boolean,
  currency = 'USD',
): DropOutcome {
  if (returned === 'pass') {
    return {
      title: 'Class cancelled',
      body: 'Your spot is free and the class has gone back on your pass.',
    };
  }

  if (returned === 'credit') {
    const amount = typeof creditAmountCents === 'number' ? creditAmountCents : 0;
    return {
      title: 'Class cancelled',
      // The amount is stated when we have one. "Credit has been returned" with no figure invites
      // the client to go and check, which is the support call this screen exists to prevent.
      // Cents on the wire, dollars on screen. `formatBalance` (not `formatPrice`) because this
      // lands in a balance, and a balance always shows its cents.
      // "Before the deadline" is safe to state: this endpoint only returns credit on an early
      // drop — a late drop comes back 'none'.
      body:
        amount > 0
          ? `Thank you for cancelling before the deadline. ${formatBalance(amount / 100, currency)} has been added to your account credit.`
          : 'Thank you for cancelling before the deadline. The value has been added to your account credit.',
    };
  }

  // 'none' has two quite different causes and the client is owed the right one. A late drop is
  // something they did; an unlimited membership or an unpaid hold is simply how it works, and
  // implying they lost something they never had reads as a penalty.
  return {
    title: 'Class cancelled',
    body: wasEarly
      ? 'Your spot is free. Nothing was deducted for this class, so there was nothing to return.'
      : 'Your spot is free. This was after the cancellation window, so the class was not returned to your account.',
  };
}

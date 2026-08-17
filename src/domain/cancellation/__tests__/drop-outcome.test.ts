import { describeDropOutcome } from '../drop-outcome';

describe('describeDropOutcome', () => {
  it('says the class went back on the pass', () => {
    expect(describeDropOutcome('pass', null, true).body).toContain('back on your pass');
  });

  it('names the credit amount, converted from cents to dollars', () => {
    expect(describeDropOutcome('credit', 2250, true).body).toContain('$22.50');
  });

  it('keeps the cents on a whole-dollar credit', () => {
    // formatBalance, not formatPrice: this lands in a balance, and "$22" reads as an
    // approximation of an account statement.
    expect(describeDropOutcome('credit', 2200, true).body).toContain('$22.00');
  });

  it('still reads as a sentence when the amount is missing', () => {
    const body = describeDropOutcome('credit', null, true).body;
    expect(body).toContain('account credit');
    expect(body).not.toContain('$');
    expect(body).not.toContain('NaN');
  });

  it('explains a LATE none as the window having passed', () => {
    // Something the client did, and they are owed the reason.
    expect(describeDropOutcome('none', 0, false).body).toContain('after the cancellation window');
  });

  it('explains an EARLY none as there having been nothing to return', () => {
    // An unlimited membership or an unpaid hold. Telling this client they missed a deadline
    // would be a penalty they did not incur.
    const body = describeDropOutcome('none', 0, true).body;
    expect(body).toContain('nothing to return');
    expect(body).not.toContain('after the cancellation window');
  });

  it('confirms the spot is free on the pass and none branches', () => {
    // The credit branch leads with a thank-you instead (Alicia, 2026-08-16); the others keep
    // the spot-is-free confirmation.
    for (const outcome of [
      describeDropOutcome('pass', null, true),
      describeDropOutcome('none', 0, false),
      describeDropOutcome('none', 0, true),
    ]) {
      expect(outcome.body).toContain('Your spot is free');
    }
  });

  it('thanks the client for cancelling before the deadline on a credit return', () => {
    expect(describeDropOutcome('credit', 2200, true).body).toContain(
      'Thank you for cancelling before the deadline',
    );
    expect(describeDropOutcome('credit', null, true).body).toContain(
      'Thank you for cancelling before the deadline',
    );
  });
});

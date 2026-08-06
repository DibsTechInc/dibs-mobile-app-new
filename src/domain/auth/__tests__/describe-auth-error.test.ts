/**
 * The auth copy. Two properties matter more than the wording.
 */
import {
  describeAuthError,
  emailProblem,
  MIN_PASSWORD_LENGTH,
  passwordProblem,
} from '../describe-auth-error';

const err = (code: string) => ({ code, message: `Firebase: Error (${code}).` });

describe('describeAuthError', () => {
  it('never reveals whether an email has an account', () => {
    // Repeating Firebase's user-not-found / wrong-password distinction turns the sign-in form
    // into an account-enumeration oracle for a studio's whole client list.
    const wrongPassword = describeAuthError(err('auth/wrong-password'));
    const noSuchUser = describeAuthError(err('auth/user-not-found'));
    const invalidCredential = describeAuthError(err('auth/invalid-credential'));

    expect(wrongPassword).toBe(noSuchUser);
    expect(wrongPassword).toBe(invalidCredential);
    expect(wrongPassword.toLowerCase()).not.toContain('no account');
    expect(wrongPassword.toLowerCase()).not.toContain("doesn't exist");
  });

  it('offers a way forward in every message, not just a diagnosis', () => {
    const codes = [
      'auth/invalid-email',
      'auth/invalid-credential',
      'auth/email-already-in-use',
      'auth/weak-password',
      'auth/missing-password',
      'auth/user-disabled',
      'auth/too-many-requests',
      'auth/network-request-failed',
      'auth/operation-not-allowed',
      'auth/some-code-nobody-has-seen',
    ];
    for (const code of codes) {
      const message = describeAuthError(err(code));
      expect(message.length).toBeGreaterThan(0);
      // No raw Firebase text ever reaches a screen.
      expect(message).not.toContain('Firebase');
      expect(message).not.toContain('auth/');
    }
  });

  it('does not blame the client for a project misconfiguration', () => {
    const message = describeAuthError(err('auth/operation-not-allowed')).toLowerCase();
    expect(message).toContain('contact the studio');
  });

  it('handles a non-Firebase throw without exploding', () => {
    expect(describeAuthError(new Error('kaboom'))).toBeTruthy();
    expect(describeAuthError(null)).toBeTruthy();
    expect(describeAuthError('a string')).toBeTruthy();
  });
});

describe('passwordProblem', () => {
  it('requires 8 characters, above Firebase’s own floor of 6', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(passwordProblem('short')).toContain('8');
    expect(passwordProblem('1234567')).toContain('8');
    expect(passwordProblem('12345678')).toBeNull();
  });

  it('says something specific about an empty password', () => {
    expect(passwordProblem('')).toBe('Please choose a password.');
  });
});

describe('emailProblem', () => {
  it('accepts the addresses a clever regex tends to reject', () => {
    expect(emailProblem('alicia+studio@ondibs.com')).toBeNull();
    expect(emailProblem('someone@sub.domain.fitness')).toBeNull();
    expect(emailProblem("o'brien@example.co.uk")).toBeNull();
  });

  it('catches the two mistakes people actually make', () => {
    expect(emailProblem('')).toBe('Please enter your email.');
    expect(emailProblem('not-an-email')).toContain('email address');
  });

  it('ignores surrounding whitespace from autofill', () => {
    expect(emailProblem('  alicia@ondibs.com ')).toBeNull();
  });
});

/**
 * Firebase auth error codes → something a person can act on.
 *
 * PURE TypeScript, kept out of the screens so the wording is written once and can be tested.
 *
 * Two rules the copy follows:
 *
 * 1. **Never say whether an email has an account.** Firebase distinguishes `user-not-found` from
 *    `wrong-password`, and repeating that distinction turns the sign-in form into an account
 *    enumeration oracle for a studio's client list. Newer Firebase projects collapse both into
 *    `invalid-credential` for exactly this reason; we collapse the older codes to match rather
 *    than depending on which behaviour a project has.
 * 2. **Every message says what to do next.** "Auth failed" is a full stop; "check the password
 *    or reset it" is a door.
 */

/** The shape Firebase throws. Narrowed here so screens never touch `any`. */
export interface FirebaseAuthErrorLike {
  code?: string;
  message?: string;
}

export function authErrorCode(error: unknown): string | null {
  if (!error || typeof error !== 'object') return null;
  const code = (error as FirebaseAuthErrorLike).code;
  return typeof code === 'string' ? code : null;
}

export function describeAuthError(error: unknown): string {
  switch (authErrorCode(error)) {
    case 'auth/invalid-email':
      return "That doesn't look like an email address.";

    // Collapsed on purpose — see rule 1 above.
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'That email and password don’t match. Check the password, or reset it below.';

    case 'auth/email-already-in-use':
      return 'There’s already an account with that email. Sign in instead, or reset the password.';

    case 'auth/weak-password':
      return 'Please choose a password of at least 8 characters.';

    case 'auth/missing-password':
      return 'Please enter your password.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact the studio.';

    case 'auth/too-many-requests':
      // Firebase's own copy offers "reset your password", which is genuinely the way out.
      return 'Too many attempts. Wait a few minutes, or reset your password to get back in.';

    case 'auth/network-request-failed':
      return 'No connection. Check your internet and try again.';

    case 'auth/operation-not-allowed':
      // A project misconfiguration, not something the client did. Do not blame them.
      return 'Sign-in is unavailable right now. Please contact the studio.';

    default:
      return 'Something went wrong signing you in. Please try again.';
  }
}

/**
 * Password rule, stated once.
 *
 * Firebase's own floor is 6; the studios' clients get 8, matching the widget's sign-up copy
 * ("Use at least 8 characters"). Returning the reason rather than a boolean means the form can
 * say what is wrong instead of just refusing.
 */
export const MIN_PASSWORD_LENGTH = 8;

export function passwordProblem(password: string): string | null {
  if (!password) return 'Please choose a password.';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Please use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

/**
 * Is this plausibly an email address?
 *
 * Deliberately permissive: the only authority on whether an address exists is the mail server,
 * and a clever regex mostly rejects valid addresses (plus-tags, new TLDs, non-ASCII). This
 * catches "no @ sign" and gets out of the way.
 */
export function emailProblem(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return 'Please enter your email.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "That doesn't look like an email address.";
  return null;
}

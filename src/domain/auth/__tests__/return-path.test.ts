/**
 * Where sign-in hands somebody back to.
 *
 * This is the widget's post-login bounce, prevented by construction: the return path is a route
 * WHITELIST, so it cannot be typo'd into a dead route and cannot carry anything a caller made up.
 * Anything unrecognised lands on Home, which always exists.
 *
 * Lives under `domain/` rather than beside the module because the jest project only roots there —
 * `features/auth/returnPath.ts` is pure TypeScript with no React Native import, precisely so it
 * can be tested at all.
 */
import { DEFAULT_RETURN, resolveReturnPath } from '@/features/auth/returnPath';

describe('resolveReturnPath', () => {
  it('hands a guest back to the cart they were sent away from', () => {
    // The case that motivates the whole file: fill a cart, tap Checkout, get bounced to sign-in,
    // sign in — and arrive back at the cart rather than on Home wondering where it went.
    expect(resolveReturnPath('/checkout')).toBe('/checkout');
  });

  it('accepts every route that sends people to sign-in', () => {
    for (const route of ['/checkout', '/schedule', '/my-calendar', '/account', '/packages']) {
      expect(resolveReturnPath(route)).toBe(route);
    }
  });

  it('falls back to Home for anything it does not recognise', () => {
    // A route this build dropped, a typo, a param mangled in transit. Sending somebody to a
    // screen that does not exist is worse than sending them somewhere real.
    expect(resolveReturnPath('/nope')).toBe(DEFAULT_RETURN);
    expect(resolveReturnPath('checkout')).toBe(DEFAULT_RETURN);
    expect(resolveReturnPath('/checkout/')).toBe(DEFAULT_RETURN);
  });

  it('refuses anything that is not an internal route', () => {
    expect(resolveReturnPath('https://example.com')).toBe(DEFAULT_RETURN);
    expect(resolveReturnPath('//example.com')).toBe(DEFAULT_RETURN);
    expect(resolveReturnPath('dibs-carlsbad://checkout')).toBe(DEFAULT_RETURN);
  });

  it('handles a missing or empty param', () => {
    expect(resolveReturnPath(undefined)).toBe(DEFAULT_RETURN);
    expect(resolveReturnPath('')).toBe(DEFAULT_RETURN);
  });

  it('takes the first of a duplicated param rather than crashing on the array', () => {
    // expo-router repeats a duplicated query key as an array. `.includes` on an array of paths
    // would silently never match; here it resolves deterministically.
    expect(resolveReturnPath(['/checkout', '/account'])).toBe('/checkout');
    expect(resolveReturnPath([])).toBe(DEFAULT_RETURN);
  });
});

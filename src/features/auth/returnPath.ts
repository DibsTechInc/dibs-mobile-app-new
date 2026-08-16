/**
 * Where a client goes after signing in.
 *
 * ── Why this is a whitelist and not a string ──────────────────────────────────────────────────
 * The widget spent three attempts on this exact problem. A guest taps Confirm, gets sent to sign
 * in, signs in — and lands on "my classes" with their cart nowhere in sight, because the return
 * path was destroyed on read by one of three consumers racing each other. The fix there was to
 * make the read side dumb and the write side single-owner; here the whole thing is a route enum,
 * which cannot race and cannot be typo'd into a dead route.
 *
 * Anything unrecognised resolves to Home. Sending somebody to a screen that does not exist —
 * because a param was mangled, or an old build passed a route this one dropped — is worse than
 * sending them somewhere real.
 *
 * PURE TypeScript: no expo-router import, so it is testable in the Node project.
 */

/** Every destination sign-in is allowed to hand somebody back to. */
const RETURN_ROUTES = ['/checkout', '/schedule', '/my-calendar', '/account', '/packages'] as const;

export type ReturnRoute = (typeof RETURN_ROUTES)[number];

/** Home. Where an absent, unknown, or malformed return path lands. */
export const DEFAULT_RETURN: '/' = '/';

/**
 * @param raw whatever arrived on the route params — a string, an array (expo-router repeats a
 *            duplicated query key as an array), or nothing at all.
 */
export function resolveReturnPath(raw: string | string[] | undefined): ReturnRoute | '/' {
  // A duplicated param arrives as an array. Take the first; a caller sending two return paths has
  // a bug, and picking one deterministically beats crashing on `.includes` of an array.
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string') return DEFAULT_RETURN;

  return (RETURN_ROUTES as readonly string[]).includes(value)
    ? (value as ReturnRoute)
    : DEFAULT_RETURN;
}

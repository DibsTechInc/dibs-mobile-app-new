/**
 * The ONLY code in the app allowed to call `initStripe`.
 *
 * ── Why this needs an owner ────────────────────────────────────────────────────────────────────
 * `initStripe` is a GLOBAL NATIVE call: the last init wins app-wide. `StripeSdkProvider` mounts a
 * root `StripeProvider` on the PLATFORM key, which is right for the Account tab's card saving
 * (that SetupIntent is created on the Dibs platform account). Booking needs the SDK pointed at the
 * STUDIO'S CONNECTED account instead — and doing that is not "add a nested provider", it silently
 * re-points the Account tab too, for the rest of the session.
 *
 * So: one function that switches to the connected account, runs the payment, and restores the
 * platform configuration in a `finally` — on success, on cancel, and on error alike. A crash mid
 * booking must not leave the next SetupIntent aimed at a connected account, where it would 400 on
 * every Elements call.
 *
 * ── `urlScheme` is what brings a 3DS challenge back to the app ────────────────────────────────
 * Without it the challenge opens and the client never returns, which turns "book a class" into a
 * dead end for exactly the cardholders this endpoint pair was built for. The scheme is per-studio
 * and lives in `app.config.ts`; it is read from `Constants.expoConfig` at runtime rather than
 * rebuilt from the slug, because those two have already drifted once — see `stripeRedirectUrl`.
 */
import { initStripe } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';

import { studio } from '@/config/studio';

/**
 * The registered deep-link scheme for THIS build, e.g. `dibs-everyday-ballet`.
 *
 * ⚠️ It is NOT the studio slug. `app.config.ts` sets `scheme: \`dibs-${studio.slug}\``, and code
 * that rebuilt it as `${studio.slug}` produced `everyday-ballet://…` — a scheme nothing on the
 * device is registered to handle, so any redirect built from it goes nowhere. That was live in
 * `useCardActions` and never surfaced only because 3DS on a card SAVE is rare. Read the value
 * Expo actually registered, and fall back to the derived form only if it is somehow absent.
 */
export function appUrlScheme(): string {
  const configured = Constants.expoConfig?.scheme;
  if (typeof configured === 'string' && configured) return configured;
  if (Array.isArray(configured) && typeof configured[0] === 'string') return configured[0];
  return `dibs-${studio.slug}`;
}

/** `dibs-everyday-ballet://stripe-redirect` — where Stripe sends the client back to. */
export function stripeRedirectUrl(): string {
  return `${appUrlScheme()}://stripe-redirect`;
}

/**
 * Point the SDK at the studio's connected account for the duration of `run`, then put it back.
 *
 * @param publishableKey the key `StripeSdkProvider` fetched. Passing it in rather than re-fetching
 *        keeps the "never bundle a key" invariant and guarantees both configurations use the same
 *        one, so a sandbox build cannot half-switch to live.
 * @param stripeAccountId the studio's connected account, from the create-payment-intent response.
 */
export async function withConnectedStripeAccount<T>(
  { publishableKey, stripeAccountId }: { publishableKey: string; stripeAccountId: string },
  run: () => Promise<T>,
): Promise<T> {
  const urlScheme = appUrlScheme();

  // The merchant id rides on BOTH configurations (connected and the platform restore below):
  // Apple Pay availability must not depend on which init ran last. Null → the key is omitted and
  // the sheet stays card-only, which is the whole off switch for a studio without the Apple-side
  // setup. Server-side `payment_method_types: ['card']` is compatible — Apple Pay IS a card to
  // Stripe.
  const merchantIdentifier = studio.merchantId ?? undefined;
  await initStripe({
    publishableKey,
    stripeAccountId,
    merchantIdentifier,
    // Required for 3DS to return to the app, and for any redirect-based method.
    urlScheme,
  });

  try {
    return await run();
  } finally {
    // Restore the PLATFORM configuration. Not optional and not best-effort: the Account tab's
    // SetupIntent is created on the platform account, and a platform client secret against a
    // connected-account init 400s on every Elements call.
    await initStripe({ publishableKey, merchantIdentifier, urlScheme }).catch((restoreError: unknown) => {
      console.error(
        '[stripe] could not restore the platform configuration — card saving may fail until relaunch',
        restoreError,
      );
    });
  }
}

/**
 * The PaymentSheet's Apple Pay configuration — or nothing at all.
 *
 * ONE owner, spread by every sheet init, so "does this build offer Apple Pay" has a single
 * answer: the studio has a merchant id, or the sheet is card-only. 'US' is every live studio
 * today; a non-US studio makes this a per-studio field, not a second hardcode.
 */
export function applePaySheetParams(): { applePay?: { merchantCountryCode: string } } {
  return studio.merchantId ? { applePay: { merchantCountryCode: 'US' } } : {};
}

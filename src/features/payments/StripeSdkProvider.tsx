/**
 * Mounts the Stripe SDK with a publishable key fetched at runtime.
 *
 * ── The key is never bundled ────────────────────────────────────────────────────────────────
 * `POST /get-stripe-publishable-key` returns whatever key the API host is configured with, so a
 * build pointed at staging is automatically sandbox and one pointed at production is automatically
 * live — with no key anywhere in `src/` (invariant 7) and no way for the two to be mismatched by a
 * stale constant. Verified 2026-08-06: staging returns `pk_test_…`, `api.dibsonline.com` returns
 * `pk_live_…`.
 *
 * ── It never blocks the tree ────────────────────────────────────────────────────────────────
 * Nearly everything in this app has nothing to do with payments: browsing the schedule, reading a
 * class, signing in. Holding the whole app behind a Stripe key would let one slow request keep a
 * client from looking at Tuesday's classes. So children render immediately, and only the surfaces
 * that actually need Stripe consult `useStripeReadiness` — which is also what lets an add-a-card
 * button explain itself instead of failing at the sheet.
 *
 * `merchantIdentifier` comes from the studio's own Apple team (§6.3) and is absent until they
 * enroll. Apple Pay simply does not appear until then; saved cards are unaffected.
 */
import { useQuery } from '@tanstack/react-query';
import { StripeProvider } from '@stripe/stripe-react-native';
import { createContext, use, useMemo, type ReactElement } from 'react';

import { apiClient, fetchPublishableKey } from '@/api';

export interface StripeReadiness {
  /** True once the SDK has a real key and a PaymentSheet can be presented. */
  isReady: boolean;
  isLoading: boolean;
  error: unknown;
  retry: () => void;
}

const StripeReadinessContext = createContext<StripeReadiness | null>(null);

/**
 * `ReactElement`, not `ReactNode` — `StripeProvider` types its own children that way, so widening
 * here would only move the error to the call site.
 */
export function StripeSdkProvider({ children }: { children: ReactElement }) {
  const { data, isPending, error, refetch } = useQuery({
    queryKey: ['stripePublishableKey'],
    queryFn: ({ signal }) => fetchPublishableKey(apiClient, signal),
    // The key changes when the API host changes, which within one launch it does not.
    staleTime: Infinity,
    // Deliberately NOT persisted: `PERSISTED_QUERY_PREFIXES` is a whitelist and this key is not on
    // it. A key cached from a build that pointed at staging must never be reused by one pointing
    // at production.
    retry: 2,
  });

  const readiness = useMemo<StripeReadiness>(
    () => ({
      isReady: Boolean(data),
      isLoading: isPending,
      error,
      retry: () => void refetch(),
    }),
    [data, isPending, error, refetch],
  );

  return (
    <StripeReadinessContext value={readiness}>
      {/*
        `StripeProvider` tolerates an empty key — it just cannot present a sheet — so the tree
        mounts once and swaps the key in when it lands, rather than remounting every child the
        moment the request resolves.
      */}
      <StripeProvider publishableKey={data ?? ''}>{children}</StripeProvider>
    </StripeReadinessContext>
  );
}

export function useStripeReadiness(): StripeReadiness {
  const state = use(StripeReadinessContext);
  if (!state) throw new Error('useStripeReadiness must be used inside a <StripeSdkProvider>.');
  return state;
}

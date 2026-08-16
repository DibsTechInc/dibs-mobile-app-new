/**
 * The Payments route.
 *
 * Signed out this is not reachable from the account area, but a deep link can land here, so it
 * redirects rather than rendering an empty billing history — an empty money screen for somebody
 * who has paid is a support call.
 */
import { Redirect, router } from 'expo-router';
import { useCallback } from 'react';

import { studio } from '@/config/studio';
import { useAuth } from '@/features/auth/AuthProvider';
import { BillingScreen } from '@/features/billing/BillingScreen';
import { useBilling } from '@/features/billing/useBilling';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';
import { usePullRefresh } from '@/lib/usePullRefresh';

export default function BillingRoute() {
  const { config } = useStudioConfig();
  const { status } = useAuth();
  const billing = useBilling();
  const pull = usePullRefresh(billing.refresh);

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, []);

  if (status === 'guest') return <Redirect href="/sign-in" />;

  return (
    <BillingScreen
      data={billing.data}
      studioName={config?.studioName ?? studio.appName}
      // Gated on the session: signed out the fetches never fire, so `isPending` would stay true
      // forever and the screen would spin at a visitor indefinitely.
      isLoading={status === 'signedIn' && billing.isLoading}
      isRefreshing={pull.isRefreshing}
      onRefresh={pull.onRefresh}
      onBack={onBack}
    />
  );
}

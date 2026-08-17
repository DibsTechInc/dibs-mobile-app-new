/**
 * Billing reads. Both authenticated; neither sends a `userid` — the server uses the token's.
 */
import type { ApiClient } from '../client';
import {
  accountActivityResponseSchema,
  upcomingPaymentsResponseSchema,
  type AccountActivityRow,
  type UpcomingPayment,
} from '../schemas/billing';

export interface AccountActivityPage {
  rows: AccountActivityRow[];
  totalCount: number;
}

export async function fetchAccountActivity(
  client: ApiClient,
  { dibsStudioId, limit }: { dibsStudioId: number; limit?: number },
  signal?: AbortSignal,
): Promise<AccountActivityPage> {
  const response = await client.post(
    'widget/account-activity',
    { dibsStudioId, ...(limit ? { limit } : {}) },
    accountActivityResponseSchema,
    { authenticated: true, signal },
  );
  return { rows: response.rows, totalCount: response.totalCount ?? response.rows.length };
}

export interface UpcomingPayments {
  renewals: UpcomingPayment[];
  /** True when Stripe did not fully answer. Render "may be incomplete", never "you have none". */
  lookupFailed: boolean;
}

export async function fetchUpcomingPayments(
  client: ApiClient,
  { dibsStudioId }: { dibsStudioId: number },
  signal?: AbortSignal,
): Promise<UpcomingPayments> {
  const response = await client.post(
    'widget/upcoming-payments',
    { dibsStudioId },
    upcomingPaymentsResponseSchema,
    { authenticated: true, signal },
  );
  return { renewals: response.renewals, lookupFailed: response.lookupFailed === true };
}

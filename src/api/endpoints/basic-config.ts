import type { ApiClient } from '../client';
import { ApiError } from '../errors';
import { basicConfigSchema, type BasicConfig } from '../schemas/basic-config';

/**
 * The studio's live operational config. Unauthenticated — this is what a guest sees before
 * signing in, and it is what the theme's live overrides come from.
 *
 * ⚠️ It also returns the studio's `stripeId` / `stripeIdTest`, which is a backend auth-hardening
 * item (7.3), not something the app can fix. Never surface or store those.
 */
export async function fetchBasicConfig(
  client: ApiClient,
  dibsStudioId: number,
  signal?: AbortSignal,
): Promise<BasicConfig> {
  const config = await client.post(
    'widget/get-basic-config',
    { dibsStudioId },
    basicConfigSchema,
    { signal },
  );

  // `studioName` and `timezone` are the two fields the whole app is built on: the timezone is
  // the frame every time comparison happens in. A response missing them is a failure body that
  // happened to survive a permissive schema, not a studio with no name.
  if (!config || typeof config.timezone !== 'string' || !config.timezone) {
    throw new ApiError({
      status: 200,
      code: 'server',
      message: 'The studio configuration came back incomplete.',
      retriable: true,
      body: config,
    });
  }

  return config;
}

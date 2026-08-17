/**
 * Which bookable surface is this app, for this studio, right now?
 *
 * PURE TypeScript. Two authorities have to agree before a surface exists:
 *
 *  • the BUILD's `features` flags — "this binary has code for it". A build must never route to
 *    a surface it cannot render; that is the §0.1-B rule that kept appointments out of v1.
 *  • the SERVER's `dibs_configs` flags — "this studio offers it". `offersClasses` /
 *    `offersAppointments`, falling back to the legacy `showSchedule` / `showAppts` pair exactly
 *    the way `get-studio-config.js` itself derives them, so the app and the widget cannot
 *    disagree about what a studio is.
 *
 * The AND can under-resolve — a server outage, a config row missing both pairs — and an app
 * whose only surface vanished because one request failed is a brick wearing a logo. So when the
 * AND yields NOTHING, the build's own flags stand alone: the binary was built FOR this studio,
 * and its flags are the studio's declared shape as of the release.
 */
import type { BasicConfig } from '@/api/schemas/basic-config';

export type BookingSurface = 'classes' | 'appointments' | 'both' | 'none';

export interface BuildFeatures {
  classes: boolean;
  appointments: boolean;
}

/** The server's answer, with the same legacy fallbacks the backend applies. Null = no answer. */
function serverOffers(config: BasicConfig | null | undefined): {
  classes: boolean | null;
  appointments: boolean | null;
} {
  if (!config) return { classes: null, appointments: null };
  const classes =
    typeof config.offersClasses === 'boolean'
      ? config.offersClasses
      : typeof config.showSchedule === 'boolean'
        ? config.showSchedule
        : null;
  const appointments =
    typeof config.offersAppointments === 'boolean'
      ? config.offersAppointments
      : typeof config.showAppts === 'boolean'
        ? config.showAppts
        : null;
  return { classes, appointments };
}

export function resolveBookingSurface(
  build: BuildFeatures,
  config: BasicConfig | null | undefined,
): BookingSurface {
  const offers = serverOffers(config);

  // A server `false` removes a surface; a server `null` (no answer yet, or an older API) leaves
  // the build's flag standing. `true` cannot ADD a surface the build has no code for.
  const classes = build.classes && offers.classes !== false;
  const appointments = build.appointments && offers.appointments !== false;

  if (classes && appointments) return 'both';
  if (classes) return 'classes';
  if (appointments) return 'appointments';

  // The AND erased everything. Falling back to the build flags keeps the app usable — browsing a
  // surface the server has since switched off fails politely at booking time, which is a better
  // failure than an app with no way in at all.
  if (build.classes && build.appointments) return 'both';
  if (build.classes) return 'classes';
  if (build.appointments) return 'appointments';
  return 'none';
}

/**
 * Where Home's "Book" choice goes.
 *
 * 'both' lands on classes for now: no live studio runs both surfaces (which is why each app ships
 * one of them), and when one does, this is the single line the decision lives behind.
 */
export function bookRouteForSurface(surface: BookingSurface): '/schedule' | '/book' {
  return surface === 'appointments' ? '/book' : '/schedule';
}

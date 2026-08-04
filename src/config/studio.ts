/**
 * Runtime access to the white-label identity of THIS build.
 *
 * The only sanctioned way for app code to learn which studio it is. Never read
 * `Constants.expoConfig.extra` directly, and never write a studio id, accent, or API URL as a
 * literal anywhere under `src/` — that is what makes one codebase serve every studio.
 *
 * Populated at build time by `app.config.ts` from `whitelabel/studios/<slug>/studio.json`.
 */
import Constants from 'expo-constants';

export interface StudioIdentity {
  slug: string;
  dibsStudioId: number;
  appName: string;
  shortName: string;
  /** The studio's raw brand colour. Derive usable tokens via `src/theme/color.ts`. */
  accentColor: string;
  /** IANA zone. The authoritative copy arrives from get-basic-config; this is the seed value. */
  timezone: string;
  features: {
    classes: boolean;
    appointments: boolean;
  };
  display: {
    showInstructor: boolean;
  };
  supportEmail: string;
  privacyPolicyUrl: string | null;
  apiUrl: string;
}

function readStudioIdentity(): StudioIdentity {
  const extra = Constants.expoConfig?.extra as { studio?: Partial<StudioIdentity> } | undefined;
  const studio = extra?.studio;

  if (!studio?.dibsStudioId || !studio.slug || !studio.apiUrl) {
    // A build without this is not "a bit misconfigured", it is not an app for anyone. Failing
    // loudly at startup beats a white screen or, worse, requests aimed at the wrong studio.
    throw new Error(
      'White-label studio config missing from the build. Expected expoConfig.extra.studio, ' +
        'populated by app.config.ts. Is STUDIO_SLUG set, and did you restart the bundler after ' +
        'changing it?',
    );
  }

  return studio as StudioIdentity;
}

export const studio: StudioIdentity = readStudioIdentity();

/**
 * Whether this build should surface a bookable surface at all.
 *
 * Navigation must check BOTH this and the studio's own server-side flags (`showSchedule` /
 * `showAppts` from get-basic-config): the build flag says "we have code for this", the server
 * flag says "this studio offers it". A tab needs both to be true — showing a tab for a surface
 * the build cannot render is worse than hiding one the studio does offer.
 */
export const canRenderClasses = (): boolean => studio.features.classes;
export const canRenderAppointments = (): boolean => studio.features.appointments;

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
  /**
   * This build's integer identity — CFBundleVersion on iOS, versionCode on Android. The ONLY
   * number the version gate compares, and never a version string: `"1.10.0" < "1.9.0"` is true
   * lexically, which is how a gate ships inverted and blocks everybody.
   *
   * Comes from `store.buildNumber` in studio.json, the same value app.config.ts stamps into the
   * native project, so the number JS compares and the number the store sees cannot drift.
   */
  buildNumber: number;
  features: {
    classes: boolean;
    appointments: boolean;
    /** Appointments are ROOMS (263): no provider step, "studio time" copy. */
    roomBooking: boolean;
    /** A selected slot offers the Single / Lock-in-monthly toggle (263). */
    monthlyCommitment: boolean;
  };
  /**
   * Per-studio appointment wiring — data that would otherwise be a hardcoded studio-id branch.
   * See whitelabel/schema.ts for field semantics.
   */
  appointments: {
    availabilityVariant: 'standard' | 'custom-263';
    providerByServiceId: Record<string, number>;
  };
  display: {
    showInstructor: boolean;
  };
  /**
   * Where Home's opening photograph comes from.
   *
   * `'bundled'` is what makes the native splash hand off to Home without a visible cut — the same
   * file is in the binary, so it is on screen in the first frame. See `studio-assets.ts`.
   */
  heroSource: 'bundled' | 'remote';
  supportEmail: string;
  privacyPolicyUrl: string | null;
  /**
   * The Microsoft Clarity project this binary records sessions into, or null for none.
   *
   * Null is the OFF switch: `ClarityIntegration` never initialises the SDK without it, so a
   * studio ships with recordings only when their studio.json deliberately carries a project id.
   */
  clarityProjectId: string | null;
  /**
   * The Apple Pay merchant identifier (`merchant.com.ondibs…`), or null for none.
   *
   * Null is the OFF switch: the Stripe session never passes a merchantIdentifier and the
   * PaymentSheet never offers Apple Pay, so a studio without the Apple-side setup ships a
   * card-only sheet rather than an Apple Pay button that errors.
   */
  merchantId: string | null;
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

  // Fields added after a binary shipped arrive as `undefined` when an OTA bundle runs inside an
  // older native shell (the config is baked at prebuild, not at bundle time). Backfill the two
  // newest blocks with their schema defaults so reading them never crashes — absent flags mean
  // the conservative behavior (no room booking, no monthly toggle, standard endpoint).
  const identity = studio as StudioIdentity;
  const features = identity.features as Partial<StudioIdentity['features']> & {
    classes: boolean;
    appointments: boolean;
  };
  identity.features = {
    ...features,
    roomBooking: features.roomBooking ?? false,
    monthlyCommitment: features.monthlyCommitment ?? false,
  };
  identity.appointments = identity.appointments ?? {
    availabilityVariant: 'standard',
    providerByServiceId: {},
  };
  return identity;
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

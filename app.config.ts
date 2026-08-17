/**
 * Expo config, generated per studio.
 *
 * `STUDIO_SLUG` selects which white-label studio this build IS. Everything identity-shaped
 * (app name, bundle ids, scheme, Apple Pay merchant id, accent, dibsStudioId) comes from
 * `whitelabel/studios/<slug>/studio.json` — nothing is hardcoded here, and nothing studio-
 * specific is allowed anywhere under `src/`.
 *
 * Replaces app.json (deleted): a static JSON file cannot vary by studio.
 *
 * Run a specific studio:   STUDIO_SLUG=everyday-ballet npx expo run:ios
 * Default:                 whatever STUDIO_SLUG is in .env, else carlsbad-village-yoga
 */
import type { ConfigContext, ExpoConfig } from 'expo/config';

import { loadStudioConfig } from './whitelabel/load.ts';
import {
  assertNativeProjectsMatchStudio,
  expectedAndroidPackage,
  expectedIosBundleId,
} from './whitelabel/native-identity.ts';
import { validateStudioForRelease } from './whitelabel/schema.ts';

/** The studio a bare `npx expo run:ios` builds when nothing says otherwise. */
const DEFAULT_STUDIO_SLUG = 'carlsbad-village-yoga';

/**
 * The Expo account that owns every project in this repo.
 *
 * Deliberately repo-level, not per-studio. An Expo account is unrelated to an Apple Developer
 * account — EAS authenticates with Apple per project, via an App Store Connect API key or Apple
 * ID in eas.json — so a studio-owned Apple team (263 and any future new studio) still lives
 * under this same Expo organization. The one thing this DOES decide is who can reach build
 * history, credentials, and EAS Update channels, which is why it is the org and not a personal
 * account. Expo limits how many times a project can be transferred; picking correctly up front
 * avoids spending one.
 */
const EXPO_ACCOUNT_OWNER = 'dibs-tech';

/**
 * Release builds must be fully store-configured; development builds must not be blocked on
 * paperwork. EAS sets EAS_BUILD_PROFILE; treat anything but development/preview as a release.
 */
function isReleaseBuild(): boolean {
  const profile = process.env.EAS_BUILD_PROFILE;
  return Boolean(profile) && profile !== 'development' && profile !== 'preview';
}

export default ({ config }: ConfigContext): ExpoConfig => {
  const slug = process.env.STUDIO_SLUG ?? DEFAULT_STUDIO_SLUG;
  const { config: studio } = loadStudioConfig(slug);

  /**
   * Studio-supplied assets, referenced relative to the repo root so Expo resolves them the same
   * way it resolves ./assets. A studio without a usable square mark keeps the placeholder rather
   * than getting a squashed wordmark — see KNOWN_ASSET_GAPS in the white-label test suite.
   */
  const studioAsset = (file: string): string => `./whitelabel/studios/${studio.slug}/${file}`;
  const hasStoreReadyIcon = studio.assets.iconSource !== studio.assets.logo;

  if (isReleaseBuild()) validateStudioForRelease(studio);

  const iosBundleId = expectedIosBundleId(studio.slug, studio.ios.bundleId);
  const androidPackage = expectedAndroidPackage(studio.slug, studio.android.package);

  /**
   * Checked HERE because this file is the one thing every path evaluates — prebuild, run:ios,
   * run:android, expo start and EAS alike — so the guard fires whatever command was typed,
   * including a bare `npx expo run:ios` that never touches an npm script.
   */
  assertNativeProjectsMatchStudio({
    slug: studio.slug,
    projectRoot: __dirname,
    iosBundleId,
    androidPackage,
  });

  /**
   * Dev builds talk to a local dibs-api over plain HTTP, which iOS blocks by default. The
   * exception is scoped to loopback and is NEVER present in a release build.
   * @see docs/environments.md
   */
  const devApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const allowsLocalHttp = !isReleaseBuild() && devApiUrl?.startsWith('http://');

  /**
   * The launch image, chosen so the splash hands off to Home INVISIBLY.
   *
   * Home opens on the studio's hero filling the whole screen. If the splash shows that same file
   * at the same fit, the moment the app's first frame replaces the splash there is nothing to
   * see — the photograph simply stays where it is and then the content panel rises over it. Any
   * other launch image makes that moment a cut.
   *
   * `resizeMode: 'cover'` matches `contentFit="cover"` on Home's full-window photo layer, so both
   * compute the same crop for the same container. The two must stay in step: change one and the
   * photograph will appear to jump at handoff.
   *
   * A studio on `heroSource: 'remote'` cannot have this — their hero is not in the binary — so
   * they fall back to their designed splash, or to a mark on white. #FFFFFF, not the retired
   * #FDFBF7 warm off-white (shared CLAUDE.md, 2026-07-22).
   */
  const usesBundledHero = studio.assets.heroSource !== 'remote';
  const splashConfig = usesBundledHero
    ? {
        backgroundColor: '#FFFFFF',
        image: studioAsset(studio.assets.hero),
        resizeMode: 'cover' as const,
        // Without this, SDK 52+'s splash renders the image as a small centered icon on
        // white — the hero appeared as a postage stamp at launch (2026-08-16 screenshot),
        // destroying the invisible splash→Home handoff this whole block exists for.
        enableFullScreenImage_legacy: true,
      }
    : studio.assets.splash
      ? {
          backgroundColor: '#FFFFFF',
          image: studioAsset(studio.assets.splash),
          resizeMode: 'cover' as const,
          enableFullScreenImage_legacy: true,
        }
      : {
          backgroundColor: '#FFFFFF',
          image: hasStoreReadyIcon ? studioAsset(studio.assets.iconSource) : './assets/images/splash-icon.png',
          imageWidth: 160,
        };

  return {
    ...config,
    name: studio.appName,
    // Expo project slug — also the EAS Update channel and the OTA identity for this app.
    slug: studio.slug,
    owner: EXPO_ACCOUNT_OWNER,
    // Deep-link scheme. Per-studio so two Dibs apps on one phone cannot capture each other's links.
    scheme: `dibs-${studio.slug}`,
    // Per-studio: each app has its own version lineage. For the rescue apps this must exceed
    // what is live on the store (guarded in whitelabel/schema.ts) or the upload is rejected.
    version: studio.store.version,
    orientation: 'portrait',
    // The New Architecture is the default and no longer a config field in SDK 56; the
    // `newArchEnabled: true` that app.json carried is gone because it is now redundant.
    userInterfaceStyle: 'light',

    // The studio's own 1024² mark when they have supplied one; otherwise the placeholder,
    // because a squashed wordmark reads worse than a neutral icon and hides the gap.
    icon: hasStoreReadyIcon ? studioAsset(studio.assets.iconSource) : './assets/images/icon.png',

    ios: {
      supportsTablet: false,
      // Same value the stale-project guard above checks against. Deliberately not re-derived
      // here: two copies of "what is this studio's bundle id" is how they drift apart.
      bundleIdentifier: iosBundleId,
      // CFBundleVersion. Apple wants a string; the gate wants an integer; studio.json holds the
      // integer and this is the only place it becomes a string. Without it every prebuild
      // emitted "1", so every store upload after the first would be rejected as a duplicate and
      // the version gate would have had a constant to compare against.
      buildNumber: String(studio.store.buildNumber),
      infoPlist: {
        CFBundleDisplayName: studio.shortName,
        ...(allowsLocalHttp
          ? {
              NSAppTransportSecurity: {
                NSExceptionDomains: {
                  localhost: { NSExceptionAllowsInsecureHTTPLoads: true },
                  '10.0.2.2': { NSExceptionAllowsInsecureHTTPLoads: true },
                },
              },
            }
          : {}),
      },
    },

    android: {
      package: androidPackage,
      // Android's own integer build identity. Same source value as iOS's buildNumber, so one
      // studio.json bump moves both and the two platforms cannot disagree about what build this
      // is. Play requires it to increase on every upload.
      versionCode: studio.store.buildNumber,
      adaptiveIcon: {
        backgroundColor: '#FFFFFF',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
      // No cleartext override needed: Expo's Android DEBUG manifest already permits cleartext,
      // which is what lets the emulator reach the host API over http://10.0.2.2. Release
      // manifests do not — which is correct, since release builds are HTTPS-only.
    },

    plugins: [
      'expo-router',
      ['expo-splash-screen', splashConfig],
      'expo-secure-store',
      [
        '@stripe/stripe-react-native',
        {
          // Apple Pay merchant id lives under the STUDIO's Apple team (§6.3 item 4). Absent
          // until they enroll — Apple Pay simply does not appear until then; cards still work.
          merchantIdentifier: studio.ios.merchantId ?? '',
          enableGooglePay: true,
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/images/android-icon-monochrome.png',
          color: studio.accentColor,
        },
      ],
      [
        'expo-calendar',
        {
          // Shown at the moment the user taps "Add to calendar" — never at launch (§P3).
          calendarPermission: `${studio.appName} needs calendar access to add your bookings to your calendar.`,
        },
      ],
      [
        'expo-local-authentication',
        { faceIDPermission: `Use Face ID to sign back in to ${studio.appName}.` },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    /**
     * Everything the running app is allowed to know about which studio it is.
     * Read ONLY through `src/config/studio.ts` — never `Constants.expoConfig.extra` directly.
     */
    extra: {
      ...config.extra,
      // EAS resolves builds and updates through this. Recorded per studio in studio.json
      // because app.config.ts is dynamic and `eas init` cannot write into it.
      eas: studio.eas.projectId ? { projectId: studio.eas.projectId } : undefined,
      studio: {
        slug: studio.slug,
        dibsStudioId: studio.dibsStudioId,
        appName: studio.appName,
        shortName: studio.shortName,
        accentColor: studio.accentColor,
        timezone: studio.timezone,
        // The running build's integer identity, for the version gate. Read from the SAME value
        // that becomes CFBundleVersion / versionCode below, so the number JS compares and the
        // number the store sees cannot drift — which is the whole reason not to read this back
        // out of expo-constants' deprecated nativeBuildVersion or a second config field.
        buildNumber: studio.store.buildNumber,
        // Navigation reads these BEFORE the studio's own show_schedule/show_appts flags: a tab
        // may only appear when the build has code for it AND the studio offers it.
        features: studio.features,
        // The per-studio appointment wiring (endpoint variant, phantom-provider map). Data, not
        // code — this is what keeps `=== 263` out of src/.
        appointments: studio.appointments,
        display: studio.display,
        // Which photograph Home opens on. 'bundled' is what makes the splash handoff invisible.
        heroSource: studio.assets.heroSource,
        supportEmail: studio.support.email,
        privacyPolicyUrl: studio.legal.privacyPolicyUrl ?? null,
        // Null keeps the Clarity SDK dormant — see `analytics` in whitelabel/schema.ts.
        clarityProjectId: studio.analytics.clarityProjectId ?? null,
        // Null → Apple Pay is simply not offered; the sheet stays card-only.
        merchantId: studio.ios.merchantId ?? null,
        // EXPO_PUBLIC_API_URL wins in development so a simulator, an emulator and a device on
        // the LAN can each point somewhere different without editing studio.json.
        apiUrl: devApiUrl ?? studio.api.url,
      },
    },
  };
};

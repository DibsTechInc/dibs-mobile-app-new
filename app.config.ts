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
import { validateStudioForRelease } from './whitelabel/schema.ts';

/** The studio a bare `npx expo run:ios` builds when nothing says otherwise. */
const DEFAULT_STUDIO_SLUG = 'carlsbad-village-yoga';

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

  /**
   * Dev builds talk to a local dibs-api over plain HTTP, which iOS blocks by default. The
   * exception is scoped to loopback and is NEVER present in a release build.
   * @see docs/environments.md
   */
  const devApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const allowsLocalHttp = !isReleaseBuild() && devApiUrl?.startsWith('http://');

  return {
    ...config,
    name: studio.appName,
    // Expo project slug — also the EAS Update channel and the OTA identity for this app.
    slug: studio.slug,
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
      bundleIdentifier: studio.ios.bundleId ?? `com.ondibs.dev.${studio.slug.replace(/-/g, '')}`,
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
      package: studio.android.package ?? `com.ondibs.dev.${studio.slug.replace(/-/g, '')}`,
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
      [
        'expo-splash-screen',
        // A studio-designed launch image fills the screen; otherwise centre a mark on white.
        // #FFFFFF, not the retired #FDFBF7 warm off-white (shared CLAUDE.md, 2026-07-22).
        studio.assets.splash
          ? {
              backgroundColor: '#FFFFFF',
              image: studioAsset(studio.assets.splash),
              resizeMode: 'cover',
            }
          : {
              backgroundColor: '#FFFFFF',
              image: hasStoreReadyIcon
                ? studioAsset(studio.assets.iconSource)
                : './assets/images/splash-icon.png',
              imageWidth: 160,
            },
      ],
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
      studio: {
        slug: studio.slug,
        dibsStudioId: studio.dibsStudioId,
        appName: studio.appName,
        shortName: studio.shortName,
        accentColor: studio.accentColor,
        timezone: studio.timezone,
        // Navigation reads these BEFORE the studio's own show_schedule/show_appts flags: a tab
        // may only appear when the build has code for it AND the studio offers it.
        features: studio.features,
        display: studio.display,
        supportEmail: studio.support.email,
        privacyPolicyUrl: studio.legal.privacyPolicyUrl ?? null,
        // EXPO_PUBLIC_API_URL wins in development so a simulator, an emulator and a device on
        // the LAN can each point somewhere different without editing studio.json.
        apiUrl: devApiUrl ?? studio.api.url,
      },
    },
  };
};

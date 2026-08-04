/**
 * The white-label studio config schema.
 *
 * This file is read by BOTH build-time tooling (app.config.ts, scripts/) and — via
 * `src/config/studio.ts` — the running app, so it must stay dependency-free apart from zod.
 * No React Native imports, no Node built-ins.
 *
 * Store-account fields (Apple team id, ASC app id, bundle ids, merchant id, Play package)
 * are optional in the schema because they do not exist until a studio finishes its own
 * Apple/Play enrollment (MOBILE_MASTER_PLAN §6.3), which is paperwork with weeks of lead
 * time. They are REQUIRED to produce a store build: `validateStudioForRelease` enforces
 * them, and only the release path calls it. Development builds run happily without them.
 */
import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'must be a 6-digit hex color like #356280');

/**
 * iOS bundle identifier. Apple permits hyphens; one of our own legacy listings uses one
 * (`com.alicia-dibs.conbody`), so the pattern must not reject them — an update build has to
 * match the live identifier byte-for-byte or the store treats it as a different app.
 */
const iosBundleId = z
  .string()
  .regex(
    /^[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z][a-zA-Z0-9-]*)+$/,
    'must be reverse-DNS with at least two segments (e.g. com.ondibs.everydayballetapp)',
  );

/**
 * Android application id. Each segment must be a valid Java identifier, so hyphens are
 * illegal here even though iOS allows them.
 */
const androidPackage = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/,
    'must be reverse-DNS, lowercase, no hyphens (Java identifier rules)',
  );

/** Semver-ish "1.8" / "2.0.0" as the stores understand it. */
const storeVersion = z
  .string()
  .regex(/^\d+(\.\d+){1,2}$/, 'must look like 2.0 or 2.0.0');

/** Compare store version strings numerically, segment by segment. */
export function compareStoreVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  return 0;
}

export const studioConfigSchema = z.object({
  /** Directory name under whitelabel/studios/. Also the EAS/OTA channel name. */
  slug: z
    .string()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'must be lower-kebab-case'),

  /** The dibs_studios.id this app is bound to. The ONLY place this number may live. */
  dibsStudioId: z.number().int().positive(),

  /**
   * App Store name. Apple caps this at 30 characters.
   * @see MOBILE_MASTER_PLAN §11 — "Independent Training Spot NYC" is 28 and deliberate.
   */
  appName: z.string().min(1).max(30),

  /**
   * Home-screen label under the icon. iOS truncates around 12 characters, so a long
   * appName needs a short one of these or the launcher shows an ellipsis.
   */
  shortName: z.string().min(1).max(15),

  /** The studio's brand color. Everything interactive derives from it (src/theme/accent.ts). */
  accentColor: hexColor,

  /**
   * Studio timezone (IANA). Comes live from get-basic-config as `mainTZ` too; pinned here so
   * time math has a value before the first network response resolves.
   */
  timezone: z.string().min(1),

  /**
   * How this app reaches the stores. Two very different paths:
   *
   *  • `ownership: 'dibs'` + `releaseType: 'update'` — the app ALREADY EXISTS under the Dibs
   *    Technology Inc account and we ship the rebuild as a version update to the same bundle
   *    id. Existing installs upgrade in place, ratings and reviews survive, and no Apple
   *    Developer enrollment is on the critical path. This is the path for Carlsbad Village
   *    Yoga and Everyday Ballet, whose 2021-era apps are live but broken.
   *  • `ownership: 'studio'` + `releaseType: 'new'` — a brand-new listing under the STUDIO's
   *    own developer account, per Apple Guideline 4.2.6 (MOBILE_MASTER_PLAN §6.3). Weeks of
   *    enrollment paperwork.
   *
   * A Dibs-owned app can be transferred to the studio's account later without losing users or
   * reviews, so 'dibs' is a bridge rather than a trap.
   */
  store: z.object({
    ownership: z.enum(['dibs', 'studio']),
    releaseType: z.enum(['update', 'new']),
    /** The version this build ships as. Must exceed `lastKnownStoreVersion` for an update. */
    version: storeVersion.default('2.0.0'),
    /**
     * What the store showed last time we looked, for reference and for the version guard.
     * Not authoritative — App Store Connect is. Update it when you check.
     */
    lastKnownStoreVersion: storeVersion.optional(),
    /** Free-text note about the listing's state, surfaced in reports. */
    notes: z.string().optional(),
  }),

  /**
   * Which product surfaces this build ships.
   *
   * v1 is CLASSES ONLY (Alicia, 2026-08-04): the studios whose apps we are rescuing take group
   * bookings only, and the appointments rail is a materially larger surface — availability
   * slots, service providers, a separate booking endpoint, and the recurring-subscription
   * payNow/hold split with its 20th/25th invoice cycle. Deferring it removes roughly a phase
   * of work without foreclosing anything: the flag exists from day one and every navigation
   * decision reads it.
   *
   * A tab appears only when BOTH this flag and the studio's own `show_appts` / `show_schedule`
   * config say so — the build must never render a surface it has no code for.
   */
  features: z
    .object({
      classes: z.boolean().default(true),
      appointments: z.boolean().default(false),
    })
    .default({ classes: true, appointments: false }),

  /**
   * Per-studio display switches that are NOT derivable from get-basic-config.
   * Keep this list short — anything the backend already knows belongs in the API response,
   * not in a build artifact that needs a store release to change.
   */
  display: z
    .object({
      /**
       * false → never render instructor names or the instructor filter.
       * Studio 263 rents space to independent trainers; its `trainerid` is a phantom
       * auto-assignment and showing it would be actively wrong.
       * @see .claude/CLAUDE.md § Studio Exceptions → Studio 263
       */
      showInstructor: z.boolean().default(true),
    })
    .default({ showInstructor: true }),

  ios: z.object({
    /**
     * For `releaseType: 'update'` this MUST be the live listing's identifier exactly — a
     * mismatch silently produces a second, separate app instead of an update.
     */
    bundleId: iosBundleId.optional(),
    /** Apple Developer Team ID — Dibs's team for 'dibs' ownership, the studio's for 'studio'. */
    appleTeamId: z.string().optional(),
    /** App Store Connect app id. Already assigned for an existing listing. */
    ascAppId: z.string().optional(),
    /** Apple Pay merchant id, created under whichever team owns the app. */
    merchantId: z.string().optional(),
  }),

  android: z.object({
    package: androidPackage.optional(),
  }),

  support: z.object({
    email: z.string().email(),
  }),

  legal: z.object({
    /** Required on every store listing. Hosting model decided in P9. */
    privacyPolicyUrl: z.string().url().optional(),
    supportUrl: z.string().url().optional(),
  }),

  api: z.object({
    /**
     * Production API base for this studio's shipped app, including /api/v2.
     * NOT api.ondibs.com, NOT *.herokuapp.com — see docs/environments.md.
     * EXPO_PUBLIC_API_URL overrides this during development.
     */
    url: z.string().url(),
  }),

  assets: z
    .object({
      logo: z.string().default('assets/logo.png'),
      hero: z.string().default('assets/hero.jpg'),
      iconSource: z.string().default('assets/icon-source.png'),
    })
    .default({
      logo: 'assets/logo.png',
      hero: 'assets/hero.jpg',
      iconSource: 'assets/icon-source.png',
    }),
});

export type StudioConfig = z.infer<typeof studioConfigSchema>;

/** Fields that must be present before a build can be submitted to a store. */
const RELEASE_REQUIRED: ReadonlyArray<readonly [string, (c: StudioConfig) => unknown]> = [
  ['ios.bundleId', (c) => c.ios.bundleId],
  ['ios.appleTeamId', (c) => c.ios.appleTeamId],
  ['ios.merchantId', (c) => c.ios.merchantId],
  ['android.package', (c) => c.android.package],
  ['legal.privacyPolicyUrl', (c) => c.legal.privacyPolicyUrl],
];

/**
 * Throws unless the config carries everything a store submission needs.
 *
 * Called only by release builds — development builds tolerate a half-configured studio so app
 * work is never blocked on paperwork or on a bundle id we have not looked up yet.
 */
export function validateStudioForRelease(config: StudioConfig): void {
  const missing = RELEASE_REQUIRED.filter(([, get]) => !get(config)).map(([path]) => path);
  if (missing.length > 0) {
    throw new Error(
      `Studio "${config.slug}" cannot be released yet — missing: ${missing.join(', ')}.\n` +
        (config.store.ownership === 'studio'
          ? "These come from the studio's own Apple/Play enrollment (MOBILE_MASTER_PLAN §6.3)."
          : 'These come from the existing listing in the Dibs Technology Inc store accounts.'),
    );
  }

  if (config.store.releaseType === 'update') {
    // An update that does not out-version the live listing is rejected at submission; catching
    // it here costs a second instead of a review cycle.
    const live = config.store.lastKnownStoreVersion;
    if (live && compareStoreVersions(config.store.version, live) <= 0) {
      throw new Error(
        `Studio "${config.slug}" ships version ${config.store.version}, which does not exceed ` +
          `the live store version ${live}. Bump store.version.`,
      );
    }
  }
}

/**
 * Structural checks that hold for EVERY config, release or not.
 *
 * Separate from `validateStudioForRelease` because these catch a config that is internally
 * incoherent (as opposed to merely incomplete) — that is a bug to fix now, not paperwork to
 * wait on. Returns a list of problems; empty means fine.
 */
export function findStudioConfigProblems(config: StudioConfig): string[] {
  const problems: string[] = [];

  if (config.store.releaseType === 'update' && !config.ios.bundleId) {
    problems.push(
      'store.releaseType is "update" but ios.bundleId is unset. An update MUST reuse the live ' +
        "listing's exact bundle id — shipping without it creates a second app and strands the " +
        'existing installs.',
    );
  }

  if (config.store.releaseType === 'new' && config.store.lastKnownStoreVersion) {
    problems.push(
      'store.releaseType is "new" but lastKnownStoreVersion is set, which implies a listing ' +
        'already exists. Pick one.',
    );
  }

  if (!config.features.classes && !config.features.appointments) {
    problems.push('features: the app ships no bookable surface at all (classes and appointments both false).');
  }

  return problems;
}

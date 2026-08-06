/**
 * White-label config validation, enforced by `npm test` (and therefore by CI).
 *
 * This replaces the `scripts/validate-studio.ts` the plan sketched: making it a test means it
 * runs on every PR with no extra runner and no new dependency, and a broken studio config
 * cannot merge.
 *
 * The suite is split deliberately:
 *   • HARD requirements  — always enforced. A new studio cannot be added that violates them.
 *   • KNOWN ASSET GAPS   — an explicit registry of studios whose brand assets are not yet
 *                          store-ready. Adding a studio without adding it here fails the build,
 *                          so the gap can never be silent; removing a studio from the list is
 *                          how you record that its assets landed.
 */
import fs from 'node:fs';

import { deriveAccentScale, AA_NORMAL_TEXT } from '../../src/theme/color';
import { listStudioSlugs, loadStudioConfig, readImageSize } from '../load';
import {
  compareStoreVersions,
  findStudioConfigProblems,
  studioConfigSchema,
  validateStudioForRelease,
} from '../schema';

/** An App Store icon is 1024×1024. Anything squarer-and-bigger can be downscaled to it. */
const MIN_ICON_SIZE = 1024;
const ICON_ASPECT_TOLERANCE = 0.1;

/** A vertical hero has to survive being the splash on a 6.7" phone. */
const MIN_HERO_HEIGHT = 1200;
const MIN_HERO_ASPECT = 1.2; // height / width

/**
 * Studios whose supplied assets are NOT yet store-ready, and why.
 *
 * The pilots were originally onboarded for the WEB widget, where the hero is a landscape banner
 * and the logo is a wordmark — neither shape works on a phone, which wants a vertical photo and
 * a 1024² square. Everyday Ballet's real assets arrived 2026-08-04 and it is off this list.
 * Delete an entry when its assets land; adding a studio without either good assets or an entry
 * here fails the build.
 */
const KNOWN_ASSET_GAPS: Record<string, { hero?: string; icon?: string }> = {
  'independent-training-spot': {
    hero: '1200×656 landscape marketing banner — not a vertical hero photo',
    icon: '180×281 logo — too small and not square for a 1024² app icon',
    // Deferred past v1 anyway (§0.1-B), so these are not on the critical path.
  },
  // Carlsbad Village Yoga's assets landed 2026-08-04 and it is off this list. Its icon is derived
  // from a 774² source (badge cropped, flattened, upscaled 1.61×) rather than a native 1024²
  // export — good enough to ship, and a fresh export from the .eps would sharpen the App Store
  // listing. Everyday Ballet's arrived the same day and were natively sized.
};

const slugs = listStudioSlugs();

describe('white-label studio registry', () => {
  it('has at least one studio configured', () => {
    expect(slugs.length).toBeGreaterThan(0);
  });

  it('ships the _template config, and it validates against the schema', () => {
    // The template is the documentation. If it drifts out of schema, every new studio starts broken.
    const raw: unknown = JSON.parse(
      fs.readFileSync(`${__dirname}/../studios/_template/studio.json`, 'utf8'),
    );
    expect(studioConfigSchema.safeParse(raw).success).toBe(true);
  });

  it('assigns each dibsStudioId to exactly one app', () => {
    const byId = new Map<number, string[]>();
    for (const slug of slugs) {
      const { config } = loadStudioConfig(slug);
      byId.set(config.dibsStudioId, [...(byId.get(config.dibsStudioId) ?? []), slug]);
    }
    const collisions = [...byId.entries()].filter(([, owners]) => owners.length > 1);
    expect(collisions).toEqual([]);
  });

  it('never reuses a bundle id or Android package across studios', () => {
    const seen = new Map<string, string>();
    for (const slug of slugs) {
      const { config } = loadStudioConfig(slug);
      for (const id of [config.ios.bundleId, config.android.package]) {
        if (!id) continue;
        expect(seen.get(id) ?? slug).toBe(slug);
        seen.set(id, slug);
      }
    }
  });

  it('every configured studio is covered by the asset-gap registry (or has none)', () => {
    // Forces a decision when a studio is added: either its assets are good, or the gap is recorded.
    const uncovered = slugs.filter((slug) => {
      const gap = KNOWN_ASSET_GAPS[slug];
      if (gap) return false;
      const { assets } = loadStudioConfig(slug);
      const hero = readImageSize(assets.hero);
      const icon = readImageSize(assets.iconSource);
      const heroOk =
        hero !== null && hero.height >= MIN_HERO_HEIGHT && hero.height / hero.width >= MIN_HERO_ASPECT;
      const iconOk =
        icon !== null &&
        icon.width >= MIN_ICON_SIZE &&
        Math.abs(icon.width / icon.height - 1) <= ICON_ASPECT_TOLERANCE;
      return !heroOk || !iconOk;
    });
    expect(uncovered).toEqual([]);
  });

  it('has no stale gap entries for studios that no longer exist', () => {
    expect(Object.keys(KNOWN_ASSET_GAPS).filter((slug) => !slugs.includes(slug))).toEqual([]);
  });

  it('pins the two rescue apps to their real live bundle ids', () => {
    // Looked up from the public App Store on 2026-08-04; both listings are owned by
    // "Dibs Technology Inc". If either of these strings changes, the rebuild stops being an
    // update to the app the studio's clients already have installed.
    expect(loadStudioConfig('carlsbad-village-yoga').config.ios.bundleId).toBe(
      'com.ondibs.carlsbadvillageyogaapp',
    );
    expect(loadStudioConfig('everyday-ballet').config.ios.bundleId).toBe(
      'com.ondibs.everydayballetapp',
    );
  });
});

describe('store version comparison', () => {
  it.each([
    ['2.0.0', '1.8', 1],
    ['1.8', '2.0.0', -1],
    ['2.0', '2.0.0', 0],
    ['1.10', '1.9', 1],
    ['1.6', '1.6', 0],
  ])('compares %s to %s', (a, b, expected) => {
    expect(compareStoreVersions(a as string, b as string)).toBe(expected);
  });
});

describe.each(slugs)('studio: %s', (slug) => {
  const { config, assets } = loadStudioConfig(slug);

  it('parses against the schema and matches its directory name', () => {
    expect(config.slug).toBe(slug);
    expect(config.dibsStudioId).toBeGreaterThan(0);
  });

  it('keeps appName inside the 30-character App Store limit', () => {
    expect(config.appName.length).toBeLessThanOrEqual(30);
  });

  it('points at a real API host, never a retired one', () => {
    // docs/environments.md: both Heroku hosts are dead, and api.ondibs.com never existed.
    expect(config.api.url).toMatch(/^https:\/\//);
    expect(config.api.url).not.toMatch(/herokuapp\.com|api\.ondibs\.com/);
    expect(config.api.url).toMatch(/\/api\/v2$/);
  });

  it('names a timezone the runtime can actually resolve', () => {
    expect(() =>
      new Intl.DateTimeFormat('en-US', { timeZone: config.timezone }).format(new Date(0)),
    ).not.toThrow();
  });

  it('has every branded asset present and readable', () => {
    for (const [name, file] of Object.entries(assets)) {
      if (file === null) continue;
      expect(fs.existsSync(file)).toBe(true);
      const size = readImageSize(file);
      expect(size).not.toBeNull();
      expect(size!.width).toBeGreaterThan(0);
      expect(`${name}:${size!.height}`).not.toBe(`${name}:0`);
    }
  });

  it('has store-ready icon and hero assets, unless a gap is recorded', () => {
    const gap = KNOWN_ASSET_GAPS[slug] ?? {};

    if (!gap.icon) {
      const icon = readImageSize(assets.iconSource)!;
      expect(icon.width).toBeGreaterThanOrEqual(MIN_ICON_SIZE);
      expect(Math.abs(icon.width / icon.height - 1)).toBeLessThanOrEqual(ICON_ASPECT_TOLERANCE);
    }
    if (!gap.hero) {
      const hero = readImageSize(assets.hero)!;
      expect(hero.height).toBeGreaterThanOrEqual(MIN_HERO_HEIGHT);
      expect(hero.height / hero.width).toBeGreaterThanOrEqual(MIN_HERO_ASPECT);
    }
  });

  it('has an app icon with no alpha channel', () => {
    // App Store Connect rejects an icon carrying an alpha channel, even a fully opaque one.
    // Both studios' supplied files had one and had to be flattened; this stops it recurring.
    if (KNOWN_ASSET_GAPS[slug]?.icon) return;
    expect(readImageSize(assets.iconSource)!.hasAlphaChannel).toBe(false);
  });

  it('ships a portrait splash when it declares one', () => {
    if (!assets.splash) return;
    const splash = readImageSize(assets.splash)!;
    expect(splash.height).toBeGreaterThan(splash.width);
  });

  it('can have its hero bundled, which is what makes the splash handoff invisible', () => {
    // `metro.config.js` resolves `@studio/hero` by reading THIS field out of studio.json and
    // requiring that exact file. If the declared path is wrong the bundler throws, and the app
    // does not build at all — so this is the check that turns a config typo into a red test
    // instead of a failed build. It is deliberately independent of the readability test above:
    // that one iterates whatever `assets` happens to contain; this one asserts the specific
    // contract the bundler depends on.
    expect(config.assets.hero).toMatch(/^assets\//);
    expect(fs.existsSync(assets.hero)).toBe(true);
  });

  it('opens on a bundled photograph unless it has deliberately opted out', () => {
    // 'remote' gives a studio the ability to change their photo without a store release, and
    // costs them the seamless open — the image cannot be on screen at frame zero. Nobody should
    // land on it by accident, so the default is asserted here rather than only in the schema.
    expect(config.assets.heroSource).toBe('bundled');
  });

  it('is linked to its own EAS project, distinct from every other studio', () => {
    // One project per studio, mapping 1:1 to a store listing. A shared or missing project id
    // means builds and EAS Updates cannot tell the apps apart.
    const gap = KNOWN_ASSET_GAPS[slug];
    if (gap) return; // deferred studios are not built yet

    expect(config.eas.projectId).toBeTruthy();
    const others = slugs
      .filter((other) => other !== slug)
      .map((other) => loadStudioConfig(other).config.eas.projectId)
      .filter(Boolean);
    expect(others).not.toContain(config.eas.projectId);
  });

  it('only demands Android identifiers when it actually targets Android', () => {
    // v1 is iOS-only. A missing package name must not block an iOS release.
    if (!config.store.platforms.includes('android')) {
      expect(config.android.package).toBeUndefined();
    }
  });

  it('produces an accessible accent scale from the studio colour', () => {
    const scale = deriveAccentScale(config.accentColor);
    expect(scale.meta.fillContrast).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    expect(scale.meta.inkContrast).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it('is internally coherent', () => {
    expect(findStudioConfigProblems(config)).toEqual([]);
  });

  it('ships a bookable surface that this build actually has code for', () => {
    // v1 is classes-only. A studio whose ONLY enabled surface is appointments has nothing to
    // render, which is exactly why 263 is deferred rather than half-built.
    expect(config.features.classes || config.features.appointments).toBe(true);
  });

  it('never ships an update without the live listing’s bundle id', () => {
    // The whole point of the update path is that existing installs upgrade in place. A wrong
    // or missing bundle id silently produces a SECOND app and strands them.
    if (config.store.releaseType === 'update') {
      expect(config.ios.bundleId).toBeTruthy();
      expect(config.store.lastKnownStoreVersion).toBeTruthy();
      expect(
        compareStoreVersions(config.store.version, config.store.lastKnownStoreVersion!),
      ).toBeGreaterThan(0);
    }
  });

  it('is correctly classified as release-ready or not', () => {
    // Store fields arrive with the studio's own Apple/Play enrollment (§6.3). Until then a
    // release build MUST refuse — silently shipping a half-configured app is the failure mode.
    const hasStoreIdentity = Boolean(config.ios.bundleId && config.android.package);
    if (hasStoreIdentity) {
      expect(() => validateStudioForRelease(config)).not.toThrow();
    } else {
      expect(() => validateStudioForRelease(config)).toThrow(/cannot be released yet/);
    }
  });
});

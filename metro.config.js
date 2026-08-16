const fs = require('fs');
const path = require('path');

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * `@studio/hero` resolves to THIS build's hero photograph.
 *
 * App code needs the studio's hero as a BUNDLED image — one that exists in the very first frame,
 * with no network — so the native splash can hand off to Home without a seam. A bundled image
 * needs a static `require`, and a static require cannot carry a variable path.
 *
 * The alternatives were both worse. A generated file adds a codegen step that can go stale
 * against `STUDIO_SLUG`. A hand-maintained map of every studio would statically resolve all of
 * them, so every studio's app would ship every other studio's photographs — a bundle-size problem
 * and, more to the point, other people's brand assets inside a client's app.
 *
 * Resolved by FILENAME FROM studio.json rather than by a fixed `hero.jpg`, because the extension
 * genuinely varies (263's is a PNG) and studio.json is the source of truth for what a studio's
 * assets are called. Hardcoding the extension here would make the bundler fail for a studio whose
 * config is perfectly valid.
 *
 * Must stay in step with `app.config.ts`, which reads the same env var to pick the studio.
 */
const STUDIO_SLUG = process.env.STUDIO_SLUG ?? 'carlsbad-village-yoga';
const STUDIO_DIR = path.resolve(__dirname, 'whitelabel/studios', STUDIO_SLUG);

function resolveHeroPath() {
  const configPath = path.join(STUDIO_DIR, 'studio.json');
  const studio = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  // Same default as whitelabel/schema.ts. Kept in sync by the studios test suite.
  const hero = studio?.assets?.hero ?? 'assets/hero.jpg';
  const heroPath = path.join(STUDIO_DIR, hero);

  if (!fs.existsSync(heroPath)) {
    // Failing here beats failing at runtime with a blank hero: a build that cannot find the
    // studio's photograph is not a build for that studio.
    throw new Error(
      `Studio "${STUDIO_SLUG}" declares assets.hero "${hero}" but ${heroPath} does not exist.`,
    );
  }
  return heroPath;
}

const HERO_PATH = resolveHeroPath();

/** Same contract as the hero: filename from studio.json, fail at build time if it is missing. */
function resolveLogoPath() {
  const configPath = path.join(STUDIO_DIR, 'studio.json');
  const studio = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const logo = studio?.assets?.logo ?? 'assets/logo.png';
  const logoPath = path.join(STUDIO_DIR, logo);
  if (!fs.existsSync(logoPath)) {
    throw new Error(
      `Studio "${STUDIO_SLUG}" declares assets.logo "${logo}" but ${logoPath} does not exist.`,
    );
  }
  return logoPath;
}

const LOGO_PATH = resolveLogoPath();

/**
 * Stripe is native-only, so the WEB bundle cannot build with it — and the web bundle is the only
 * way to look at a screen without a device. Two builds shipped broken on 2026-08-07 because there
 * was no way to see them; this makes `expo start --web` a working design loop.
 *
 * Scoped to `platform === 'web'`, so iOS and Android are untouched and still get the real SDK.
 */
const STRIPE_WEB_STUB = path.resolve(__dirname, 'web-preview/stripe-stub.js');

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@studio/hero') {
    return { type: 'sourceFile', filePath: HERO_PATH };
  }
  if (moduleName === '@studio/logo') {
    return { type: 'sourceFile', filePath: LOGO_PATH };
  }
  if (platform === 'web' && moduleName.startsWith('@stripe/stripe-react-native')) {
    return { type: 'sourceFile', filePath: STRIPE_WEB_STUB };
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;

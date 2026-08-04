/**
 * Build-time loader for white-label studio configs.
 *
 * Node-only (uses fs/path). Imported by `app.config.ts`, by the validation test, and by any
 * future release tooling. The RUNTIME counterpart is `src/config/studio.ts`, which reads the
 * already-resolved config out of `expo-constants` — the app never touches the filesystem.
 */
import fs from 'node:fs';
import path from 'node:path';

import { type StudioConfig, studioConfigSchema } from './schema.ts';

/**
 * Locate `whitelabel/studios` by walking up from the current working directory.
 *
 * `__dirname` is deliberately NOT used: this module is loaded two different ways — as CommonJS
 * by ts-jest, and as an ES module by Expo's config loader, which requires `./load.ts` from a
 * transpiled `app.config.js`. `__dirname` is undefined in the second case and the failure is
 * silent (it resolves to a relative "studios" path that happens not to exist). Walking up from
 * cwd behaves identically in both.
 */
function findStudiosDir(): string {
  let dir = process.cwd();
  for (let depth = 0; depth < 10; depth += 1) {
    const candidate = path.join(dir, 'whitelabel', 'studios');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(
    `Could not find whitelabel/studios walking up from ${process.cwd()}. ` +
      'Run this from inside the dibs-mobile-app repo.',
  );
}

export const STUDIOS_DIR = findStudiosDir();

/** Directories under studios/ that are not studios. */
const NON_STUDIO_DIRS = new Set(['_template']);

export function listStudioSlugs(): string[] {
  return fs
    .readdirSync(STUDIOS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !NON_STUDIO_DIRS.has(entry.name))
    .map((entry) => entry.name)
    .sort();
}

export interface LoadedStudio {
  config: StudioConfig;
  /** Absolute path to the studio's directory. */
  dir: string;
  /** Absolute paths to the branded assets, resolved from the config. */
  assets: {
    logo: string;
    hero: string;
    iconSource: string;
  };
}

export function loadStudioConfig(slug: string): LoadedStudio {
  const dir = path.join(STUDIOS_DIR, slug);
  const configPath = path.join(dir, 'studio.json');

  if (!fs.existsSync(configPath)) {
    const available = listStudioSlugs();
    throw new Error(
      `No white-label config for STUDIO_SLUG="${slug}" (looked for ${configPath}).\n` +
        `Available: ${available.length ? available.join(', ') : '(none)'}`,
    );
  }

  const raw: unknown = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const parsed = studioConfigSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n');
    throw new Error(`Invalid ${slug}/studio.json:\n${issues}`);
  }

  const config = parsed.data;
  if (config.slug !== slug) {
    throw new Error(
      `Directory name "${slug}" does not match slug "${config.slug}" inside studio.json. ` +
        'The directory name is what STUDIO_SLUG selects, so they must agree.',
    );
  }

  return {
    config,
    dir,
    assets: {
      logo: path.join(dir, config.assets.logo),
      hero: path.join(dir, config.assets.hero),
      iconSource: path.join(dir, config.assets.iconSource),
    },
  };
}

export interface ImageSize {
  width: number;
  height: number;
}

/**
 * Read pixel dimensions straight out of a PNG or JPEG header.
 *
 * Deliberately dependency-free: `sharp` is a native module and pulling it in just to sanity-check
 * a handful of brand assets would make `npm install` heavier for everyone. Returns null for
 * formats we do not parse rather than guessing.
 */
export function readImageSize(filePath: string): ImageSize | null {
  const buf = fs.readFileSync(filePath);

  // PNG: 8-byte signature, then a 25-byte IHDR chunk whose width/height are at 16 and 20.
  if (buf.length >= 24 && buf.toString('ascii', 12, 16) === 'IHDR') {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG: walk the segment markers until an SOFn frame header, which carries the dimensions.
  if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buf.length) {
      if (buf[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buf[offset + 1];
      // SOF0..SOF15, excluding the non-frame markers DHT (c4), JPGA (c8) and DAC (cc).
      const isFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isFrame) {
        return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
  }

  return null;
}

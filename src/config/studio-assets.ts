/**
 * The studio's BUNDLED brand assets — the ones that exist before any network call.
 *
 * ── Why the hero is bundled and not fetched ─────────────────────────────────────────────────
 * The native splash and Home's first frame must be the same photograph, at the same crop, or the
 * handoff between them is a visible cut. The splash is baked into the binary by definition, so
 * the only way for Home's first frame to match it is for that frame to be bundled too. A remote
 * `heroUrl` cannot be on screen at frame zero — it has to be requested, and on a cold start the
 * splash would hand off to an empty wash while it downloads, which is a worse seam than the one
 * we were trying to remove.
 *
 * ── What this costs, and how it is given back ───────────────────────────────────────────────
 * It gives up "a studio can change their photograph without a store release" — which was the
 * original reason `heroUrl` fed Home. That promise is preserved as an opt-in: a studio config
 * with `assets.heroSource: 'remote'` goes back to the live URL and gives up the seamless open.
 * Bundled is the default because the seamless open is worth more to every studio we have, and
 * because the live URLs are currently the wrong images anyway (landscape web banners, one of
 * them 689px wide).
 *
 * `require` is resolved by Metro through the `@studio` alias, so exactly one studio's assets are
 * bundled into any given build.
 */
import heroImage from '@studio/hero';
import logoImage from '@studio/logo';

import { studio } from './studio';

/**
 * The studio's vertical hero, as a bundled asset handle.
 *
 * Null when the studio has opted into the remote URL — the caller then falls back to
 * `heroUrl` from get-basic-config.
 */
export const bundledHero: number | null = studio.heroSource === 'remote' ? null : heroImage;

/**
 * The studio's logo, bundled. Always present — the metro resolver fails the build for a studio
 * whose declared logo file is missing, which beats a brand mark silently absent from Home.
 */
export const bundledLogo: number = logoImage;

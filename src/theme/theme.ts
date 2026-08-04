/**
 * The merge point: Layer 1 (template DNA) + Layer 2 (studio personality) → one Theme.
 *
 * PURE TypeScript — no React Native, no expo-constants. The provider injects the studio's
 * values; this module just combines them, so the whole thing is testable in Node and a mock
 * generator or a screenshot script can build a theme without booting the app.
 *
 * **No component may reference a raw hex.** Everything comes from here (§9 invariant 9, and a
 * CI grep enforces it).
 */
import { type AccentScale, deriveAccentScale } from './color';
import {
  elevation,
  heroScrim,
  ICON_STROKE_WIDTH,
  MIN_TAP_TARGET,
  motion,
  palette,
  radii,
  spacing,
  typography,
} from './tokens';

/** What the white-label config contributes. Deliberately small — three things and some strings. */
export interface StudioPersonality {
  accentColor: string;
  appName: string;
  /** Remote or bundled URI. Null when the studio has no usable hero. */
  heroUri?: string | null;
  logoUri?: string | null;
  /** 263-style studios where instructor data is auto-assigned and meaningless. */
  showInstructor?: boolean;
}

export interface Theme {
  colors: typeof palette & {
    /** The studio's colour exactly as given. Decorative use only — not guaranteed legible. */
    accent: string;
    /** Accent adjusted so `onAccent` text on it clears AA. Use for filled buttons. */
    accentFill: string;
    accentPressed: string;
    onAccent: string;
    /** Accent adjusted to work as TEXT on the background. */
    accentInk: string;
    accentWash: string;
    accentBorder: string;
  };
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  motion: typeof motion;
  elevation: typeof elevation;
  heroScrim: typeof heroScrim;
  minTapTarget: number;
  iconStrokeWidth: number;
  studio: StudioPersonality;
  /** What the accent guard had to do. Surfaced so a bad studio colour is visible, not silent. */
  accentMeta: AccentScale['meta'];
}

export function createTheme(studio: StudioPersonality): Theme {
  const accent = deriveAccentScale(studio.accentColor, {
    background: palette.background,
    ink: palette.text,
  });

  return {
    colors: {
      ...palette,
      accent: accent.accent,
      accentFill: accent.accentFill,
      accentPressed: accent.accentPressed,
      onAccent: accent.onAccent,
      accentInk: accent.accentInk,
      accentWash: accent.accentWash,
      accentBorder: accent.accentBorder,
    },
    spacing,
    radii,
    typography,
    motion,
    elevation,
    heroScrim,
    minTapTarget: MIN_TAP_TARGET,
    iconStrokeWidth: ICON_STROKE_WIDTH,
    studio: { showInstructor: true, ...studio },
    accentMeta: accent.meta,
  };
}

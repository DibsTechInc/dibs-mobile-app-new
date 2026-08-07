/**
 * Layer 1 — Template DNA. Fixed, identical in every studio's app.
 *
 * PURE TypeScript, no React Native imports, so it is testable in the Node jest project.
 *
 * This is the thing that makes a Dibs-built app not look like gym software. The studio supplies
 * a colour, a logo, and a photo; everything here — the type scale, the spacing rhythm, the
 * component anatomy — is ours and does not vary. Source: `DESIGN_BRIEF.md` § "Layer 1".
 *
 * The one rule that governs everything below: **the accent is scarce.** Neutrals carry the
 * interface, typography carries the identity, and the studio's colour appears on the primary
 * CTA, the selected state, and one highlight per screen. That restraint is what keeps a
 * neon-brand studio's app from reading as a toy.
 */

/**
 * ⚠️ BACKGROUND COLOUR — a live conflict between two docs, resolved here in one token.
 *
 * `DESIGN_BRIEF.md` (2026-07-21) specifies warm off-white `#FDFBF7` and says "never pure
 * white/black". The shared `.claude/CLAUDE.md` records that Alicia RETIRED `#FDFBF7` in favour
 * of `#FFFFFF` on 2026-07-22 — one day later, and platform-wide.
 *
 * Following the newer decision. It is deliberately a single token: if the warm ground turns out
 * to read better under a full-bleed hero photo (which is the brief's actual argument, and a good
 * one for a photography-led surface), flipping this one line changes every screen.
 */
const BACKGROUND = '#FFFFFF';

export const palette = {
  /** The page. See the note above before changing. */
  background: BACKGROUND,
  /** Grouped/section surfaces that need to separate without a border. */
  surface: '#F7F4EF',
  /** Raised surfaces — sheets, cards over the hero. */
  surfaceRaised: '#FFFFFF',

  text: '#2D3436',
  textSecondary: '#5D6469',
  textTertiary: '#8A9099',
  /** Text on a dark photo treatment. */
  textInverse: '#FFFFFF',

  border: '#E8E4DF',
  /** Lighter than border — for rules between rows inside one group. */
  divider: '#EEEAE5',

  // Semantic. Fixed across every studio: a studio's brand colour must never mean "error".
  success: '#45B585',
  warning: '#D4A574',
  /** Destructive actions and late-cancel consequences. NEVER the accent. */
  danger: '#C0675A',
  info: '#7E92A3',

  /** The legibility scrim under text on a hero photo (see `heroScrim`). */
  scrim: 'rgba(20, 18, 16, 0.55)',
} as const;

/**
 * The photograph treatment on Home. **A flat veil, plus a soft foot — never a ramp that stops.**
 *
 * The previous version was a bottom-up gradient that reached full strength partway up the frame
 * and ended there. That draws a horizontal EDGE across the picture, and on a high-key photograph
 * (Everyday Ballet's dancer floats on near-white) the edge is the first thing you see — it read as
 * a grey smudge on device, 2026-08-06/07.
 *
 * What replaced it:
 *
 * - **`veil`** — one even fill over the ENTIRE frame. Even coverage has no edge anywhere, which is
 *   what lets white type sit at any height on any photograph, high-key or dark.
 * - **`footFrom` → `footMid` → `footTo`** — a soft deepening under the words only. It never
 *   reaches full strength before the bottom of the screen, so it has no terminating edge either.
 *
 * The old note said "where the photo is high-key, place text BELOW the image" — that advice is
 * retired along with the ramp. The flat veil handles both kinds of photograph, which is what let
 * Home become full-bleed rather than a band with a panel under it.
 */
export const heroScrim = {
  veil: 'rgba(22, 20, 19, 0.40)',
  footFrom: 'rgba(22, 20, 19, 0)',
  footMid: 'rgba(22, 20, 19, 0.38)',
  footTo: 'rgba(22, 20, 19, 0.62)',
  /** Hairlines over a photograph. The menu's rules and the divider above it. */
  hairline: 'rgba(255, 255, 255, 0.28)',
  hairlineSoft: 'rgba(255, 255, 255, 0.22)',
} as const;

/** 8px base. Values exist to be chosen deliberately — not everything is 16. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radii = {
  input: 4,
  button: 6,
  card: 8,
  /** Top corners of a bottom sheet. */
  sheet: 16,
  pill: 999,
} as const;

/**
 * Borders, not shadows.
 *
 * `subtle` exists for the rare case where depth genuinely carries meaning (a sheet lifting off
 * the page). Reach for a border first — a shadow is almost always the wrong answer here.
 */
export const elevation = {
  none: undefined,
  subtle: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
} as const;

/** The two families. Both OFL, both bundled — no network fetch, no FOUT. */
export const fontFamily = {
  /** Fraunces. Headlines, hero numerals, editorial moments. */
  display: 'Fraunces_400Regular',
  displayMedium: 'Fraunces_500Medium',
  /** DM Sans. Everything else. */
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
} as const;

export type TypeStyle = {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
};

/**
 * The type scale. The serif/sans interplay IS the brand — a screen with no Fraunces on it has
 * lost the identity, and a screen where everything is Fraunces has lost the hierarchy.
 *
 * Negative tracking on display sizes is what keeps Fraunces from looking loose at scale.
 */
export const typography = {
  /** Milestone takeovers, the flash-credit amount. One per screen, at most. */
  hero: {
    fontFamily: fontFamily.display,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -1.2,
  },
  /** Screen titles. */
  display: {
    fontFamily: fontFamily.display,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.7,
  },
  /** Section headings, studio name in the hero header. */
  title: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  /** A class time, a price, a pass count — the "numeral as a moment" role. */
  numeral: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  /** Card titles, list row headings. */
  heading: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 17,
    lineHeight: 22,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyMedium: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 16,
    lineHeight: 24,
  },
  /** Supporting detail under a heading. */
  secondary: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
  },
  /** Captions, metadata, "Powered by Dibs". */
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
  },
  /** Chips and eyebrow labels. Uppercase is applied by the component, not baked in here. */
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  button: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 16,
    lineHeight: 20,
  },
} as const satisfies Record<string, TypeStyle>;

export type TypographyKey = keyof typeof typography;

/**
 * Motion communicates causality — a sheet rises from the card that was tapped. It never
 * decorates. Anything above `slow` is a fidget.
 */
export const motion = {
  /** Pressed states. Fast enough to feel like the finger caused it. */
  instant: 150,
  /** The default: sheets, fades, list transitions. */
  base: 240,
  /** Celebratory beats only — the booking-success checkmark draw. */
  slow: 400,
} as const;

/** Minimum tap target. Front-desk iPads and thumbs on a phone both need this. */
export const MIN_TAP_TARGET = 44;

/** Lucide's default 2px stroke is too heavy for this template. */
export const ICON_STROKE_WIDTH = 1.5;

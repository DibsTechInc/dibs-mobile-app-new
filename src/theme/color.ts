/**
 * Colour maths for the studio-personality layer of the theme.
 *
 * PURE TypeScript — no React Native imports. It runs in three places: the running app
 * (ThemeProvider), the build-time white-label validator, and jest. Keep it that way.
 *
 * The problem this solves: a studio hands us one hex code and we have to build an entire
 * interactive palette from it that stays legible. Studio colours are chosen for signage and
 * Instagram, not for text contrast — of the three pilot studios, exactly ZERO have an accent
 * that carries white body text at WCAG AA. See `__tests__/color.test.ts`, which pins the real
 * measured numbers for all three.
 */

export const AA_NORMAL_TEXT = 4.5;
/** WCAG threshold for large text (≥18.66px bold / ≥24px) and for non-text UI components. */
export const AA_LARGE_TEXT = 3;

export interface Rgb {
  r: number;
  g: number;
  b: number;
}
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

export function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-fA-F]{6})$/.exec(hex.trim());
  if (!m) throw new Error(`Not a 6-digit hex colour: "${hex}"`);
  const int = parseInt(m[1], 16);
  return { r: (int >> 16) & 255, g: (int >> 8) & 255, b: int & 255 };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const part = (n: number) =>
    Math.round(clamp(n, 0, 255))
      .toString(16)
      .padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else h = ((rn - gn) / d + 4) / 6;
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (t: number): number => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  return {
    r: channel(h + 1 / 3) * 255,
    g: channel(h) * 255,
    b: channel(h - 1 / 3) * 255,
  };
}

/** WCAG 2.1 relative luminance. */
export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const lin = (v: number): number => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** WCAG 2.1 contrast ratio, 1..21. Order of arguments does not matter. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** Round to 2dp so tests and reports read cleanly. */
export const contrast = (a: string, b: string): number =>
  Math.round(contrastRatio(a, b) * 100) / 100;

function shiftLightness(hex: string, delta: number): string {
  const hsl = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb({ ...hsl, l: clamp(hsl.l + delta, 0, 1) }));
}

function mixWith(hex: string, other: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(other);
  const t = clamp(amount, 0, 1);
  return rgbToHex({
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  });
}

/**
 * Walk a colour's lightness until it reaches `target` contrast against `against`.
 *
 * `direction` is chosen by the caller because the two use cases pull opposite ways:
 * darkening a fill so white text sits on it, vs. darkening a colour so IT can be text on
 * a white page. Returns the original colour unchanged if it already passes.
 */
function adjustUntilContrast(
  hex: string,
  against: string,
  target: number,
  direction: 'darker' | 'lighter',
): { color: string; steps: number } {
  const step = direction === 'darker' ? -0.02 : 0.02;
  let current = hex;
  let steps = 0;
  // 50 steps × 2% covers the full lightness range; the loop terminates on the bound too.
  while (contrastRatio(current, against) < target && steps < 50) {
    const next = shiftLightness(current, step);
    if (next === current) break; // hit pure black/white — cannot improve further
    current = next;
    steps += 1;
  }
  return { color: current, steps };
}

export interface AccentScale {
  /** The studio's colour exactly as given. Decoration only — never guaranteed legible. */
  accent: string;
  /** Accent adjusted (if needed) so `onAccent` text on it passes AA. Use for filled buttons. */
  accentFill: string;
  /** Pressed state of `accentFill`. */
  accentPressed: string;
  /** Text/icon colour to place ON `accentFill`. */
  onAccent: string;
  /** Accent adjusted so it works as TEXT/small icons on the app background. */
  accentInk: string;
  /** Barely-there tint for section backgrounds. */
  accentWash: string;
  /** Mid tint for borders and dividers that should feel branded. */
  accentBorder: string;
  /** What the guard actually had to do — surfaced so a bad studio colour is visible, not silent. */
  meta: {
    rawContrastWithWhite: number;
    rawContrastWithInk: number;
    /** true when the raw accent could not carry AA text and `accentFill` had to move. */
    fillAdjusted: boolean;
    /** true when the raw accent was too light to be text on the background. */
    inkAdjusted: boolean;
    /** Contrast finally achieved between accentFill and onAccent. */
    fillContrast: number;
    /** Contrast finally achieved between accentInk and the background. */
    inkContrast: number;
  };
}

export interface AccentOptions {
  /** App background the accent must read against. */
  background?: string;
  /** The dark text colour of the template DNA. */
  ink?: string;
  /** Contrast target for text on the accent fill. */
  target?: number;
}

/**
 * Build the full accent scale from one studio hex.
 *
 * Guard behaviour (MOBILE_MASTER_PLAN §5.2):
 *  1. `onAccent` auto-switches between white and ink — whichever the raw accent carries better.
 *  2. If NEITHER passes AA, `accentFill` is walked away from `onAccent` until it does. The raw
 *     `accent` token is left untouched, so the studio's actual colour still appears in
 *     decoration and the brand is not quietly rewritten.
 *  3. `accentInk` is a separate walk: an accent light enough to need dark text on it is almost
 *     always too light to BE text on white, and those are different colours.
 *  4. The wash clamps saturation, so a neon accent does not produce a fluorescent panel.
 */
export function deriveAccentScale(accentHex: string, options: AccentOptions = {}): AccentScale {
  const background = options.background ?? '#FFFFFF';
  const ink = options.ink ?? '#2D3436';
  const target = options.target ?? AA_NORMAL_TEXT;
  const white = '#FFFFFF';

  const accent = rgbToHex(hexToRgb(accentHex));

  const rawContrastWithWhite = contrast(accent, white);
  const rawContrastWithInk = contrast(accent, ink);

  // 1. Which text colour does this accent naturally carry?
  const onAccent = rawContrastWithWhite >= rawContrastWithInk ? white : ink;
  const bestRaw = Math.max(rawContrastWithWhite, rawContrastWithInk);

  // 2. Walk the fill only if the better of the two still fails.
  let accentFill = accent;
  let fillAdjusted = false;
  if (bestRaw < target) {
    // White text wants a darker fill; ink text wants a lighter one.
    const direction = onAccent === white ? 'darker' : 'lighter';
    const walked = adjustUntilContrast(accent, onAccent, target, direction);
    accentFill = walked.color;
    fillAdjusted = walked.steps > 0;
  }

  // 3. Accent-as-text is its own problem.
  const inkWalk =
    contrastRatio(accent, background) < target
      ? adjustUntilContrast(
          accent,
          background,
          target,
          relativeLuminance(background) > 0.5 ? 'darker' : 'lighter',
        )
      : { color: accent, steps: 0 };

  // 4. Wash and border: tint toward the background, with saturation clamped so loud accents
  //    do not produce a glowing panel behind text.
  const accentHsl = rgbToHsl(hexToRgb(accent));
  const calmAccent = rgbToHex(hslToRgb({ ...accentHsl, s: Math.min(accentHsl.s, 0.55) }));

  const fillHsl = rgbToHsl(hexToRgb(accentFill));
  const accentPressed = rgbToHex(
    hslToRgb({
      ...fillHsl,
      // Dark fills get lighter on press, light fills get darker: the change must be visible
      // against whatever it started from.
      l: clamp(fillHsl.l + (fillHsl.l > 0.5 ? -0.08 : 0.08), 0, 1),
    }),
  );

  return {
    accent,
    accentFill,
    accentPressed,
    onAccent,
    accentInk: inkWalk.color,
    accentWash: mixWith(calmAccent, background, 0.92),
    accentBorder: mixWith(calmAccent, background, 0.65),
    meta: {
      rawContrastWithWhite,
      rawContrastWithInk,
      fillAdjusted,
      inkAdjusted: inkWalk.steps > 0,
      fillContrast: contrast(accentFill, onAccent),
      inkContrast: contrast(inkWalk.color, background),
    },
  };
}

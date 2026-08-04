import {
  AA_LARGE_TEXT,
  AA_NORMAL_TEXT,
  contrast,
  contrastRatio,
  deriveAccentScale,
  hexToRgb,
  hslToRgb,
  relativeLuminance,
  rgbToHex,
  rgbToHsl,
} from '../color';

describe('colour primitives', () => {
  it('round-trips hex → rgb → hex', () => {
    for (const hex of ['#000000', '#FFFFFF', '#1A92E4', '#356280', '#F986A5']) {
      expect(rgbToHex(hexToRgb(hex))).toBe(hex);
    }
  });

  it('round-trips rgb → hsl → rgb within a rounding step', () => {
    for (const hex of ['#1A92E4', '#356280', '#F986A5', '#7A8B6F']) {
      const rgb = hexToRgb(hex);
      const back = hslToRgb(rgbToHsl(rgb));
      expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(1);
      expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(1);
    }
  });

  it('accepts hex with or without the leading #', () => {
    expect(rgbToHex(hexToRgb('1a92e4'))).toBe('#1A92E4');
  });

  it('rejects anything that is not a 6-digit hex', () => {
    expect(() => hexToRgb('#fff')).toThrow();
    expect(() => hexToRgb('rebeccapurple')).toThrow();
  });

  it('matches known WCAG luminance and contrast values', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1, 5);
    // The canonical extreme: black on white is exactly 21:1.
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    // Contrast is symmetric.
    expect(contrast('#1A92E4', '#FFFFFF')).toBe(contrast('#FFFFFF', '#1A92E4'));
  });
});

/**
 * The three real pilot studios (MOBILE_MASTER_PLAN §11). These assertions are the
 * documentation: they pin what each studio's colour actually measures, so a future change to
 * the derivation cannot quietly regress a real app's legibility.
 */
describe('pilot studio accents', () => {
  const PILOTS = {
    'independent-training-spot': '#1A92E4',
    'carlsbad-village-yoga': '#356280',
    'everyday-ballet': '#F986A5',
  } as const;

  it('263 blue does NOT carry white body text at AA — the plan says it does', () => {
    // MOBILE_MASTER_PLAN §11 claims "#1A92E4 ... Passes AA with white text". It measures
    // 3.35:1 — enough for large text and UI components, short of the 4.5:1 body-text bar.
    // Whoever revisits that table should see this number first.
    const raw = contrast(PILOTS['independent-training-spot'], '#FFFFFF');
    expect(raw).toBeLessThan(AA_NORMAL_TEXT);
    expect(raw).toBeGreaterThanOrEqual(AA_LARGE_TEXT);
  });

  it('88 pink fails white text badly and must flip to dark ink', () => {
    const scale = deriveAccentScale(PILOTS['everyday-ballet']);
    expect(scale.meta.rawContrastWithWhite).toBeLessThan(AA_LARGE_TEXT);
    expect(scale.onAccent).not.toBe('#FFFFFF');
    // The flip alone is enough here — the pink itself never has to move.
    expect(scale.meta.fillAdjusted).toBe(false);
    expect(scale.accentFill).toBe('#F986A5');
  });

  it('210 slate carries white text as-is', () => {
    const scale = deriveAccentScale(PILOTS['carlsbad-village-yoga']);
    expect(scale.onAccent).toBe('#FFFFFF');
    expect(scale.meta.fillAdjusted).toBe(false);
  });

  it.each(Object.entries(PILOTS))(
    '%s: every derived pair clears AA after derivation',
    (_slug, hex) => {
      const scale = deriveAccentScale(hex);
      expect(scale.meta.fillContrast).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      expect(scale.meta.inkContrast).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    },
  );

  it.each(Object.entries(PILOTS))('%s: the raw studio colour is never rewritten', (_slug, hex) => {
    expect(deriveAccentScale(hex).accent).toBe(hex.toUpperCase());
  });
});

describe('accent derivation guards', () => {
  it('darkens the fill when neither white nor ink passes on the raw colour', () => {
    const scale = deriveAccentScale('#1A92E4');
    expect(scale.meta.fillAdjusted).toBe(true);
    expect(scale.accentFill).not.toBe('#1A92E4');
    expect(scale.meta.fillContrast).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it('survives the hostile cases: neon yellow, near-white, near-black, pure red', () => {
    for (const hostile of ['#FFFF00', '#FEFEFE', '#010101', '#FF0000', '#00FF00']) {
      const scale = deriveAccentScale(hostile);
      expect(scale.meta.fillContrast).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      expect(scale.meta.inkContrast).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      expect(scale.accentPressed).not.toBe(scale.accentFill);
    }
  });

  it('keeps the wash close to the background so text stays readable over it', () => {
    for (const hex of ['#FFFF00', '#1A92E4', '#F986A5']) {
      const scale = deriveAccentScale(hex);
      // Ink on the wash must still be comfortably readable.
      expect(contrast(scale.accentWash, '#2D3436')).toBeGreaterThan(AA_NORMAL_TEXT * 1.5);
    }
  });

  it('produces a pressed state that is visibly different in both light and dark fills', () => {
    for (const hex of ['#111111', '#EEEEEE', '#356280']) {
      const scale = deriveAccentScale(hex);
      expect(contrast(scale.accentFill, scale.accentPressed)).toBeGreaterThan(1.05);
    }
  });

  it('respects a caller-supplied dark background when deriving accent-as-text', () => {
    const onDark = deriveAccentScale('#356280', { background: '#111111' });
    expect(onDark.meta.inkContrast).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    // A dark slate on a dark page has to get lighter, not darker.
    expect(relativeLuminance(onDark.accentInk)).toBeGreaterThan(relativeLuminance('#356280'));
  });
});

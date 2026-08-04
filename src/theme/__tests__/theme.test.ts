import { createTheme } from '../theme';
import { palette, spacing, typography } from '../tokens';
import { AA_NORMAL_TEXT, contrast } from '../color';

/** The two studios shipping in v1, with their real accents. */
const V1_STUDIOS = {
  'carlsbad-village-yoga': '#356280',
  'everyday-ballet': '#F986A5',
} as const;

describe('createTheme', () => {
  it('merges the studio personality onto the template DNA', () => {
    const theme = createTheme({ accentColor: '#356280', appName: 'Carlsbad Village Yoga' });

    expect(theme.colors.background).toBe(palette.background);
    expect(theme.colors.accent).toBe('#356280');
    expect(theme.studio.appName).toBe('Carlsbad Village Yoga');
    expect(theme.spacing).toBe(spacing);
    expect(theme.typography).toBe(typography);
  });

  it('defaults showInstructor to true and lets a studio turn it off', () => {
    // 263-style studios have auto-assigned, meaningless instructor data. This must be a config
    // flag, never a `=== 263` conditional in app code.
    expect(createTheme({ accentColor: '#356280', appName: 'x' }).studio.showInstructor).toBe(true);
    expect(
      createTheme({ accentColor: '#1A92E4', appName: 'x', showInstructor: false }).studio
        .showInstructor,
    ).toBe(false);
  });

  it('surfaces what the accent guard had to do rather than hiding it', () => {
    const theme = createTheme({ accentColor: '#F986A5', appName: 'Everyday Ballet' });
    expect(theme.accentMeta.rawContrastWithWhite).toBeLessThan(AA_NORMAL_TEXT);
    expect(theme.accentMeta.fillContrast).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });
});

describe.each(Object.entries(V1_STUDIOS))('theme for %s', (_slug, accentColor) => {
  const theme = createTheme({ accentColor, appName: 'Studio' });

  it('renders button text on the accent fill at AA', () => {
    expect(contrast(theme.colors.accentFill, theme.colors.onAccent)).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });

  it('renders accent-coloured text on the page background at AA', () => {
    expect(contrast(theme.colors.accentInk, theme.colors.background)).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });

  it('keeps body text readable on every surface, including the accent wash', () => {
    for (const surface of [
      theme.colors.background,
      theme.colors.surface,
      theme.colors.surfaceRaised,
      theme.colors.accentWash,
    ]) {
      expect(contrast(surface, theme.colors.text)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    }
  });

  it('keeps SECONDARY text readable too — the size that usually fails', () => {
    // Secondary text is 14px, so it still needs the full 4.5:1; it does not qualify as large.
    for (const surface of [theme.colors.background, theme.colors.surface, theme.colors.accentWash]) {
      expect(contrast(surface, theme.colors.textSecondary)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    }
  });

  it('keeps the destructive colour distinguishable from the accent', () => {
    // A studio whose brand colour reads as "danger" would make every cancel dialog ambiguous.
    expect(contrast(theme.colors.danger, theme.colors.accentFill)).toBeGreaterThan(1.15);
  });
});

describe('template DNA invariants', () => {
  it('carries no Dibs marketing colours', () => {
    // This is the STUDIO's app. Terracotta #C4856A and Dibs Blue #1A92E4 must never be baked
    // into the template — 263's accent happening to equal Dibs Blue is their choice, not ours.
    const values = Object.values(palette).map((v) => v.toUpperCase());
    expect(values).not.toContain('#C4856A');
    expect(values).not.toContain('#1A92E4');
  });

  it('uses the serif for display roles and the sans for everything else', () => {
    // The serif/sans interplay IS the identity. Losing it makes the template generic.
    for (const role of ['hero', 'display', 'title', 'numeral'] as const) {
      expect(typography[role].fontFamily).toMatch(/^Fraunces/);
    }
    for (const role of ['body', 'secondary', 'caption', 'label', 'button', 'heading'] as const) {
      expect(typography[role].fontFamily).toMatch(/^DMSans/);
    }
  });

  it('keeps every type size on a legible line height', () => {
    for (const [role, style] of Object.entries(typography)) {
      expect(`${role}:${style.lineHeight > style.fontSize}`).toBe(`${role}:true`);
    }
  });

  it('tightens tracking as display sizes grow, and never on body text', () => {
    expect(typography.hero.letterSpacing).toBeLessThan(typography.display.letterSpacing!);
    expect(typography.display.letterSpacing).toBeLessThan(typography.title.letterSpacing!);
    expect('letterSpacing' in typography.body).toBe(false);
  });

  it('keeps the spacing scale on an 8px rhythm with two half-steps', () => {
    const values = Object.values(spacing);
    expect(values).toEqual([...values].sort((a, b) => a - b));
    // 4 and 12 are the deliberate half-steps for tight grouping; the rest are multiples of 8.
    for (const value of values) {
      expect(`${value}:${value % 8 === 0 || value === 4 || value === 12}`).toBe(`${value}:true`);
    }
  });
});

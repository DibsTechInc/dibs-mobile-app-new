/**
 * Home — a photograph and three choices. Approved 2026-08-07.
 * Reference mock: `design/mockups/rework.html`.
 *
 * ── What this screen is ─────────────────────────────────────────────────────────────────────
 * The studio's photograph, full bleed, with a greeting low on the left and three ways in. That is
 * the entire screen. It replaces a version that carried a greeting, a subtitle, a section label,
 * two bordered cards, a CTA and a four-tab bar — seven things, all competing with the picture they
 * sat on.
 *
 * Four rules hold it together. Break any and it stops being a photograph with an app on it, and
 * becomes an app with a photograph behind it:
 *
 * 1. **The photo is never cropped by a panel.** No hero band, no rising white sheet. The previous
 *    design showed the top 43% of a full-screen crop, which cut Everyday Ballet's dancer through
 *    the arm and face. Whatever the studio supplies is shown whole.
 * 2. **The wash is FLAT, not a ramp.** One even veil across the entire frame, plus a soft foot
 *    under the words. A gradient that reaches full strength and then stops draws a horizontal edge
 *    across the picture — on a high-key photograph that edge is the first thing you see, and it is
 *    what read as a grey smudge on device.
 * 3. **Roughly three quarters of the screen stays untouched photograph.** The greeting sits low and
 *    small. Content creeping up the frame is what made the last version feel cluttered.
 * 4. **The three choices are ONE menu**, joined by hairlines — not a tab bar. There is no "Home"
 *    among them because the photograph is home.
 *
 * Deliberately NOT here: today's classes, upcoming bookings, any CTA. Someone opening a booking
 * app knows what they came for; a schedule on the way in is a second schedule in front of the real
 * one (Alicia, 2026-08-07). "My Calendar" answers "when am I next in?" one tap away.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Image as RNImage, Pressable, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ApiError, describeApiError } from '@/api/errors';
import { ErrorState, Icon, Text, type IconName } from '@/components';
import { FadeRise, HeroSettle, useAppOpenEntrance } from '@/components/motion';
import { bundledHero, bundledLogo } from '@/config/studio-assets';
import { useTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';

/**
 * How long after mount the greeting and menu arrive.
 *
 * The photograph needs no entrance — it is already on screen, because the native splash shows the
 * same file at the same crop. So the app "opening" is the words appearing on a picture that was
 * always there, which is a quieter and more convincing arrival than anything that moves.
 */
const CHROME_DELAY = 260;

export interface HomeChoice {
  label: string;
  icon: IconName;
  onPress: () => void;
}

export interface HomeScreenProps {
  /** "Hi Alicia!" signed in; the studio's name for a guest. */
  greeting: string;
  /** "Welcome to Everyday Ballet" signed in; the date, or nothing, for a guest. */
  subtitle?: string | null;
  /** Exactly three. More would stop being a menu and start being a tab bar. */
  choices: [HomeChoice, HomeChoice, HomeChoice];
  onOpenMenu: () => void;
  onOpenCart?: () => void;
  /** Live hero from `get-basic-config`, used only when the build opts out of the bundled one. */
  remoteHeroUri?: string | null;
  /** Set when even the studio's config failed — the one case this screen cannot render. */
  error?: unknown;
  onRetry?: () => void;
}

function Choice({
  choice,
  divided,
  width,
}: {
  choice: HomeChoice;
  /** Hairline on the leading edge. Never on the first, or it reads as a stray rule. */
  divided: boolean;
  /**
   * An EXPLICIT width, not `flex: 1`.
   *
   * Three rounds of flex tuning — minWidth 0, width 100%, a plain View instead of the animated
   * one — all still produced a row about 495pt wide on a 393pt screen, with the third choice off
   * the right edge. Whatever is refusing to shrink these cells, a measured third of the window
   * cannot be argued with. Verified in the web preview.
   */
  width: number;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={choice.label}
      onPress={choice.onPress}
      style={({ pressed }) => [{
        width,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.spacing.sm,
        paddingVertical: theme.spacing.sm,
        minHeight: theme.minTapTarget,
        borderLeftWidth: divided ? 1 : 0,
        borderLeftColor: theme.heroScrim.hairlineSoft,
        opacity: pressed ? 0.55 : 1,
      }]}
    >
      <Icon name={choice.icon} size={21} color={theme.colors.textInverse} />
      {/* One line, always. "MY CALENDAR" is the longest label and it must not wrap a third of
          the way across the screen. */}
      <Text
        variant="label"
        color="inverse"
        uppercase
        numberOfLines={1}
        style={{ fontSize: 10.5, letterSpacing: 0.6 }}
      >
        {choice.label}
      </Text>
    </Pressable>
  );
}

/**
 * The studio's mark on a soft near-white plate, sized from the asset's own aspect ratio.
 *
 * The plate exists because logos are arbitrary artwork on top of a veiled photograph — see the
 * comment at the render site. Height is fixed; width follows the mark (clamped to 60% of the
 * screen so an extreme wordmark cannot crowd the greeting).
 */
function LogoPlate({ windowWidth }: { windowWidth: number }) {
  const theme = useTheme();
  const resolved = RNImage.resolveAssetSource(bundledLogo);
  const height = 34;
  const ratio = resolved?.width && resolved?.height ? resolved.width / resolved.height : 1;
  const width = Math.min(height * ratio, windowWidth * 0.6);

  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        borderRadius: theme.radii.card,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.base,
      }}
    >
      {/* Decorative: the greeting block right under it already names the studio for a reader. */}
      <Image source={bundledLogo} style={{ width, height }} contentFit="contain" accessible={false} />
    </View>
  );
}

export function HomeScreen({
  greeting,
  subtitle,
  choices,
  onOpenMenu,
  onOpenCart,
  remoteHeroUri,
  error,
  onRetry,
}: HomeScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  /**
   * The bundled file wins over the live URL.
   *
   * It is the same image the native splash shows, so it is already drawn when Home's first frame
   * lands and the handoff between them is invisible. A remote URL has to be requested, so a studio
   * on `heroSource: 'remote'` accepts a visible cut in exchange for changing their photo without a
   * release. See `src/config/studio-assets.ts`.
   */
  const heroSource = bundledHero ?? remoteHeroUri ?? null;
  const hasPhoto = heroSource !== null;

  /**
   * Runs once per LAUNCH, not per mount. Home rebuilds every time you come back to it, and an
   * entrance that replays reads as lag rather than arrival.
   */
  const playEntrance = useAppOpenEntrance();

  // No photograph is the only state this screen cannot carry: the white type, the veil and the
  // hairline menu all exist to sit on an image. Without one there is nothing to sit on.
  if (!hasPhoto) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          paddingTop: insets.top,
        }}
      >
        <ErrorState
          message={describeApiError(error)}
          retriable={!(error instanceof ApiError) || error.retriable}
          onRetry={onRetry}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.text }}>
      {/*
        THE PHOTOGRAPH — the whole screen, and nothing resizes it.

        Edges written out individually. `inset: 0` is a CSS shorthand React Native does NOT
        support: it is silently ignored, so this absolutely-positioned layer had no bounds at all,
        sized itself to the photograph, and stretched the root to ~495pt on a 393pt screen — which
        is what pushed the third menu choice off the right edge. Four rounds of flex tuning could
        not fix it because flex was never the problem. Never use `inset` in this codebase.
      */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} pointerEvents="none">
        <HeroSettle animate={playEntrance} style={{ flex: 1 }}>
          <Image
            source={heroSource}
            style={{ flex: 1 }}
            // Must match the splash's `resizeMode: 'cover'` in app.config.ts, or the photograph
            // jumps at the handoff.
            contentFit="cover"
            contentPosition="center"
            // No fade for the bundled file: it is already decoded and already on screen from the
            // splash, so transitioning it in would fade the photo against itself.
            transition={bundledHero ? 0 : motion.slow}
            accessible={false}
          />
        </HeroSettle>

        {/* The veil is a flat fill, NOT a gradient. See rule 2 in the header. It sits outside
            HeroSettle so it never scales with the photograph — a wash that scales makes its own
            edge crawl across the frame. */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: theme.heroScrim.veil }} />
        <LinearGradient
          colors={[theme.heroScrim.footFrom, theme.heroScrim.footMid, theme.heroScrim.footTo]}
          locations={[0, 0.6, 1]}
          style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '46%' }}
        />
      </View>

      {/* Top chrome: the drawer, and the cart when there is one. */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: insets.top + theme.spacing.sm,
          paddingHorizontal: theme.spacing.base,
        }}
      >
        <FadeRise animate={playEntrance} delay={CHROME_DELAY} distance={0}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            onPress={onOpenMenu}
            hitSlop={12}
            style={({ pressed }) => [{ padding: theme.spacing.sm, opacity: pressed ? 0.55 : 1 }]}
          >
            <Icon name="menu" color={theme.colors.textInverse} />
          </Pressable>
        </FadeRise>

        {onOpenCart ? (
          <FadeRise animate={playEntrance} delay={CHROME_DELAY} distance={0}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cart"
              onPress={onOpenCart}
              hitSlop={12}
              style={({ pressed }) => [{ padding: theme.spacing.sm, opacity: pressed ? 0.55 : 1 }]}
            >
              <Icon name="cart" color={theme.colors.textInverse} />
            </Pressable>
          </FadeRise>
        ) : null}
      </View>

      {/* `marginTop: auto` is what keeps the greeting low and the photograph clear above it. */}
      <FadeRise
        animate={playEntrance}
        delay={CHROME_DELAY}
        distance={0}
        style={{
          marginTop: 'auto',
          paddingHorizontal: theme.spacing.lg,
          paddingBottom: theme.spacing.lg,
        }}
      >
        {/*
          The studio's own mark, above the greeting — the opening screen used to carry the brand
          only as a caption line, which read as a template with a name filled in (Alicia,
          2026-08-16: "it just looks a bit mid"). It sits on a soft near-white plate because
          studio logos are arbitrary artwork, and both live studios' marks are dark ink that
          would vanish into the veiled photograph; the plate is the one treatment that survives
          any logo a studio hands us. Sized from the asset's own aspect ratio so a square badge
          (Carlsbad) and a 6:1 wordmark (Everyday Ballet) each get a plate that fits the mark,
          never a letterboxed strip.
        */}
        <LogoPlate windowWidth={windowWidth} />
        <Text variant="display" color="inverse">
          {greeting}
        </Text>
        {subtitle ? (
          <Text variant="secondary" color="inverse" style={{ opacity: 0.88, marginTop: theme.spacing.xs }}>
            {subtitle}
          </Text>
        ) : null}
      </FadeRise>

      {/*
        THE MENU — hairline-joined, so it reads as one object rather than three buttons.

        The row is a PLAIN View inside FadeRise, not FadeRise itself. Layout must not depend on an
        animated wrapper: when it did, the row sized itself to its content (~492pt on a 393pt
        screen) and `flex: 1` divided that wrong total, pushing the third choice off the right
        edge. FadeRise now only fades; the View owns the geometry.
      */}
      <FadeRise animate={playEntrance} delay={CHROME_DELAY} distance={0}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'stretch',
            borderTopWidth: 1,
            borderTopColor: theme.heroScrim.hairline,
            paddingTop: theme.spacing.md,
            paddingBottom: insets.bottom + theme.spacing.md,
          }}
        >
          {choices.map((choice, index) => (
            <Choice
              key={choice.label}
              choice={choice}
              divided={index > 0}
              width={windowWidth / choices.length}
            />
          ))}
        </View>
      </FadeRise>
    </View>
  );
}

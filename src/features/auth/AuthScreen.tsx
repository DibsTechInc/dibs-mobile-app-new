/**
 * Auth — sign in, create account, reset. One screen, three modes.
 *
 * Reference mock: `design/mockups/auth.html`.
 *
 * Three modes rather than three routes because they are the same composition with a different
 * field set: navigating between near-identical screens produces a flash and loses whatever was
 * already typed, and keeping them together is what lets "forgot your password" carry the email
 * across instead of asking for it twice.
 *
 * Presentational. Every action is a prop, so the whole thing can be rendered in isolation and
 * none of Firebase reaches into the layout.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input, SkeletonList, Text } from '@/components';
import { bundledHero } from '@/config/studio-assets';
import { FadeRise, HeroSettle } from '@/components/motion';
import { emailProblem, passwordProblem } from '@/domain/auth/describe-auth-error';
import { useTheme } from '@/theme/ThemeProvider';
import { motion } from '@/theme/tokens';

/** Shorter than Home's 360. Here the photo is a threshold, not the thing you came to look at. */
const HERO_HEIGHT = 300;

export type AuthMode = 'signIn' | 'signUp' | 'reset';

export interface AuthScreenProps {
  studioName: string;
  heroUri: string | null;
  /** The studio's own support address — to this client, the studio IS the company. */
  supportEmail: string | null;
  busy?: boolean;
  onSignIn: (email: string, password: string) => void;
  onSignUp: (values: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) => void;
  onResetPassword: (email: string) => void;
  /** Server-side failure, already turned into client-safe copy. */
  error?: string | null;
  onDismissError?: () => void;
  /** Rendered in place of the form once a live session exists. */
  session?: SessionPanelProps | null;
  /**
   * A live session exists but its Dibs identity has not landed yet.
   *
   * This window gets its own state rather than falling through to the form. Rendering a sign-in
   * form to somebody who is already signed in is the widget's July 2026 bug: it invites a tap
   * that signs the fresh session straight back out.
   */
  resolvingSession?: boolean;
  /**
   * Firebase has not yet said whether anyone is signed in.
   *
   * Also renders a placeholder rather than the form: a returning client who is already signed in
   * would otherwise see a sign-in form flash on top of their own session. Distinct from
   * `resolvingSession` because there we KNOW there is a session and the heading can say so.
   */
  initializing?: boolean;
}

export interface SessionPanelProps {
  displayName: string | null;
  email: string;
  /** True when the login is valid but no Dibs record backs it — a real state, not a loading one. */
  accountMissing: boolean;
  onSignOut: () => void;
  /**
   * Creates the missing Dibs record for the session's existing email.
   *
   * NOT "sign up again": the Firebase credential already exists, so sending this client back to
   * the sign-up form would fail with `auth/email-already-in-use` — a loop with no exit. What is
   * missing is the Dibs row, so that is what this makes.
   */
  onCompleteSetup: (firstName: string, lastName: string) => void;
  completeError?: string | null;
}

/** The heading over the photo. */
function headingFor(
  mode: AuthMode,
  session: SessionPanelProps | null | undefined,
  resolvingSession: boolean,
): string {
  if (session) return session.accountMissing ? 'Almost\nthere' : (session.displayName ?? 'Signed in');
  // Firebase has already confirmed a session here; only the name is still missing. "Signed in"
  // is true now and stays true when the name replaces it.
  if (resolvingSession) return 'Signed in';
  if (mode === 'signUp') return 'Create your\naccount';
  if (mode === 'reset') return 'Reset your\npassword';
  return 'Sign in';
}

export function AuthScreen({
  studioName,
  heroUri,
  supportEmail,
  busy = false,
  onSignIn,
  onSignUp,
  onResetPassword,
  error,
  onDismissError,
  session,
  resolvingSession = false,
  initializing = false,
}: AuthScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<AuthMode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [resetSent, setResetSent] = useState(false);
  // Validation appears on submit, never while typing: telling someone their email is invalid
  // after they have typed two characters of it is nagging, not helping.
  const [touched, setTouched] = useState(false);

  // Same rule as Home: the bundled file wins, so auth opens on the studio's photograph with no
  // network round trip. See `src/config/studio-assets.ts`.
  const heroSource = bundledHero ?? heroUri ?? null;
  const hasPhoto = heroSource !== null;

  const emailError = touched ? emailProblem(email) : null;
  const passwordError = touched && mode !== 'reset' ? passwordProblem(password) : null;
  const nameError =
    touched && mode === 'signUp' && !firstName.trim() ? 'Please enter your first name.' : null;

  /** Switching mode clears what the previous mode complained about, but keeps the email. */
  function goTo(next: AuthMode) {
    setMode(next);
    setTouched(false);
    setResetSent(false);
    onDismissError?.();
  }

  function submit() {
    setTouched(true);
    onDismissError?.();

    if (emailProblem(email)) return;
    if (mode === 'reset') {
      setResetSent(true);
      onResetPassword(email);
      return;
    }
    if (passwordProblem(password)) return;
    if (mode === 'signIn') {
      onSignIn(email, password);
      return;
    }
    if (!firstName.trim()) return;
    onSignUp({ email, password, firstName, lastName, phone });
  }

  const showSentConfirmation = mode === 'reset' && resetSent && !error;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          height: HERO_HEIGHT,
          overflow: 'hidden',
          justifyContent: 'flex-end',
          backgroundColor: theme.colors.surface,
        }}
      >
        {/* No photograph means no photograph treatment — the scrim and the inverse type exist to
            hold white text on an image, and over the empty wash they make a grey smear with
            invisible text on it. Same rule as Home. */}
        {hasPhoto ? (
          <>
            <HeroSettle
              style={{ position: 'absolute', top: 0, left: 0, right: 0, height: HERO_HEIGHT }}
            >
              <Image
                source={heroSource}
                style={{ flex: 1, backgroundColor: theme.colors.surface }}
                contentFit="cover"
                contentPosition="center"
                transition={bundledHero ? 0 : motion.slow}
                accessible={false}
              />
            </HeroSettle>
            <LinearGradient
              colors={[theme.heroScrim.from, theme.heroScrim.to]}
              style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: HERO_HEIGHT * 0.7 }}
              pointerEvents="none"
            />
          </>
        ) : null}

        <FadeRise
          index={0}
          style={{ paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg + 2 }}
        >
          <Text
            variant="label"
            color={hasPhoto ? 'inverse' : 'tertiary'}
            uppercase
            style={{ opacity: hasPhoto ? 0.85 : 1, marginBottom: theme.spacing.xs + 2 }}
          >
            {studioName}
          </Text>
          <Text variant="display" color={hasPhoto ? 'inverse' : 'primary'}>
            {showSentConfirmation
              ? 'Check your\nemail'
              : headingFor(mode, session, resolvingSession)}
          </Text>
        </FadeRise>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg + 4,
          paddingBottom: insets.bottom + theme.spacing.xxl,
        }}
      >
        {session ? (
          <SessionPanel
            {...session}
            busy={busy}
            supportEmail={supportEmail}
            studioName={studioName}
          />
        ) : resolvingSession || initializing ? (
          // Never the form while the answer is unknown. See the notes on those two props.
          <SkeletonList count={2} />
        ) : showSentConfirmation ? (
          <ResetSentPanel email={email} onBack={() => goTo('signIn')} />
        ) : (
          <FadeRise index={1}>
            {mode === 'reset' ? (
              <Text variant="secondary" color="secondary" style={{ marginBottom: theme.spacing.lg }}>
                We’ll email you a link to choose a new one.
              </Text>
            ) : null}

            <View style={{ gap: theme.spacing.base }}>
              {mode === 'signUp' ? (
                <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="First name"
                      value={firstName}
                      onChangeText={setFirstName}
                      autoCapitalize="words"
                      autoComplete="given-name"
                      textContentType="givenName"
                      error={nameError}
                      returnKeyType="next"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Input
                      label="Last name"
                      value={lastName}
                      onChangeText={setLastName}
                      autoCapitalize="words"
                      autoComplete="family-name"
                      textContentType="familyName"
                      returnKeyType="next"
                    />
                  </View>
                </View>
              ) : null}

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
                error={emailError}
                returnKeyType="next"
              />

              {mode !== 'reset' ? (
                <Input
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                  textContentType={mode === 'signUp' ? 'newPassword' : 'password'}
                  error={passwordError}
                  hint={mode === 'signUp' ? 'At least 8 characters.' : undefined}
                  returnKeyType="go"
                  onSubmitEditing={submit}
                />
              ) : null}

              {mode === 'signUp' ? (
                <Input
                  label="Phone — optional"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                  placeholder="For class reminders"
                />
              ) : null}
            </View>

            {/* Sits directly under the password it relates to, because that is where somebody is
                standing when they realise they have forgotten it. */}
            {mode === 'signIn' ? (
              <Text
                variant="caption"
                color="accent"
                onPress={() => goTo('reset')}
                style={{ marginTop: theme.spacing.sm + 2 }}
              >
                Forgot your password?
              </Text>
            ) : null}

            {error ? (
              <Text variant="secondary" color="danger" style={{ marginTop: theme.spacing.base }}>
                {error}
              </Text>
            ) : null}

            <View style={{ marginTop: theme.spacing.lg + 4 }}>
              <Button
                label={
                  mode === 'signIn'
                    ? 'Sign in'
                    : mode === 'signUp'
                      ? 'Create account'
                      : 'Email me a link'
                }
                loading={busy}
                onPress={submit}
              />
            </View>

            <View style={{ marginTop: theme.spacing.lg + 2, alignItems: 'center' }}>
              {mode === 'signIn' ? (
                <Text variant="secondary" color="secondary">
                  New to {studioName}?{' '}
                  <Text variant="secondary" color="accent" onPress={() => goTo('signUp')}>
                    Create an account
                  </Text>
                </Text>
              ) : (
                <Text variant="secondary" color="accent" onPress={() => goTo('signIn')}>
                  {mode === 'signUp' ? 'Already have an account? Sign in' : 'Back to sign in'}
                </Text>
              )}
            </View>
          </FadeRise>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ResetSentPanel({ email, onBack }: { email: string; onBack: () => void }) {
  const theme = useTheme();
  return (
    <FadeRise index={1}>
      {/* "If there's an account" is deliberate: confirming only for real addresses would leak
          the same client list the sign-in error is careful not to. */}
      <Text variant="body" color="secondary" style={{ marginBottom: theme.spacing.sm }}>
        If there’s an account for {email.trim()}, a reset link is on its way.
      </Text>
      <Text variant="secondary" color="tertiary" style={{ marginBottom: theme.spacing.lg + 4 }}>
        It can take a minute or two. Check your spam folder if it doesn’t arrive.
      </Text>
      <Button label="Back to sign in" variant="secondary" onPress={onBack} />
    </FadeRise>
  );
}

/** `displayName` is deliberately unused here — it is the heading over the photo, not body copy. */
function SessionPanel({
  email,
  accountMissing,
  onSignOut,
  onCompleteSetup,
  completeError,
  busy,
  supportEmail,
  studioName,
}: SessionPanelProps & { busy: boolean; supportEmail: string | null; studioName: string }) {
  const theme = useTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [touched, setTouched] = useState(false);

  if (accountMissing) {
    return (
      <FadeRise index={1}>
        <Text variant="body" style={{ marginBottom: theme.spacing.sm }}>
          Your sign-in worked, but we can’t find a {studioName} account for {email}.
        </Text>
        <Text variant="secondary" color="tertiary" style={{ marginBottom: theme.spacing.lg }}>
          Tell us your name and we’ll finish setting it up. Your password stays as it is.
        </Text>

        <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
          <View style={{ flex: 1 }}>
            <Input
              label="First name"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoComplete="given-name"
              textContentType="givenName"
              error={touched && !firstName.trim() ? 'Please enter your first name.' : null}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="Last name"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
              autoComplete="family-name"
              textContentType="familyName"
            />
          </View>
        </View>

        {completeError ? (
          <Text variant="secondary" color="danger" style={{ marginTop: theme.spacing.base }}>
            {completeError}
          </Text>
        ) : null}

        {/* Both exits, because every authenticated call rejects this client — leaving them
            "signed in" would be a state they can enter and not leave. */}
        <View style={{ gap: theme.spacing.md, marginTop: theme.spacing.lg }}>
          <Button
            label="Finish setting up"
            loading={busy}
            onPress={() => {
              setTouched(true);
              if (firstName.trim()) onCompleteSetup(firstName, lastName);
            }}
          />
          <Button label="Sign out" variant="secondary" onPress={onSignOut} />
        </View>
        {supportEmail ? (
          <Text
            variant="caption"
            color="tertiary"
            align="center"
            style={{ marginTop: theme.spacing.lg }}
          >
            Still stuck? {supportEmail}
          </Text>
        ) : null}
      </FadeRise>
    );
  }

  return (
    <FadeRise index={1}>
      <Text variant="label" color="tertiary" uppercase style={{ marginBottom: theme.spacing.xs + 2 }}>
        Signed in as
      </Text>
      <Text variant="body" style={{ marginBottom: theme.spacing.xs + 2 }}>
        {email}
      </Text>
      <Text variant="secondary" color="tertiary" style={{ marginBottom: theme.spacing.xl }}>
        Your bookings, passes and saved cards follow this account at every Dibs studio.
      </Text>
      <Button label="Sign out" variant="secondary" onPress={onSignOut} />
    </FadeRise>
  );
}

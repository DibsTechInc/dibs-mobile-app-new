/**
 * Profile — name and phone number.
 *
 * ── The email is shown, not edited, and that is a deliberate refusal ─────────────────────────
 * Firebase owns the address a client signs in with; `update-profile` writes a different column in
 * a different system and does not touch it. `get-user-account` then matches the two with a
 * case-sensitive comparison. So editing the email here would let a client change their address,
 * sign in with the old one, and be told they have no account — a lockout with no way back that
 * only a studio admin could undo. Changing an email is a real need; it needs a flow that moves
 * BOTH systems, and until that exists the honest answer is a line of copy pointing at the studio.
 *
 * Presentational: the draft lives in the route, every action is a prop.
 */
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input, Text } from '@/components';
import type { ProfileDraft, ProfileErrors } from '@/domain/profile/validate';
import { useTheme } from '@/theme/ThemeProvider';

export interface ProfileScreenProps {
  draft: ProfileDraft;
  errors: ProfileErrors;
  email: string | null;
  studioName: string;
  /** False when nothing has changed — saving an unchanged profile is a write nobody asked for. */
  canSave: boolean;
  isSaving: boolean;
  /** A server refusal, in the server's own words. Most often a phone number already in use. */
  saveError: string | null;
  justSaved: boolean;
  onChange: (field: keyof ProfileDraft, value: string) => void;
  onSave: () => void;
  onBack: () => void;
}

export function ProfileScreen({
  draft,
  errors,
  email,
  studioName,
  canSave,
  isSaving,
  saveError,
  justSaved,
  onChange,
  onSave,
  onBack,
}: ProfileScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.colors.background, paddingTop: insets.top }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm }}>
        <Text
          variant="caption"
          color="accent"
          onPress={onBack}
          accessibilityRole="button"
          style={{ paddingVertical: theme.spacing.md }}
        >
          ← Account
        </Text>
        <Text variant="display">Profile</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.lg,
          paddingTop: theme.spacing.lg,
          paddingBottom: insets.bottom + theme.spacing.xxl,
          gap: theme.spacing.lg,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ gap: theme.spacing.base }}>
          <Input
            label="First name"
            value={draft.firstName}
            error={errors.firstName}
            onChangeText={(value) => onChange('firstName', value)}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            returnKeyType="next"
          />
          <Input
            label="Last name"
            value={draft.lastName}
            error={errors.lastName}
            onChangeText={(value) => onChange('lastName', value)}
            autoCapitalize="words"
            autoComplete="family-name"
            textContentType="familyName"
            returnKeyType="next"
          />
          <Input
            label="Mobile number"
            value={draft.phone}
            error={errors.phone}
            hint={`How ${studioName} reaches you about a class change.`}
            onChangeText={(value) => onChange('phone', value)}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            returnKeyType="done"
          />
        </View>

        {/* The email, stated as a fact with a way forward — not a disabled field. A greyed-out
            input invites a tap and then refuses it, which reads as broken rather than deliberate. */}
        {email ? (
          <View style={{ gap: theme.spacing.xs }}>
            <Text variant="label" color="secondary" uppercase>
              Email
            </Text>
            <Text variant="body">{email}</Text>
            <Text variant="caption" color="tertiary">
              This is the address you sign in with. Contact {studioName} to change it.
            </Text>
          </View>
        ) : null}

        {saveError ? (
          <Text variant="secondary" color="danger">
            {saveError}
          </Text>
        ) : null}

        <View style={{ gap: theme.spacing.sm }}>
          <Button
            label={justSaved ? 'Saved' : 'Save changes'}
            onPress={onSave}
            loading={isSaving}
            // Disabled when there is nothing to save, so the button state answers "did that
            // work?" before the client has to guess.
            disabled={!canSave || justSaved}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

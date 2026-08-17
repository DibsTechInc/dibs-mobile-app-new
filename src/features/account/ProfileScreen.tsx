/**
 * Profile — name, phone number, birthday, and the password.
 *
 * ── The email is shown, not edited, and that is a deliberate refusal ─────────────────────────
 * Firebase owns the address a client signs in with; `update-profile` writes a different column in
 * a different system and does not touch it. `get-user-account` then matches the two with a
 * case-sensitive comparison. So editing the email here would let a client change their address,
 * sign in with the old one, and be told they have no account — a lockout with no way back that
 * only a studio admin could undo.
 *
 * Alicia asked for email editing on 2026-08-14, and it is a fair ask — but it is not a form field,
 * it is a backend flow that has to move Firebase and the Dibs row together and roll back if either
 * half fails. Shipping the input without that flow would ship the lockout. Until it exists this
 * says where to go, which is the honest answer rather than the convenient one.
 *
 * ── The password IS changeable here, because that one is safe ────────────────────────────────
 * Firebase owns it outright, so there is no second system to desynchronize — only a mirror flag to
 * keep honest, which `useChangePassword` does. It sits below the profile form under its own
 * heading rather than inside it: a password change is its own transaction with its own confirm,
 * and folding it into "Save changes" would mean one button doing two unrelated things.
 *
 * Presentational: the draft lives in the route, every action is a prop.
 */
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Input, Text } from '@/components';
import type { ProfileDraft, ProfileErrors } from '@/domain/profile/validate';
import type { ChangePasswordStatus } from '@/features/account/useChangePassword';
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
  /** Where the password change has got to. Its own state machine — see `useChangePassword`. */
  passwordStatus: ChangePasswordStatus;
  onChangePassword: (args: { currentPassword: string; newPassword: string }) => void;
  /** Clears a stale refusal the moment the client starts correcting it. */
  onResetPassword: () => void;
}

/**
 * Changing the password, behind a disclosure.
 *
 * Collapsed by default because it is rare and because two password fields sitting open above a
 * "Save changes" button invite somebody to fill them in and press the wrong one. Opening it is an
 * explicit "I am doing this now", and it has its own labelled button.
 */
function PasswordSection({
  status,
  onSubmit,
  onReset,
}: {
  status: ChangePasswordStatus;
  onSubmit: (args: { currentPassword: string; newPassword: string }) => void;
  onReset: () => void;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');

  const working = status.kind === 'working';
  const done = status.kind === 'done';
  const error = status.kind === 'error' ? status : null;

  // The fields are cleared on success, so a shoulder-surfer does not get a free look at a
  // password sitting in a form nobody closed.
  const finish = () => {
    setCurrent('');
    setNext('');
    setOpen(false);
  };

  if (done && open) {
    // Deliberately not auto-closed on a timer: the confirmation is the receipt, and a panel that
    // vanishes on its own leaves somebody unsure whether it took.
    return (
      <View style={{ gap: theme.spacing.md }}>
        <Text variant="heading">Password updated</Text>
        <Text variant="secondary" color="secondary">
          Use your new password next time you sign in — here and on the website.
        </Text>
        <View style={{ alignSelf: 'flex-start' }}>
          <Button
            label="Done"
            variant="secondary"
            size="compact"
            fullWidth={false}
            onPress={() => {
              onReset();
              finish();
            }}
          />
        </View>
      </View>
    );
  }

  if (!open) {
    return (
      <View style={{ gap: theme.spacing.sm, alignItems: 'flex-start' }}>
        <Text variant="heading">Password</Text>
        <Text variant="secondary" color="secondary">
          The same password you use on the website.
        </Text>
        <View style={{ marginTop: theme.spacing.xs }}>
          <Button
            label="Change password"
            variant="secondary"
            size="compact"
            fullWidth={false}
            onPress={() => {
              onReset();
              setOpen(true);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: theme.spacing.base }}>
      <Text variant="heading">Change password</Text>

      <Input
        label="Current password"
        value={current}
        error={error?.field === 'current' ? error.message : undefined}
        onChangeText={(value) => {
          onReset();
          setCurrent(value);
        }}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="next"
      />
      <Input
        label="New password"
        value={next}
        error={error?.field === 'next' ? error.message : undefined}
        hint="At least 8 characters."
        onChangeText={(value) => {
          onReset();
          setNext(value);
        }}
        secureTextEntry
        autoCapitalize="none"
        // `newPassword` rather than `password`, so the keychain offers to generate and save one
        // instead of autofilling the old one into the field meant to replace it.
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="done"
      />

      {/* A failure with no field to sit under — a stale session, a network drop. */}
      {error && error.field === null ? (
        <Text variant="secondary" color="danger">
          {error.message}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
        <View style={{ flex: 1 }}>
          <Button
            label="Update password"
            loading={working}
            disabled={working}
            onPress={() => onSubmit({ currentPassword: current, newPassword: next })}
          />
        </View>
        <Button
          label="Cancel"
          variant="secondary"
          fullWidth={false}
          disabled={working}
          onPress={() => {
            onReset();
            finish();
          }}
        />
      </View>
    </View>
  );
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
  passwordStatus,
  onChangePassword,
  onResetPassword,
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
            returnKeyType="next"
          />
          {/* Month and day only — the platform's `MM/DD` format, matching the widget's own field.
              No year, deliberately: studios use this for birthday perks, and asking somebody's age
              to send them a free class is a worse trade than they signed up for. */}
          <Input
            label="Birthday"
            value={draft.birthday}
            error={errors.birthday}
            placeholder="MM/DD"
            hint={`Optional — some studios mark it. ${studioName} never sees your age.`}
            onChangeText={(value) => onChange('birthday', value)}
            keyboardType="numbers-and-punctuation"
            autoComplete="off"
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

        {/* Below the save, behind a rule. The password is a separate transaction with its own
            confirm — see the note at the top of this file. */}
        <View
          style={{
            paddingTop: theme.spacing.lg,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
          }}
        >
          <PasswordSection
            status={passwordStatus}
            onSubmit={onChangePassword}
            onReset={onResetPassword}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

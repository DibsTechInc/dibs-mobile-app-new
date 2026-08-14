/**
 * The profile route. Owns the draft and the save.
 *
 * On success it invalidates the account query rather than writing the new values into a store:
 * the server is the record, and re-reading it is what guarantees the name on this screen is the
 * name on the studio's roster (invariant 8 — Zustand never mirrors server data).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiClient, describeApiError, queryKeys, updateProfile } from '@/api';
import { studio } from '@/config/studio';
import {
  formatPhoneForDisplay,
  hasProfileErrors,
  isProfileDirty,
  normalizeBirthday,
  normalizePhone,
  validateProfile,
  type ProfileDraft,
} from '@/domain/profile/validate';
import { ProfileScreen } from '@/features/account/ProfileScreen';
import { useChangePassword } from '@/features/account/useChangePassword';
import { useAuth } from '@/features/auth/AuthProvider';
import { useStudioConfig } from '@/features/studio/StudioConfigProvider';

/** How long "Saved" stays on the button before it goes back to being a button. */
const SAVED_CONFIRMATION_MS = 2500;

export default function ProfileRoute() {
  const { status, account, session } = useAuth();
  const { config } = useStudioConfig();
  const queryClient = useQueryClient();
  // Its own state machine, deliberately separate from the profile mutation: Firebase owns the
  // password and the two saves must never share a button. See `useChangePassword`.
  const password = useChangePassword();

  const original = useMemo<ProfileDraft>(
    () => ({
      firstName: account?.firstName ?? '',
      lastName: account?.lastName ?? '',
      phone: formatPhoneForDisplay(account?.phone),
      birthday: account?.birthday ?? '',
    }),
    [account?.firstName, account?.lastName, account?.phone, account?.birthday],
  );

  /**
   * Only what the client has actually typed. The form shown is `original` with those laid over it.
   *
   * Deliberately not a draft seeded from the account and re-synced by an effect: the identity
   * resolves a moment after this screen can mount, and refetches after every save, so a mirrored
   * draft needs an effect to catch up — which then has to decide whether to overwrite what
   * somebody is mid-way through typing. Holding the edits instead removes the question. A field
   * the client has not touched always shows the server's current value; one they have touched
   * always shows theirs.
   */
  const [edits, setEdits] = useState<Partial<ProfileDraft>>({});
  const [justSaved, setJustSaved] = useState(false);

  const draft = useMemo<ProfileDraft>(() => ({ ...original, ...edits }), [original, edits]);
  const touched = Object.keys(edits).length > 0;

  const mutation = useMutation({
    mutationFn: () =>
      updateProfile(apiClient, {
        userid: account!.userid,
        // The address exactly as the Dibs row holds it. Never the session's copy, never
        // lowercased — an identity write, so saving a profile cannot desynchronize Firebase from
        // Dibs. See the note in `src/api/endpoints/profile.ts`.
        email: account!.email ?? '',
        firstName: draft.firstName,
        lastName: draft.lastName,
        phone: normalizePhone(draft.phone),
        // Normalized on the way out, so `3/14` is stored in the same shape the widget writes and
        // the two surfaces never show one client's birthday two different ways.
        birthday: normalizeBirthday(draft.birthday),
      }),
    onSuccess: async () => {
      // Drop the edits and let the refetched account become the form again. If the server
      // normalized anything on the way in, this is where the client sees what it actually stored.
      setEdits({});
      setJustSaved(true);
      // Re-read rather than patch. Keyed by email, which is why it is not editable above.
      if (session?.email) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.accountByEmail(session.email) });
      }
    },
  });

  useEffect(() => {
    if (!justSaved) return;
    const timer = setTimeout(() => setJustSaved(false), SAVED_CONFIRMATION_MS);
    return () => clearTimeout(timer);
  }, [justSaved]);

  const { reset: resetMutation } = mutation;
  const onChange = useCallback(
    (field: keyof ProfileDraft, value: string) => {
      setJustSaved(false);
      // A stale refusal ("that number belongs to another account") must not sit under a field the
      // client is in the middle of correcting.
      resetMutation();
      setEdits((current) => ({ ...current, [field]: value }));
    },
    [resetMutation],
  );

  const onBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/account');
  }, []);

  if (status === 'guest') return <Redirect href="/sign-in" />;

  // Errors are computed on every render but only SHOWN once someone has typed — a form that
  // greets you in red has told you off for nothing.
  const errors = touched ? validateProfile(draft) : {};

  return (
    <ProfileScreen
      draft={draft}
      errors={errors}
      email={account?.email ?? null}
      studioName={config?.studioName ?? studio.appName}
      canSave={
        account !== null &&
        isProfileDirty(draft, original) &&
        !hasProfileErrors(validateProfile(draft))
      }
      isSaving={mutation.isPending}
      saveError={mutation.error ? describeApiError(mutation.error) : null}
      justSaved={justSaved}
      onChange={onChange}
      onSave={() => mutation.mutate()}
      onBack={onBack}
      passwordStatus={password.status}
      onChangePassword={password.change}
      onResetPassword={password.reset}
    />
  );
}
